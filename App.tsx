import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CreateJobModal from './components/CreateJobModal';
import JobDetailModal from './components/JobDetailModal';
import DatabaseSetupInstructionsModal from './components/DatabaseSetupInstructionsModal';
import CustomerList from './components/CustomerList';
import CustomerDetailModal from './components/CustomerDetailModal';
import SettingsPage from './components/SettingsPage';
import SalesRanking from './components/accounting/SalesRanking';
import CompanyAnalysisModal from './components/CompanyAnalysisModal';
// Component Imports
import BillingManagement from './components/accounting/BillingManagement';
import ApprovalWorkflowPage from './components/accounting/ApprovalWorkflowPage';
import JournalLedger from './components/accounting/JournalLedger';
import PurchasingManagement from './components/accounting/PurchasingManagement';
import GeneralLedger from './components/accounting/GeneralLedger';
import LaborCostManagement from './components/accounting/LaborCostManagement';
import ManufacturingCostManagement from './components/accounting/ManufacturingCostManagement';
import PlaceholderPage from './components/PlaceholderPage';
import UserManagementPage from './components/admin/UserManagementPage';
import ApprovalRouteManagementPage from './components/admin/ApprovalRouteManagementPage';
import EstimateCreationPage from './components/sales/EstimateCreationPage';
import LeadManagementPage from './components/sales/LeadManagementPage';
import CreateLeadModal from './components/sales/CreateLeadModal';
import InvoiceOCR from './components/InvoiceOCR';
import SalesPipelinePage from './components/sales/SalesPipelinePage';
import InventoryManagementPage from './components/inventory/InventoryManagementPage';
import TrialBalancePage from './components/accounting/TrialBalancePage';
import BusinessPlanPage from './components/accounting/BusinessPlanPage';
import { ToastContainer } from './components/Toast';
import ConfirmationDialog from './components/ConfirmationDialog';

import { Page, Job, JournalEntry, Customer, CompanyAnalysis, Invoice, User, Lead, AccountItem, PurchaseOrder, InventoryItem, Toast, ConfirmationDialogProps, InvoiceData, BankStatementTransaction } from './types';
import { getJobs, addJob, getJournalEntries, addJournalEntry as addJournalEntrySvc, getCustomers, addCustomer, updateCustomer, markInvoiceAsPaid, getLeads, addLead, updateLead, deleteLead, getAccountItems, updateJob, deleteJob, getPurchaseOrders, getInventoryItems, updateInboxItem, runDatabaseSetup, addJournalEntries } from './services/dataService';
import { analyzeCompany, getDashboardSuggestion } from './services/geminiService';
import { Loader, PlusCircle, AlertTriangle, RefreshCw } from './components/Icons';

const pageTitles: Record<Page, string> = {
  analysis_dashboard: 'ホーム',
  sales_leads: 'リード管理',
  sales_customers: '取引先',
  sales_pipeline: '販売パイプライン',
  sales_estimates: '見積作成',
  sales_orders: '案件・受注管理',
  sales_billing: '売上請求 (AR)',
  purchasing_orders: '発注管理 (PO)',
  accounting_inbox: 'AI受信箱',
  accounting_payable_list: '支払予定表 (AP)',
  inventory_management: '在庫管理',
  manufacturing_orders: '製造指示',
  manufacturing_progress: '進捗・出来高',
  manufacturing_cost: '製造原価',
  hr_attendance: '勤怠',
  hr_man_hours: '工数',
  hr_labor_cost: '人件費配賦',
  approval_list: '承認一覧',
  approval_form_expense: '経費精算',
  approval_form_transport: '交通費申請',
  approval_form_leave: '休暇申請',
  approval_form_approval: '稟議',
  approval_form_daily: '日報',
  approval_form_weekly: '週報',
  accounting_journal: '仕訳入力・確認',
  accounting_general_ledger: '総勘定元帳',
  accounting_trial_balance: '試算表',
  accounting_tax_summary: '消費税集計',
  accounting_period_closing: '月次・期末処理',
  accounting_business_plan: '経営計画',
  analysis_ranking: '売上ランキング',
  admin_audit_log: '監査ログ',
  admin_journal_queue: 'ジャーナル・キュー',
  admin_user_management: 'ユーザー管理',
  admin_route_management: '承認ルート管理',
  settings: '設定',
};

const ConnectionError = ({ onRetry }: { onRetry: () => void }) => (
    <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg mx-auto">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="mt-6 text-2xl font-bold text-slate-800 dark:text-white">データベース接続エラー</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          アプリケーションのデータベースに接続できませんでした。ネットワーク接続を確認するか、しばらくしてからもう一度お試しください。
        </p>
        <button 
          onClick={onRetry} 
          className="mt-8 flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-5 h-5" />
          <span>再試行</span>
        </button>
      </div>
    </div>
);

const demoUser: User = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  name: 'デモ管理者',
  role: 'admin',
  created_at: new Date().toISOString()
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('analysis_dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [accountItems, setAccountItems] = useState<AccountItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialogProps, setDialogProps] = useState<ConfirmationDialogProps>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, onClose: () => {}
  });

  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupError, setIsSetupError] = useState(false);
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [isAttemptingAutoSetup, setIsAttemptingAutoSetup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUser] = useState<User | null>(demoUser);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState<'view' | 'edit' | 'new'>('view');
  
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null);
  const [companyAnalysis, setCompanyAnalysis] = useState<CompanyAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [dashboardSuggestion, setDashboardSuggestion] = useState('');
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(true);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const requestConfirmation = useCallback((dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
    setDialogProps({ 
        ...dialog, 
        isOpen: true, 
        onClose: () => setDialogProps(prev => ({...prev, isOpen: false})) 
    });
  }, []);

  const fetchData = useCallback(async (isRetry = false) => {
    setIsLoading(true);
    setIsConnectionError(false);
    setIsSetupError(false);
    
    try {
      const [jobsData, journalEntriesData, customersData, leadsData, accountItemsData, purchaseOrdersData, inventoryItemsData] = await Promise.all([
        getJobs(),
        getJournalEntries(),
        getCustomers(),
        getLeads(),
        getAccountItems(),
        getPurchaseOrders(),
        getInventoryItems(),
      ]);
      setJobs(jobsData);
      setJournalEntries(journalEntriesData);
      setCustomers(customersData);
      setLeads(leadsData);
      setAccountItems(accountItemsData);
      setPurchaseOrders(purchaseOrdersData);
      setInventoryItems(inventoryItemsData);
      setIsAttemptingAutoSetup(false);

      setIsSuggestionLoading(true);
      getDashboardSuggestion(jobsData)
        .then(setDashboardSuggestion)
        .catch(console.error)
        .finally(() => setIsSuggestionLoading(false));

    } catch (e) {
      console.error(e);
      if (e instanceof Error && (e.message.includes('relation') && e.message.includes('does not exist') || e.message.includes('42P01')) && !isRetry) {
        setIsAttemptingAutoSetup(true);
        try {
          await runDatabaseSetup();
          addToast('データベースの自動セットアップが完了しました。データを再取得します。', 'success');
          await fetchData(true);
        } catch (setupError) {
          addToast('データベースの自動セットアップに失敗しました。手動での設定が必要です。', 'error');
          console.error('Auto-setup failed:', setupError);
          setIsSetupError(true);
          setIsAttemptingAutoSetup(false);
        }
      } else {
        setIsConnectionError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSearchTerm('');
  }, [currentPage]);

  const handleNavigate = useCallback((page: Page) => {
    if (page !== currentPage) {
        setCurrentPage(page);
    }
  }, [currentPage]);

  const handleAddJob = useCallback(async (job: Omit<Job, 'createdAt' | 'id'>) => {
    const newJob = await addJob({
      ...job,
      id: `job_${crypto.randomUUID()}`
    });
    setJobs(prevJobs => [newJob, ...prevJobs]);
    addToast('新しい案件が追加されました。', 'success');
  }, [addToast]);

  const handleUpdateJob = useCallback(async (jobId: string, updatedData: Partial<Job>) => {
    const updatedJob = await updateJob(jobId, updatedData);
    setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    if (selectedJob?.id === jobId) {
      setSelectedJob(updatedJob);
    }
    addToast('案件情報が更新されました。', 'success');
  }, [selectedJob, addToast]);

  const handleDeleteJob = useCallback(async (jobId: string) => {
    await deleteJob(jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setIsJobDetailModalOpen(false);
    setSelectedJob(null);
    addToast('案件が削除されました。', 'success');
  }, [addToast]);

  const handleSelectJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setIsJobDetailModalOpen(true);
  }, []);

  const handleAddJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'date' | 'status'>) => {
    const newEntry = await addJournalEntrySvc(entry);
    setJournalEntries(prev => [newEntry, ...prev]);
    addToast('新しい仕訳が追加されました。', 'success');
  }, [addToast]);
  
  const handleSaveExpenseInvoice = useCallback(async (data: InvoiceData, inboxItemId: string) => {
    const description = `仕入 ${data.vendorName} (${data.description})`;
    const account = data.account || '仕入';
    
    const entriesToAdd: Omit<JournalEntry, 'id' | 'date' | 'status'>[] = [
        { account, debit: data.totalAmount, credit: 0, description },
        { account: '買掛金', debit: 0, credit: data.totalAmount, description }
    ];

    const newEntries = await addJournalEntries(entriesToAdd);
    setJournalEntries(prev => [...newEntries.reverse(), ...prev]);
    
    await updateInboxItem(inboxItemId, { status: 'approved' });
    addToast(`「${data.vendorName}」からの請求書が仕入計上されました。`, 'success');
  }, [addToast]);

  const handleProcessBankStatement = useCallback(async (transactions: BankStatementTransaction[], inboxItemId: string) => {
    try {
        const entriesToAdd: Omit<JournalEntry, 'id' | 'date' | 'status'>[] = [];
        for (const t of transactions) {
            if (!t.finalAccount) {
                addToast(`「${t.description}」の勘定科目が未入力のためスキップしました。`, 'info');
                continue;
            }

            if (t.withdrawal > 0) {
                entriesToAdd.push({ account: t.finalAccount, debit: t.withdrawal, credit: 0, description: t.description });
                entriesToAdd.push({ account: '普通預金', debit: 0, credit: t.withdrawal, description: t.description });
            } else if (t.deposit > 0) {
                entriesToAdd.push({ account: '普通預金', debit: t.deposit, credit: 0, description: t.description });
                entriesToAdd.push({ account: t.finalAccount, debit: 0, credit: t.deposit, description: t.description });
            }
        }

        if (entriesToAdd.length > 0) {
            const newEntries = await addJournalEntries(entriesToAdd);
            setJournalEntries(prev => [...newEntries.reverse(), ...prev]);
        }
        
        await updateInboxItem(inboxItemId, { status: 'approved' });
        addToast('銀行明細の仕訳が作成されました。', 'success');
    } catch (e) {
        addToast('銀行明細の処理に失敗しました。', 'error');
        console.error(e);
    }
  }, [addToast]);

  const handleMarkInvoicePaid = useCallback(async (invoice: Invoice) => {
    try {
        await markInvoiceAsPaid(invoice.id);
        const jobIdsInInvoice = invoice.items?.map(item => item.jobId).filter(Boolean) as string[] || [];
        const jobsToUpdate = jobs.filter(job => jobIdsInInvoice.includes(job.id));

        const entriesToAdd: Omit<JournalEntry, 'id' | 'date' | 'status'>[] = [];
        for (const updatedJob of jobsToUpdate) {
            entriesToAdd.push({ account: '普通預金', debit: updatedJob.price, credit: 0, description: `売上入金 ${updatedJob.clientName} (${updatedJob.id})` });
            entriesToAdd.push({ account: '売掛金', debit: 0, credit: updatedJob.price, description: `売上入金 ${updatedJob.clientName} (${updatedJob.id})` });
        }

        if (entriesToAdd.length > 0) {
          await addJournalEntries(entriesToAdd);
        }

        addToast('請求書の入金処理が完了しました。', 'success');
        await fetchData();
    } catch (e) {
        addToast('請求書の入金処理に失敗しました。', 'error');
    }
  }, [jobs, fetchData, addToast]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerModalMode('view');
    setIsCustomerModalOpen(true);
  }, []);
  
  const handleEditCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerModalMode('edit');
    setIsCustomerModalOpen(true);
  }, []);

  const handleNewCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerModalMode('new');
    setIsCustomerModalOpen(true);
  }, []);

  const handleCloseCustomerModal = useCallback(() => {
    setIsCustomerModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  const handleSaveCustomer = useCallback(async (customerData: Partial<Customer>) => {
    if (customerModalMode === 'new') {
      const newCustomer = await addCustomer(customerData as Omit<Customer, 'id' | 'createdAt'>);
      setCustomers(prev => [newCustomer, ...prev]);
      addToast('新規顧客が登録されました。', 'success');
    } else if (customerModalMode === 'edit' && selectedCustomer) {
      const updatedCustomer = await updateCustomer(selectedCustomer.id, customerData);
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      addToast('顧客情報が更新されました。', 'success');
    }
    handleCloseCustomerModal();
  }, [customerModalMode, selectedCustomer, handleCloseCustomerModal, addToast]);

  const handleAnalyzeCustomer = useCallback(async (customer: Customer) => {
    setTargetCustomer(customer);
    setIsAnalysisModalOpen(true);
    setIsAiLoading(true);
    setAiError('');
    setCompanyAnalysis(null);
    try {
        const analysis = await analyzeCompany(customer);
        setCompanyAnalysis(analysis);
    } catch (e) {
        if (e instanceof Error) setAiError(e.message);
        else setAiError('不明なエラーが発生しました。');
    } finally {
        setIsAiLoading(false);
    }
  }, []);

  const handleAddLead = useCallback(async (leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
        const newLead = await addLead(leadData);
        setLeads(prev => [newLead, ...prev]);
        addToast('新規リードが追加されました。', 'success');
    } catch (e) {
        console.error("Failed to add lead:", e);
        addToast('リードの追加に失敗しました。', 'error');
    }
  }, [addToast]);
  
  const handleUpdateLead = useCallback(async (leadId: string, updatedData: Partial<Lead>) => {
      try {
          const updatedLead = await updateLead(leadId, updatedData);
          setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
          addToast('リード情報が更新されました。', 'success');
      } catch (e) {
          console.error("Failed to update lead:", e);
          addToast('リードの更新に失敗しました。', 'error');
      }
  }, [addToast]);

  const handleDeleteLead = useCallback(async (leadId: string) => {
      try {
          await deleteLead(leadId);
          setLeads(prev => prev.filter(l => l.id !== leadId));
          addToast('リードが削除されました。', 'success');
      } catch (e) {
          console.error("Failed to delete lead:", e);
          addToast('リードの削除に失敗しました。', 'error');
      }
  }, [addToast]);


  const getHeaderConfig = () => {
    let primaryAction;
    let search;

    switch (currentPage) {
      case 'sales_leads':
         primaryAction = { label: '新規作成', onClick: () => setIsCreateLeadModalOpen(true), icon: PlusCircle };
        search = { value: searchTerm, onChange: setSearchTerm, placeholder: '名前、会社名、ステータスで検索...' };
        break;
      case 'sales_estimates':
        search = { value: searchTerm, onChange: setSearchTerm, placeholder: '顧客名・件名で検索...' };
        break;
      case 'sales_orders':
        primaryAction = { label: '新規案件作成', onClick: () => setIsCreateJobModalOpen(true), icon: PlusCircle };
        search = { value: searchTerm, onChange: setSearchTerm, placeholder: 'クライアント名・案件名で検索...' };
        break;
      case 'sales_customers':
        primaryAction = { label: '新規顧客登録', onClick: handleNewCustomer, icon: PlusCircle };
        search = { value: searchTerm, onChange: setSearchTerm, placeholder: '顧客名・担当者・電話番号で検索...' };
        break;
      case 'approval_list':
        search = { value: searchTerm, onChange: setSearchTerm, placeholder: '申請者、種別、ステータスで検索...' };
        break;
    }
    return { primaryAction, search };
  };
  
  const { primaryAction, search } = getHeaderConfig();

  const renderPage = () => {
    if (isLoading && !isAttemptingAutoSetup) {
      return <div className="flex items-center justify-center h-full"><Loader className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }
    
    switch (currentPage) {
      case 'analysis_dashboard':
        return <Dashboard jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} suggestion={dashboardSuggestion} isSuggestionLoading={isSuggestionLoading} />;
      case 'sales_leads':
        return <LeadManagementPage leads={leads} searchTerm={searchTerm} onRefresh={fetchData} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} />;
      case 'sales_pipeline':
        return <SalesPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={handleSelectJob} />;
      case 'sales_orders':
        return <JobList jobs={jobs} searchTerm={searchTerm} onSelectJob={handleSelectJob} onNewJob={() => setIsCreateJobModalOpen(true)} />;
      case 'sales_customers':
        return <CustomerList customers={customers} searchTerm={searchTerm} onSelectCustomer={handleSelectCustomer} onEditCustomer={handleEditCustomer} onAnalyzeCustomer={handleAnalyzeCustomer} addToast={addToast} currentUser={currentUser} />;
      case 'accounting_journal':
        return <JournalLedger entries={journalEntries} onAddEntry={handleAddJournalEntry} />;
      case 'analysis_ranking':
        return <SalesRanking jobs={jobs} />;
      case 'settings':
        return <SettingsPage addToast={addToast} />;
      case 'sales_billing':
        return <BillingManagement jobs={jobs} onRefreshData={fetchData} onMarkPaid={handleMarkInvoicePaid} addToast={addToast} />;
      case 'purchasing_orders':
          return <PurchasingManagement purchaseOrders={purchaseOrders} />;
      case 'inventory_management':
        return <InventoryManagementPage inventoryItems={inventoryItems} />;
      case 'accounting_general_ledger':
          return <GeneralLedger entries={journalEntries} accountItems={accountItems} />;
      case 'accounting_trial_balance':
          return <TrialBalancePage journalEntries={journalEntries} />;
      case 'accounting_business_plan':
          return <BusinessPlanPage />;
      case 'hr_labor_cost':
          return <LaborCostManagement employees={[]} />;
      case 'manufacturing_cost':
          return <ManufacturingCostManagement jobs={jobs} />;
      case 'approval_list':
        return <ApprovalWorkflowPage currentUser={currentUser} view="list" searchTerm={searchTerm} addToast={addToast} onNavigate={handleNavigate} />;
      case 'approval_form_expense':
          return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="EXP" addToast={addToast} onNavigate={handleNavigate} />;
      case 'approval_form_transport':
          return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="TRP" addToast={addToast} onNavigate={handleNavigate} />;
      case 'approval_form_leave':
          return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="LEV" addToast={addToast} onNavigate={handleNavigate} />;
      case 'approval_form_approval':
          return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="APL" addToast={addToast} onNavigate={handleNavigate} />;
      case 'approval_form_daily':
          return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="DLY" addToast={addToast} onNavigate={handleNavigate} />;
      case 'approval_form_weekly':
          return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="WKR" addToast={addToast} onNavigate={handleNavigate} />;
      case 'accounting_inbox':
        return <InvoiceOCR onSaveExpenses={handleSaveExpenseInvoice} onProcessBankStatement={handleProcessBankStatement} addToast={addToast} requestConfirmation={requestConfirmation} />;
      case 'accounting_payable_list':
          return <PlaceholderPage title={pageTitles[currentPage]} />;
      case 'admin_user_management':
          return <UserManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
      case 'admin_route_management':
          return <ApprovalRouteManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
      case 'sales_estimates':
        return <EstimateCreationPage customers={customers} onAddJob={handleAddJob} onNavigate={handleNavigate} addToast={addToast} />;
      default:
        return <PlaceholderPage title={pageTitles[currentPage]} />;
    }
  };
  
  if (isAttemptingAutoSetup) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
            <Loader className="w-12 h-12 animate-spin text-blue-600" />
            <h2 className="mt-6 text-xl font-semibold text-slate-700 dark:text-slate-200">データベースを自動セットアップ中です...</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">初回起動時、またはスキーマが古くなっている場合にこの処理が実行されます。</p>
        </div>
    );
  }

  if (isConnectionError) {
    return <ConnectionError onRetry={fetchData} />;
  }
  
  if (isSetupError) {
    return <DatabaseSetupInstructionsModal onRetry={fetchData} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} currentUser={currentUser} />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-8 flex-1 flex flex-col">
          <Header title={pageTitles[currentPage]} primaryAction={primaryAction} search={search} />
          <div className="mt-8 flex-1">
            {renderPage()}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmationDialog {...dialogProps} />
      
      {isCreateJobModalOpen && <CreateJobModal isOpen={isCreateJobModalOpen} onClose={() => setIsCreateJobModalOpen(false)} onAddJob={handleAddJob} />}
      {isJobDetailModalOpen && <JobDetailModal job={selectedJob} isOpen={isJobDetailModalOpen} onClose={() => setIsJobDetailModalOpen(false)} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} requestConfirmation={requestConfirmation} />}
      {isCreateLeadModalOpen && <CreateLeadModal isOpen={isCreateLeadModalOpen} onClose={() => setIsCreateLeadModalOpen(false)} onAddLead={handleAddLead} />}
      {isCustomerModalOpen && <CustomerDetailModal customer={selectedCustomer} mode={customerModalMode} onClose={handleCloseCustomerModal} onSave={handleSaveCustomer} onSetMode={setCustomerModalMode} onAnalyzeCustomer={handleAnalyzeCustomer}/>}
      {isAnalysisModalOpen && <CompanyAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} analysis={companyAnalysis} customerName={targetCustomer?.customerName || ''} isLoading={isAiLoading} error={aiError} />}
    </div>
  );
}

export default App;