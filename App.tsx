import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CreateJobModal from './components/CreateJobModal';
import DatabaseSetupInstructionsModal from './components/DatabaseSetupInstructionsModal';
import DemoModeBanner from './components/DemoModeBanner';
import CustomerList from './components/CustomerList';
import CustomerDetailModal from './components/CustomerDetailModal';
import BusinessSupportPage from './components/BusinessSupportPage';
import SettingsPage from './components/SettingsPage';
import InvoiceManagement from './components/accounting/InvoiceManagement';
import SalesRanking from './components/accounting/SalesRanking';
import InvoiceOCR from './components/InvoiceOCR';
import JournalLedger from './components/JournalLedger';
import { Page, Job, InvoiceStatus, JournalEntry, Customer } from './types';
import { getJobs, addJob, updateJobInvoiceStatus, getJournalEntries, addJournalEntry as addJournalEntrySvc, getCustomers, addCustomer, updateCustomer } from './services/dataService';
import { MOCK_JOBS, MOCK_JOURNAL_ENTRIES, MOCK_CUSTOMERS } from './constants';
import { Loader } from './components/Icons';

const pageTitles: Record<Page, string> = {
  dashboard: 'ダッシュボード',
  jobs: '案件一覧',
  customers: '顧客管理',
  business_support: '業務支援',
  settings: '設定',
  accounting_invoice: '請求・入金管理',
  accounting_expense: '経費入力 (AI-OCR)',
  accounting_ledger: '仕訳帳',
  accounting_ranking: '顧客別 売上ランキング',
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSetupError, setIsSetupError] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState<'view' | 'edit' | 'new'>('view');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsSetupError(false);
      setIsDemoMode(false);
      const [jobsData, journalEntriesData, customersData] = await Promise.all([
        getJobs(),
        getJournalEntries(),
        getCustomers(),
      ]);
      setJobs(jobsData);
      setJournalEntries(journalEntriesData);
      setCustomers(customersData);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message.toLowerCase().includes('relation') && e.message.toLowerCase().includes('does not exist')) {
        setIsSetupError(true);
      } else {
        setError('データベースに接続できませんでした。');
        setIsDemoMode(true);
        setJobs(MOCK_JOBS);
        setJournalEntries(MOCK_JOURNAL_ENTRIES);
        setCustomers(MOCK_CUSTOMERS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleAddJob = async (job: Omit<Job, 'createdAt' | 'id'>) => {
    try {
      const newJobData = {
        id: `job_${crypto.randomUUID()}`,
        ...job,
      };
      await addJob(newJobData);
      await fetchData();
    } catch (e) {
      setError('案件の追加に失敗しました。');
    }
  };

  const handleAddJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    try {
        await addJournalEntrySvc(entry);
        const journalEntriesData = await getJournalEntries();
        setJournalEntries(journalEntriesData);
    } catch (e) {
        setError('仕訳の追加に失敗しました。');
    }
  };

  const handleUpdateJobInvoiceStatus = async (jobId: string, status: InvoiceStatus) => {
    try {
        const updatedJob = await updateJobInvoiceStatus(jobId, status);
        if (updatedJob && status === InvoiceStatus.Paid) {
            await handleAddJournalEntry({ account: '現金', debit: updatedJob.price, credit: 0, description: `売上入金 ${updatedJob.clientName} (${updatedJob.id})` });
            await handleAddJournalEntry({ account: '売掛金', debit: 0, credit: updatedJob.price, description: `売上入金 ${updatedJob.clientName} (${updatedJob.id})` });
        }
        await fetchData();
    } catch (e) {
        setError('案件ステータスの更新に失敗しました。');
    }
  };

  const handleSaveExpense = (data: { vendorName: string; totalAmount: number; description: string; }) => {
    if(isDemoMode) {
      alert('デモモードでは経費の保存はできません。');
      return;
    }
    handleAddJournalEntry({
        account: '消耗品費',
        debit: data.totalAmount,
        credit: 0,
        description: `${data.description} (${data.vendorName})`
    });
    handleAddJournalEntry({
        account: '現金',
        debit: 0,
        credit: data.totalAmount,
        description: `${data.description} (${data.vendorName})`
    });
    alert('経費が仕訳帳に記録されました。');
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerModalMode('view');
    setIsCustomerModalOpen(true);
  };
  
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerModalMode('edit');
    setIsCustomerModalOpen(true);
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setCustomerModalMode('new');
    setIsCustomerModalOpen(true);
  };

  const handleCloseCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      if (customerModalMode === 'new') {
        await addCustomer(customerData as Omit<Customer, 'id' | 'createdAt'>);
      } else if (customerModalMode === 'edit' && selectedCustomer) {
        await updateCustomer(selectedCustomer.id, customerData);
      }
      await fetchData();
      handleCloseCustomerModal();
    } catch (e) {
      setError('顧客情報の保存に失敗しました。');
    }
  };
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard jobs={jobs} />;
      case 'jobs':
        return <JobList jobs={jobs} />;
      case 'customers':
        return <CustomerList 
            customers={customers} 
            onSelectCustomer={handleSelectCustomer}
            onEditCustomer={handleEditCustomer}
            onNewCustomer={handleNewCustomer}
            isDemoMode={isDemoMode}
        />;
      case 'business_support':
          return <BusinessSupportPage isDemoMode={isDemoMode} />;
      case 'settings':
          return <SettingsPage />;
      case 'accounting_invoice':
          return <InvoiceManagement jobs={jobs} onUpdateJobInvoiceStatus={handleUpdateJobInvoiceStatus} isDemoMode={isDemoMode} />;
      case 'accounting_expense':
          return <InvoiceOCR onSaveExpenses={handleSaveExpense} isDemoMode={isDemoMode} />;
      case 'accounting_ledger':
          return <JournalLedger entries={journalEntries} onAddEntry={handleAddJournalEntry} isDemoMode={isDemoMode} />;
      case 'accounting_ranking':
          return <SalesRanking jobs={jobs} />;
      default:
        return <Dashboard jobs={jobs} />;
    }
  };

  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <p className="mt-4 text-slate-500 dark:text-slate-400">データベースに接続中...</p>
          </div>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {isDemoMode && <DemoModeBanner error={error} onRetry={fetchData} onShowSetup={() => setIsSetupError(true)} />}
        <div className="p-8 flex-1 overflow-y-auto">
          <Header title={pageTitles[currentPage]} onNewJobClick={() => setIsModalOpen(true)} isDemoMode={isDemoMode}/>
          <div className="mt-8">
            {renderPage()}
          </div>
        </div>
      </main>
      <CreateJobModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddJob={handleAddJob}
        isDemoMode={isDemoMode}
      />
      {isCustomerModalOpen && (
        <CustomerDetailModal
          customer={selectedCustomer}
          mode={customerModalMode}
          onClose={handleCloseCustomerModal}
          onSave={handleSaveCustomer}
          onSetMode={(mode) => setCustomerModalMode(mode)}
          isDemoMode={isDemoMode}
        />
      )}
      {isSetupError && <DatabaseSetupInstructionsModal onRetry={fetchData} />}
    </div>
  );
}

export default App;
