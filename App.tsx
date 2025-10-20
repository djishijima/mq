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
import PaymentManagement from './components/accounting/PaymentManagement';
import ApprovalWorkflowPage from './components/accounting/ApprovalWorkflowPage';
import JournalLedger from './components/accounting/JournalLedger';
import PurchasingManagement from './components/accounting/PurchasingManagement';
import GeneralLedger from './components/accounting/GeneralLedger';
import LaborCostManagement from './components/accounting/LaborCostManagement';
import ManufacturingCostManagement from './components/accounting/ManufacturingCostManagement';
import PlaceholderPage from './components/PlaceholderPage';
import UserManagementPage from './components/admin/UserManagementPage';
import ApprovalRouteManagementPage from './components/admin/ApprovalRouteManagementPage';
import BugReportList from './components/admin/BugReportList';
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
import SupabaseCredentialsModal from './components/SupabaseCredentialsModal';
import PeriodClosingPage from './components/accounting/PeriodClosingPage';
import BugReportChatModal from './components/BugReportChatModal';

import { Page, Job, JournalEntry, Customer, CompanyAnalysis, Invoice, User, Lead, AccountItem, PurchaseOrder, InventoryItem, Toast, ConfirmationDialogProps, InvoiceData, Employee, ApplicationWithDetails, BugReport } from './types';
import { getJobs, addJob, getJournalEntries, addJournalEntry as addJournalEntrySvc, getCustomers, addCustomer, updateCustomer, markInvoiceAsPaid, getLeads, addLead, updateLead, deleteLead, getAccountItems, updateJob, deleteJob, getPurchaseOrders, getInventoryItems, getEmployees, getUsers, getApplications, getBugReports, addBugReport, updateBugReport } from './services/dataService';
import { initializeSupabase, hasSupabaseCredentials, clearSupabaseCredentials } from './services/supabaseClient';
import { analyzeCompany, getDashboardSuggestion } from './services/geminiService';
import { Loader, PlusCircle, Bug } from './components/Icons';

const pageTitles: Record<Page, string> = {
  analysis_dashboard: 'ホーム',
  sales_leads: 'リード管理',
  sales_customers: '取引先',
  sales_pipeline: '販売パイプライン',
  sales_estimates: '見積作成',
  sales_orders: '案件・受注管理',
  sales_billing: '売上請求 (AR)',
  purchasing_orders: '発注管理 (PO)',
  purchasing_invoices: '仕入計上 (AP)',
  purchasing_payments: '支払管理',
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
  accounting_journal: '仕訳帳',
  accounting_general_ledger: '総勘定元帳',
  accounting_trial_balance: '試算表',
  accounting_tax_summary: '消費税集計',
  accounting_period_closing: '締処理',
  accounting_business_plan: '経営計画',
  analysis_ranking: '売上ランキング',
  admin_audit_log: '監査ログ',
  admin_journal_queue: 'ジャーナル・キュー',
  admin_user_management: 'ユーザー管理',
  admin_route_management: '承認ルート管理',
  admin_bug_reports: '改善要望一覧',
  settings: '設定',
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
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
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

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
  const [isBugReportModalOpen, setIsBugReportModalOpen] = useState(false);

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

  const fetchData = useCallback(async () => {
    if (!hasSupabaseCredentials()) {
      const defaultUrl = 'https://rwjhpfghhgstvplmggks.supabase.co';
      const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3amhwZmdoaGdzdHZwbG1nZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDgzNDYsImV4cCI6MjA3NDI4NDM0Nn0.RfCRooN6YVTHJ2Mw-xFCWus3wUVMLkJCLSitB8TNiIo';
      initializeSupabase(defaultUrl, defaultKey);
      addToast('提供された接続情報を保存しました。データの読み込みを開始します。', 'info');
    }

    setIsLoading(true);
    setIsSetupError(false);
    
    try {
      const [jobsData, journalEntriesData, customersData, leadsData, accountItemsData, purchaseOrdersData, inventoryItemsData, employeesData, usersData, applicationsData, bugReportsData] = await Promise.all([
        getJobs(),
        getJournalEntries(),
        getCustomers(),
        getLeads(),
        getAccountItems(),
        getPurchaseOrders(),
        getInventoryItems(),
        getEmployees(),
        getUsers(),
        getApplications(null), // Fetch all applications initially
        getBugReports(),
      ]);
      setJobs(jobsData);
      setJournalEntries(journalEntriesData);
      setCustomers(customersData);
      setLeads(leadsData);
      setAccountItems(accountItemsData);
      setPurchaseOrders(purchaseOrdersData);
      setInventoryItems(inventoryItemsData);
      setEmployees(employeesData);
      setAllUsers(usersData);
      setApplications(applicationsData);
      setBugReports(bugReportsData);

      if (usersData.length > 0) {
        if (!currentUser || !usersData.find(u => u.id === currentUser.id)) {
            const adminUser = usersData.find(u => u.role === 'admin');
            setCurrentUser(adminUser || usersData[0]);
        }
      } else {
        setCurrentUser(null);
      }
      
      setIsCredentialsModalOpen(false);

      setIsSuggestionLoading(true);
      getDashboardSuggestion(jobsData)
        .then(setDashboardSuggestion)
        .catch(console.error)
        .finally(() => setIsSuggestionLoading(false));

    } catch (e) {
      console.error("Fetch Data Error:", e);
      const errorMessage = e instanceof Error ? e.message.toLowerCase() : '';
      
      if (
        errorMessage.includes('invalid jwt') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('api key')
      ) {
        addToast('データベースの認証に失敗しました。接続情報が正しいか確認してください。', 'error');
        clearSupabaseCredentials(); 
        setIsCredentialsModalOpen(true);
      } else {
        setIsSetupError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [addToast, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveCredentials = (url: string, key: string) => {
    initializeSupabase(url, key);
    setIsCredentialsModalOpen(false);
    fetchData();
  };

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

  const handleAddJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    const newEntry = await addJournalEntrySvc(entry);
    setJournalEntries(prev => [newEntry, ...prev]);
    addToast('新しい仕訳が追加されました。', 'success');
  }, [addToast]);
  
  const handleSaveExpenseInvoice = useCallback(async (data: InvoiceData) => {
    const description = `仕入 ${data.vendorName} (${data.description})`;
    const account = data.account || '仕入';
    await addJournalEntrySvc({ account, debit: data.totalAmount, credit: 0, description });
    await addJournalEntrySvc({ account: '買掛金', debit: 0, credit: data.totalAmount, description });
    addToast(`「${data.vendorName}」からの請求書が仕入計上されました。`, 'success');
    fetchData();
  }, [fetchData, addToast]);

  const handleExecutePayment = useCallback(async (supplier: string, amount: number) => {
      const description = `支払 ${supplier}`;
      await addJournalEntrySvc({ account: '買掛金', debit: amount, credit: 0, description });
      await addJournalEntrySvc({ account: '現金', debit: 0, credit: amount, description });
      addToast(`${supplier}への支払処理が完了しました。`, 'success');
      fetchData();
  }, [fetchData, addToast]);


  const handleMarkInvoicePaid = useCallback(async (invoice: Invoice) => {
    try {
        await markInvoiceAsPaid(invoice.id);
        const jobIdsInInvoice = invoice.items?.map(item => item.job_id).filter(Boolean) as string[] || [];
        const jobsToUpdate = jobs.filter(job => jobIdsInInvoice.includes(job.id));

        for (const updatedJob of jobsToUpdate) {
            await handleAddJournalEntry({ account: '現金', debit: updatedJob.price, credit: 0, description: `売上入金 ${updatedJob.clientName} (${updatedJob.id})` });
            await handleAddJournalEntry({ account: '売掛金', debit: 0, credit: updatedJob.price, description: `売上入金 ${updatedJob.clientName} (${updatedJob.id})` });
        }
        addToast('請求書の入金処理が完了しました。', 'success');
        await fetchData();
    } catch (e) {
        addToast('請求書の入金処理に失敗しました。', 'error');
    }
  }, [jobs, handleAddJournalEntry, fetchData, addToast]);
  
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

  const handleAddLead = useCallback(async (leadData: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>) => {
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

  const handleAddBugReport = useCallback(async (reportData: Omit<BugReport, 'id' | 'created_at' | 'status' | 'reporter_name'>) => {
    if (!currentUser) {
      addToast('レポートを送信するにはログインしている必要があります。', 'error');
      return;
    }
    try {
      await addBugReport({ ...reportData, reporter_name: currentUser.name });
      addToast('ご報告ありがとうございます！', 'success');
      fetchData(); // This will refetch all data including bug reports
    } catch (error) {
      addToast('レポートの送信に失敗しました。', 'error');
    }
  }, [addToast, currentUser, fetchData]);

  const handleUpdateBugReport = useCallback(async (reportId: string, updates: Partial<BugReport>) => {
      try {
          await updateBugReport(reportId, updates);
          addToast('レポートのステータスを更新しました。', 'success');
          await fetchData();
      } catch(e) {
          addToast('レポートの更新に失敗しました。', 'error');
      }
  }, [addToast, fetchData]);


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
      case 'admin_bug_reports':
        search = { value: searchTerm, onChange: setSearchTerm, placeholder: '報告者、概要、種別で検索...' };
        break;
    }
    return { primaryAction, search };
  };
  
  const { primaryAction, search } = getHeaderConfig();

  const renderPage = () => {
    if (isLoading) {
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
        return <CustomerList customers={customers} searchTerm={searchTerm} onSelectCustomer={handleSelectCustomer} onEditCustomer={handleEditCustomer} onAnalyzeCustomer={handleAnalyzeCustomer} addToast={addToast} currentUser={currentUser} onNewCustomer={handleNewCustomer} />;
      case 'accounting_journal':
        return <JournalLedger entries={journalEntries} onAddEntry={handleAddJournalEntry} />;
      case 'analysis_ranking':
        return <SalesRanking jobs={jobs} />;
      case 'settings':
        return <SettingsPage addToast={addToast} />;
      case 'sales_billing':
        return <BillingManagement jobs={jobs} onRefreshData={fetchData} onMarkPaid={handleMarkInvoicePaid} />;
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
      case 'accounting_period_closing':
          return <PeriodClosingPage addToast={addToast} jobs={jobs} applications={applications} journalEntries={journalEntries} onNavigate={handleNavigate} />;
      case 'hr_labor_cost':
          return <LaborCostManagement employees={employees} />;
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
      case 'purchasing_invoices':
        return <InvoiceOCR onSaveExpenses={handleSaveExpenseInvoice} addToast={addToast} requestConfirmation={requestConfirmation} />;
      case 'purchasing_payments':
          return <PaymentManagement journalEntries={journalEntries} onExecutePayment={handleExecutePayment} />;
      case 'admin_user_management':
          return <UserManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
      case 'admin_route_management':
          return <ApprovalRouteManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
      case 'admin_bug_reports':
          return <BugReportList reports={bugReports} onUpdateReport={handleUpdateBugReport} searchTerm={searchTerm} />;
      case 'sales_estimates':
        return <EstimateCreationPage customers={customers} onAddJob={handleAddJob} onNavigate={handleNavigate} addToast={addToast} />;
      default:
        return <PlaceholderPage title={pageTitles[currentPage]} />;
    }
  };

  if (isCredentialsModalOpen && !isSetupError) {
    return <SupabaseCredentialsModal onSave={handleSaveCredentials} onShowSetup={() => setIsSetupError(true)} />;
  }
  
  if (isSetupError) {
    return <DatabaseSetupInstructionsModal onRetry={fetchData} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        currentUser={currentUser} 
        allUsers={allUsers}
        onUserChange={setCurrentUser}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-red-600 text-white p-3 rounded-lg flex items-center justify-between gap-4 mb-8 shadow-lg mx-8 mt-8">
            <div className="flex items-center gap-3">
                <Bug className="w-6 h-6" />
                <span className="font-medium">サイトの改善にご協力ください</span>
            </div>
            <button
              onClick={() => setIsBugReportModalOpen(true)}
              className="bg-white text-red-600 font-bold py-1.5 px-4 rounded-md flex items-center gap-2 transition-transform transform hover:scale-105"
            >
              <span>バグ報告・改善要望</span>
            </button>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto px-8 pb-8">
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
      {isBugReportModalOpen && <BugReportChatModal isOpen={isBugReportModalOpen} onClose={() => setIsBugReportModalOpen(false)} onReportSubmit={handleAddBugReport} />}
    </div>
  );
}

export default App;
