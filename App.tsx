import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CreateJobModal from './components/CreateJobModal';
import JobDetailModal from './components/JobDetailModal';
import CustomerList from './components/CustomerList';
import CustomerDetailModal from './components/CustomerDetailModal';
import CompanyAnalysisModal from './components/CompanyAnalysisModal';
import LeadManagementPage from './components/sales/LeadManagementPage';
import CreateLeadModal from './components/sales/CreateLeadModal';
import PlaceholderPage from './components/PlaceholderPage';
import UserManagementPage from './components/admin/UserManagementPage';
import ApprovalRouteManagementPage from './components/admin/ApprovalRouteManagementPage';
import BugReportList from './components/admin/BugReportList';
import BugReportChatModal from './components/BugReportChatModal';
import SettingsPage from './components/SettingsPage';
import AccountingPage from './components/Accounting';
import SalesPipelinePage from './components/sales/SalesPipelinePage';
import InventoryManagementPage from './components/inventory/InventoryManagementPage';
import CreateInventoryItemModal from './components/inventory/CreateInventoryItemModal';
import ManufacturingPipelinePage from './components/manufacturing/ManufacturingPipelinePage';
import ManufacturingOrdersPage from './components/manufacturing/ManufacturingOrdersPage';
import PurchasingManagementPage from './components/purchasing/PurchasingManagementPage';
import CreatePurchaseOrderModal from './components/purchasing/CreatePurchaseOrderModal';
import EstimateManagementPage from './components/sales/EstimateManagementPage';
import SalesRanking from './components/accounting/SalesRanking';
import BusinessPlanPage from './components/accounting/BusinessPlanPage';
import ApprovalWorkflowPage from './components/accounting/ApprovalWorkflowPage';
import DemoModeBanner from './components/DemoModeBanner';
import SupabaseCredentialsModal from './components/SupabaseCredentialsModal';
import DatabaseSetupInstructionsModal from './components/DatabaseSetupInstructionsModal';
import { ToastContainer } from './components/Toast';
import ConfirmationDialog from './components/ConfirmationDialog';

import * as dataService from './services/dataService';
import * as geminiService from './services/geminiService';
import { hasSupabaseCredentials, initializeSupabase } from './services/supabaseClient';

import { Page, Job, Customer, JournalEntry, User, AccountItem, Lead, ApprovalRoute, PurchaseOrder, InventoryItem, Employee, Toast, ConfirmationDialogProps, BugReport, Estimate, Invoice, EmployeeUser } from './types';
import { PlusCircle, Loader } from './components/Icons';

const PAGE_TITLES: Record<Page, string> = {
    analysis_dashboard: 'ホーム',
    sales_dashboard: '販売ダッシュボード',
    sales_leads: 'リード管理',
    sales_customers: '取引先管理',
    sales_pipeline: 'パイプライン（進捗）',
    sales_estimates: '見積管理',
    sales_orders: '案件・受注管理',
    sales_billing: '売上請求 (AR)',
    analysis_ranking: '売上ランキング',
    purchasing_orders: '発注 (PO)',
    purchasing_invoices: '仕入計上 (AP)',
    purchasing_payments: '支払管理',
    inventory_management: '在庫管理',
    manufacturing_orders: '製造指示',
    manufacturing_progress: '製造パイプライン',
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
    admin_audit_log: '監査ログ',
    admin_journal_queue: 'ジャーナル・キュー',
    admin_user_management: 'ユーザー管理',
    admin_route_management: '承認ルート管理',
    admin_bug_reports: '改善要望一覧',
    settings: '設定',
};


const App: React.FC = () => {
    // Global State
    const [currentPage, setCurrentPage] = useState<Page>('analysis_dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<EmployeeUser | null>(null);
    const [allUsers, setAllUsers] = useState<EmployeeUser[]>([]);
    
    // Data State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [accountItems, setAccountItems] = useState<AccountItem[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRoute[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [bugReports, setBugReports] = useState<BugReport[]>([]);
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);
    const [showDbCredentialsModal, setShowDbCredentialsModal] = useState(!hasSupabaseCredentials());
    const [showDbSetupModal, setShowDbSetupModal] = useState(false);
    const [isCreateJobModalOpen, setCreateJobModalOpen] = useState(false);
    const [isCreateLeadModalOpen, setCreateLeadModalOpen] = useState(false);
    const [isCreatePOModalOpen, setCreatePOModalOpen] = useState(false);
    const [isCreateInventoryItemModalOpen, setIsCreateInventoryItemModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isJobDetailModalOpen, setJobDetailModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerModalMode, setCustomerModalMode] = useState<'view' | 'edit' | 'new'>('view');
    const [isCustomerDetailModalOpen, setCustomerDetailModalOpen] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [companyAnalysis, setCompanyAnalysis] = useState(null);
    const [isAnalysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [isBugReportModalOpen, setIsBugReportModalOpen] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogProps>({ isOpen: false, title: '', message: '', onConfirm: () => {}, onClose: () => {} });
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);

    // Navigation and Modals
    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
        setSearchTerm('');
    };

    const addToast = (message: string, type: Toast['type']) => {
        const newToast: Toast = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
    };

    const dismissToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    
    const requestConfirmation = (dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
        setConfirmationDialog({ ...dialog, isOpen: true, onClose: () => setConfirmationDialog(prev => ({ ...prev, isOpen: false })) });
    };

    const loadAllData = useCallback(async () => {
        if (!hasSupabaseCredentials()) {
            setShowDbCredentialsModal(true);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setDbError(null);
            
            const usersData = await dataService.getUsers();
            setAllUsers(usersData);
            if (!currentUser && usersData.length > 0) {
                setCurrentUser(usersData[0]);
            }
            
            const [
                jobsData, customersData, journalData, accountItemsData, 
                leadsData, routesData, poData, inventoryData, employeesData, 
                bugReportsData, estimatesData
            ] = await Promise.all([
                dataService.getJobs(), dataService.getCustomers(), dataService.getJournalEntries(),
                dataService.getAccountItems(), dataService.getLeads(), dataService.getApprovalRoutes(),
                dataService.getPurchaseOrders(), dataService.getInventoryItems(), dataService.getEmployees(),
                dataService.getBugReports(), dataService.getEstimates()
            ]);
            
            setJobs(jobsData);
            setCustomers(customersData);
            setJournalEntries(journalData);
            setAccountItems(accountItemsData);
            setLeads(leadsData);
            setApprovalRoutes(routesData);
            setPurchaseOrders(poData);
            setInventoryItems(inventoryData);
            setEmployees(employeesData);
            setBugReports(bugReportsData);
            setEstimates(estimatesData);
            
            if (currentUser) {
                 const applicationsData = await dataService.getApplications(null); // Passing null for now
                 setApplications(applicationsData);
            }

        } catch (error: any) {
            console.error("Failed to load data:", error);
            setDbError(error.message || "データベースへの接続に失敗しました。");
            setShowDbCredentialsModal(true); // Force re-entry of credentials on error
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);


    useEffect(() => {
        loadAllData();
    }, [loadAllData]);
    
    useEffect(() => {
        if (currentPage === 'analysis_dashboard' && jobs.length > 0) {
            setIsSuggestionLoading(true);
            geminiService.getDashboardSuggestion(jobs)
                .then(setAiSuggestion)
                .catch(console.error)
                .finally(() => setIsSuggestionLoading(false));
        }
    }, [currentPage, jobs]);

    // Data Handlers
    const handleAddJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'jobNumber'>) => {
        await dataService.addJob(jobData);
        addToast('案件が正常に追加されました。', 'success');
        await loadAllData();
    };
    const handleUpdateJob = async (jobId: string, updatedData: Partial<Job>) => {
        await dataService.updateJob(jobId, updatedData);
        addToast('案件が更新されました。', 'success');
        await loadAllData();
    };
    const handleDeleteJob = async (jobId: string) => {
        await dataService.deleteJob(jobId);
        addToast('案件が削除されました。', 'success');
        setJobDetailModalOpen(false);
        await loadAllData();
    };
     const handleAddLead = async (leadData: Partial<Lead>) => {
        await dataService.addLead(leadData);
        addToast('リードが追加されました。', 'success');
        setCreateLeadModalOpen(false);
        await loadAllData();
    };
    const handleUpdateLead = async (leadId: string, updatedData: Partial<Lead>) => {
        await dataService.updateLead(leadId, updatedData);
        addToast('リードが更新されました。', 'success');
        await loadAllData();
    };
    const handleDeleteLead = async (leadId: string) => {
        await dataService.deleteLead(leadId);
        addToast('リードが削除されました。', 'success');
        await loadAllData();
    };
    const handleSaveCustomer = async (customerData: Partial<Customer>) => {
        if (customerData.id) {
            await dataService.updateCustomer(customerData.id, customerData);
            addToast('顧客情報が更新されました。', 'success');
        } else {
            await dataService.addCustomer(customerData);
            addToast('新規顧客が登録されました。', 'success');
        }
        setCustomerDetailModalOpen(false);
        await loadAllData();
    };

    const handleUpdateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
        await dataService.updateCustomer(customerId, customerData);
        addToast('顧客情報が更新されました。', 'success');
        await loadAllData();
    };

    const handleAddPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id'>) => {
        await dataService.addPurchaseOrder(orderData);
        addToast('発注が追加されました。', 'success');
        setCreatePOModalOpen(false);
        await loadAllData();
    };

    const handleSaveInventoryItem = async (itemData: Partial<InventoryItem>) => {
        if (itemData.id) {
            await dataService.updateInventoryItem(itemData.id, itemData);
            addToast('在庫品目が更新されました。', 'success');
        } else {
            await dataService.addInventoryItem(itemData as Omit<InventoryItem, 'id'>);
            addToast('在庫品目が追加されました。', 'success');
        }
        setIsCreateInventoryItemModalOpen(false);
        await loadAllData();
    };


    const handleAnalyzeCustomer = async (customer: Customer) => {
        setAnalysisError('');
        setCompanyAnalysis(null);
        setAnalysisLoading(true);
        setAnalysisModalOpen(true);
        try {
            const analysis = await geminiService.analyzeCompany(customer);
            setCompanyAnalysis(analysis as any);
        } catch (e: any) {
            setAnalysisError(e.message);
        } finally {
            setAnalysisLoading(false);
        }
    };
    
    const handleSaveBugReport = async (report: Omit<BugReport, 'id' | 'created_at' | 'status' | 'reporter_name'>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        await dataService.addBugReport({ ...report, reporter_name: currentUser.name });
    };

    const handleAddEstimate = async (estimateData: any) => {
        await dataService.addEstimate(estimateData);
        await loadAllData();
    };
    
    const onPrimaryAction = () => {
        switch(currentPage) {
            case 'sales_orders': setCreateJobModalOpen(true); break;
            case 'sales_leads': setCreateLeadModalOpen(true); break;
            case 'sales_customers':
                setSelectedCustomer(null);
                setCustomerModalMode('new');
                setCustomerDetailModalOpen(true);
                break;
            case 'purchasing_orders': setCreatePOModalOpen(true); break;
            case 'inventory_management':
                setSelectedInventoryItem(null);
                setIsCreateInventoryItemModalOpen(true);
                break;
            case 'sales_estimates':
                // TODO: Open create estimate modal
                break;
            default:
                break;
        }
    }

    // Render Logic
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full"><Loader className="w-12 h-12 animate-spin text-blue-500" /></div>;
        }
        if (dbError && showDbCredentialsModal) {
            return null; // Don't render content if we are showing credentials modal due to error
        }
        switch (currentPage) {
            case 'analysis_dashboard':
                return <Dashboard jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} suggestion={aiSuggestion} isSuggestionLoading={isSuggestionLoading} />;
            case 'sales_orders':
                return <JobList jobs={jobs} searchTerm={searchTerm} onSelectJob={(job) => { setSelectedJob(job); setJobDetailModalOpen(true); }} onNewJob={() => setCreateJobModalOpen(true)} />;
            case 'sales_customers':
                return <CustomerList customers={customers} searchTerm={searchTerm} onSelectCustomer={(customer) => { setSelectedCustomer(customer); setCustomerModalMode('view'); setCustomerDetailModalOpen(true); }} onUpdateCustomer={handleUpdateCustomer} onAnalyzeCustomer={handleAnalyzeCustomer} addToast={addToast} currentUser={currentUser} onNewCustomer={() => { setSelectedCustomer(null); setCustomerModalMode('new'); setCustomerDetailModalOpen(true); }} />;
            case 'sales_leads':
                return <LeadManagementPage leads={leads} searchTerm={searchTerm} onRefresh={loadAllData} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} />;
            case 'sales_pipeline':
                return <SalesPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setJobDetailModalOpen(true); }} />;
            case 'admin_user_management':
                return <UserManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'admin_route_management':
                return <ApprovalRouteManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'admin_bug_reports':
                return <BugReportList reports={bugReports} onUpdateReport={dataService.updateBugReport} searchTerm={searchTerm}/>
            case 'settings':
                return <SettingsPage addToast={addToast} />;
            case 'accounting_journal': case 'purchasing_invoices': case 'purchasing_payments': case 'hr_labor_cost': case 'accounting_general_ledger': case 'accounting_trial_balance': case 'accounting_period_closing':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} accountItems={accountItems} onAddEntry={async (entry: any) => { await dataService.addJournalEntry(entry); loadAllData(); }} addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'inventory_management':
                return <InventoryManagementPage inventoryItems={inventoryItems} onSelectItem={(item) => { setSelectedInventoryItem(item); setIsCreateInventoryItemModalOpen(true); }} />;
            case 'manufacturing_progress':
                return <ManufacturingPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setJobDetailModalOpen(true); }} />;
             case 'manufacturing_orders':
                return <ManufacturingOrdersPage jobs={jobs} onSelectJob={(job) => { setSelectedJob(job); setJobDetailModalOpen(true); }} />;
            case 'purchasing_orders':
                return <PurchasingManagementPage purchaseOrders={purchaseOrders} />;
            case 'sales_estimates':
                return <EstimateManagementPage estimates={estimates} customers={customers} allUsers={allUsers} onAddEstimate={handleAddEstimate} addToast={addToast} currentUser={currentUser} searchTerm={searchTerm} />;
            case 'analysis_ranking':
                return <SalesRanking jobs={jobs} />;
            case 'accounting_business_plan':
                return <BusinessPlanPage />;
            case 'approval_list':
                return <ApprovalWorkflowPage currentUser={currentUser} view="list" addToast={addToast} searchTerm={searchTerm} />;
            case 'approval_form_expense': return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="EXP" addToast={addToast} />;
            case 'approval_form_transport': return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="TRP" addToast={addToast} />;
            case 'approval_form_leave': return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="LEV" addToast={addToast} />;
            case 'approval_form_approval': return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="APL" addToast={addToast} />;
            case 'approval_form_daily': return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="DLY" addToast={addToast} />;
            case 'approval_form_weekly': return <ApprovalWorkflowPage currentUser={currentUser} view="form" formCode="WKR" addToast={addToast} />;
            default:
                return <PlaceholderPage title={PAGE_TITLES[currentPage] || currentPage} />;
        }
    };
    
    const headerConfig = {
      title: PAGE_TITLES[currentPage],
      primaryAction: ['sales_orders', 'sales_leads', 'sales_customers', 'purchasing_orders', 'inventory_management'].includes(currentPage)
        ? { label: `新規${PAGE_TITLES[currentPage].replace('管理', '')}作成`, onClick: onPrimaryAction, icon: PlusCircle }
        : undefined,
      search: ['sales_orders', 'sales_customers', 'sales_leads', 'admin_bug_reports', 'purchasing_orders'].includes(currentPage)
        ? { value: searchTerm, onChange: setSearchTerm, placeholder: `${PAGE_TITLES[currentPage]}を検索...` }
        : undefined,
    };

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            {showDbCredentialsModal ? (
                <SupabaseCredentialsModal onRetry={loadAllData} onShowSetup={() => setShowDbSetupModal(true)} />
            ) : (
                <>
                    <Sidebar currentPage={currentPage} onNavigate={handleNavigate} currentUser={currentUser} allUsers={allUsers} onUserChange={setCurrentUser} />
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {dbError && <DemoModeBanner error={dbError} onRetry={loadAllData} onShowSetup={() => setShowDbSetupModal(true)} />}
                        <div className="flex-1 overflow-y-auto p-8">
                            <Header {...headerConfig} />
                            <div className="mt-8">
                                {renderContent()}
                            </div>
                        </div>
                    </main>
                </>
            )}
            
            {/* Modals */}
            {showDbSetupModal && <DatabaseSetupInstructionsModal onRetry={() => { setShowDbSetupModal(false); loadAllData(); }} />}
            <CreateJobModal isOpen={isCreateJobModalOpen} onClose={() => setCreateJobModalOpen(false)} onAddJob={handleAddJob} />
            <CreateLeadModal isOpen={isCreateLeadModalOpen} onClose={() => setCreateLeadModalOpen(false)} onAddLead={handleAddLead} />
            <CreatePurchaseOrderModal isOpen={isCreatePOModalOpen} onClose={() => setCreatePOModalOpen(false)} onAddPurchaseOrder={handleAddPurchaseOrder} />
            <CreateInventoryItemModal isOpen={isCreateInventoryItemModalOpen} onClose={() => setIsCreateInventoryItemModalOpen(false)} onSave={handleSaveInventoryItem} item={selectedInventoryItem} />
            <JobDetailModal isOpen={isJobDetailModalOpen} job={selectedJob} onClose={() => setJobDetailModalOpen(false)} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} requestConfirmation={requestConfirmation} onNavigate={handleNavigate} addToast={addToast} />
            {isCustomerDetailModalOpen && <CustomerDetailModal customer={selectedCustomer} mode={customerModalMode} onClose={() => setCustomerDetailModalOpen(false)} onSave={handleSaveCustomer} onSetMode={setCustomerModalMode} onAnalyzeCustomer={handleAnalyzeCustomer} />}
            <CompanyAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setAnalysisModalOpen(false)} analysis={companyAnalysis} customer={selectedCustomer} isLoading={isAnalysisLoading} error={analysisError} currentUser={currentUser} />
            <BugReportChatModal isOpen={isBugReportModalOpen} onClose={() => setIsBugReportModalOpen(false)} onReportSubmit={handleSaveBugReport} />

            {/* Global UI */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <ConfirmationDialog {...confirmationDialog} />
            
             <button
                onClick={() => setIsBugReportModalOpen(true)}
                className="fixed bottom-8 right-8 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-transform transform hover:scale-110"
                title="バグ報告・改善要望"
            >
                <PlusCircle className="w-6 h-6" />
            </button>
        </div>
    );
};

export default App;