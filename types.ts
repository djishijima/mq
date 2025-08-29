export enum JobStatus {
  Pending = '保留中',
  InProgress = '進行中',
  Completed = '完了',
  Cancelled = 'キャンセル',
}

export enum InvoiceStatus {
  Uninvoiced = '未請求',
  Invoiced = '請求済',
  Paid = '入金済',
}

export interface Job {
  id: string;
  clientName: string;
  title: string;
  status: JobStatus;
  dueDate: string;
  quantity: number;
  paperType: string;
  finishing: string;
  details: string;
  createdAt: Date;
  price: number; // P (売上高)
  variableCost: number; // V (変動費)
  invoiceStatus: InvoiceStatus;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  hireDate: string;
}

export type Page =
  | 'dashboard'
  | 'jobs'
  | 'customers'
  | 'business_support'
  | 'settings'
  | 'accounting_invoice'
  | 'accounting_expense'
  | 'accounting_ledger'
  | 'accounting_ranking';

export interface AISuggestions {
  title: string;
  quantity: number;
  paperType: string;
  finishing: string;
  details: string;
  price: number;
  variableCost: number;
}

export interface JournalEntry {
  id: string;
  date: Date;
  account: string;
  debit: number;
  credit: number;
  description: string;
}

export interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export interface Customer {
    id: string;
    customerCode: string | null;
    customerCodeAlt: string | null;
    customerName: string;
    customerNameKana: string | null;
    name2: string | null;
    customerRank: string | null;
    customerDivision: string | null;
    salesType: string | null;
    supportCompanyFlag: string | null;
    zipCode: string | null;
    address1: string | null;
    address2: string | null;
    address3: string | null;
    nearestStation: string | null;
    phoneNumber: string | null;
    fax: string | null;
    representative: string | null;
    foundationDate: string | null;
    capital: string | null;
    annualSales: string | null;
    employeesCount: string | null;
    creditLimit: string | null;
    closingDay: string | null;
    payDay: string | null;
    recoveryMethod: string | null;
    payMoney: string | null;
    tradeTerms: string | null;
    bankName: string | null;
    branchName: string | null;
    branchCode: string | null;
    accountNo: string | null;
    accountNameKana: string | null;
    salesUserCode: string | null;
    note: string | null;
    infoHistory: string | null;
    infoSalesActivity: string | null;
    infoOrderFlow: string | null;
    infoTransactionProgress: string | null;
    infoCurrentOrders: string | null;
    infoFutureProposals: string | null;
    infoCompetitors: string | null;
    infoRequirements: string | null;
    infoSalesIdeas: string | null;
    infoManagementNotes: string | null;
    infoOther: string | null;
    createUserId: string | null;
    createDate: string | null;
    updateUserId: string | null;
    updateDate: string | null;
    drawingMemo: string | null;
    drawingDate: string | null;
    billPaymentDay: string | null;
    billPay: number | null;
    creditSalesPay: number | null;
    taxFraction: number | null;
    taxInFlag: string | null;
    budgetFlag: string | null;
    startDate: string | null;
    endDate: string | null;
    introducer: string | null;
    keii: string | null;
    previousPerson: string | null;
    salesTrends: string | null;
    grossProfit: string | null;
    grossProfitByProduct: string | null;
    companyContent: string | null;
    keyPerson: string | null;
    orderRate: string | null;
    ippanPub: string | null;
    textPub: string | null;
    gyokaiPub: string | null;
    shoinPub: string | null;
    tsushinEdu: string | null;
    otherPub: string | null;
    businessResult: string | null;
    companyFeatures: string | null;
    customerTrend: string | null;
    whatHappened: string | null;
    responseToCompetitors: string | null;
    salesGoal: string | null;
    externalItems: string | null;
    internalItems: string | null;
    quotationPoint: string | null;
    mainProducts: string | null;
    totalOrderAmount: string | null;
    rivalInfo: string | null;
    customerContactInfo: string | null;
    orgChart: string | null;
    pq: string | null;
    vq: string | null;
    mq: string | null;
    mRate: string | null;
    accidentHistory: string | null;
    customerVoice: string | null;
    annualActionPlan: string | null;
    lostOrders: string | null;
    growthPotential: string | null;
    monthlyPlan: string | null;
    createdAt: string;
}

// Types for Approval Workflow
export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface ApplicationCode {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface Application {
    id: string;
    applicant_id: string;
    application_code_id: string;
    form_data: any; // JSONB
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
    submitted_at: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    approval_route: any; // JSONB
    current_level: number;
    approver_id: string | null;
    created_at: string;
}
