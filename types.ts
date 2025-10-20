// FIX: Removed self-import which caused multiple declaration conflicts.

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
  invoicedAt?: string;
  paidAt?: string;
  readyToInvoice?: boolean;
  invoiceId?: string | null;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number; // 月給
}

export type Page =
  // ホーム
  | 'analysis_dashboard'
  // 販売
  | 'sales_leads' // リード
  | 'sales_customers' // 取引先
  | 'sales_pipeline' // パイプライン(進捗)
  | 'sales_estimates' // 見積
  | 'sales_orders' // 受注
  | 'sales_billing' // 売上請求 (AR)
  // 購買
  | 'purchasing_orders'
  | 'purchasing_invoices'
  | 'purchasing_payments'
  // 在庫／製造
  | 'inventory_management'
  | 'manufacturing_orders'
  | 'manufacturing_progress'
  | 'manufacturing_cost'
  // 人事労務
  | 'hr_attendance'
  | 'hr_man_hours'
  | 'hr_labor_cost'
  // 申請・承認
  | 'approval_list'
  | 'approval_form_expense'
  | 'approval_form_transport'
  | 'approval_form_leave'
  | 'approval_form_approval'
  | 'approval_form_daily'
  | 'approval_form_weekly'
  // 会計
  | 'accounting_journal'
  | 'accounting_general_ledger'
  | 'accounting_trial_balance'
  | 'accounting_tax_summary'
  | 'accounting_period_closing'
  | 'accounting_business_plan'
  | 'analysis_ranking'
  // ログ／監査
  | 'admin_audit_log'
  | 'admin_journal_queue'
  // 管理
  | 'admin_user_management'
  | 'admin_route_management'
  | 'admin_bug_reports' // 改善要望一覧
  // 設定
  | 'settings';


export interface AISuggestions {
  title: string;
  quantity: number;
  paperType: string;
  finishing: string;
  details: string;
  price: number;
  variableCost: number;
}

export interface AIJournalSuggestion {
  account: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: Date;
  account: string;
  debit: number;
  credit: number;
  description: string;
}

export interface AccountItem {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export enum PurchaseOrderStatus {
  Ordered = '発注済',
  Received = '受領済',
  Cancelled = 'キャンセル',
}

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  itemName: string;
  orderDate: string;
  quantity: number;
  unitPrice: number;
  status: PurchaseOrderStatus;
  createdAt: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    createdAt: string;
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

export interface CompanyAnalysis {
  swot: string;
  painPoints: string;
  potentialNeeds: string;
  salesStrategy: string;
}


// Types for Approval Workflow
export interface User {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  role: 'admin' | 'user';
}

export interface ApplicationCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ApprovalRoute {
    id: string;
    name: string;
    route_data: { steps: { approver_id: string }[] };
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
    approval_route_id: string | null;
    current_level: number;
    approver_id: string | null;
    created_at: string;
    rejection_reason: string | null;
}

export type ApplicationWithDetails = Application & {
  applicant: User | null;
  approver: User | null;
  application_codes: ApplicationCode | null;
  approval_routes: ApprovalRoute | null;
};


// Types for Inbox (AI-OCR)
export interface InvoiceData {
    vendorName: string;
    invoiceDate: string;
    totalAmount: number;
    description: string;
    costType: 'V' | 'F'; // V: 変動費, F: 固定費
    account?: string;
    relatedCustomer?: string;
    project?: string;
}

export type InboxItemStatus = 'processing' | 'pending_review' | 'approved' | 'error';

export interface InboxItem {
    id: string;
    fileName: string;
    filePath: string;
    fileUrl: string;
    mimeType: string;
    status: InboxItemStatus;
    extractedData: InvoiceData | null;
    errorMessage: string | null;
    createdAt: string;
}

// Types for new Invoicing flow
export enum InvoiceStatusEnum {
    Draft = 'draft',
    Issued = 'issued',
    Sent = 'sent',
    Paid = 'paid',
    Void = 'void',
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    job_id?: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    line_total: number;
    sort_index: number;
}

export interface Invoice {
    id: string;
    invoice_no: string;
    invoice_date: string;
    due_date?: string;
    customer_name: string;
    subtotal_amount: number;
    tax_amount: number;
    total_amount: number;
    status: InvoiceStatusEnum;
    created_at: string;
    items?: InvoiceItem[];
}

// Types for AI Estimate Generation
export interface EstimateItem {
  division: string; // 区分 (e.g., 'paper', 'print', 'other')
  content: string; // 内容
  quantity: number; // 数量
  unit: string; // 単位
  unitPrice: number; // 単価
  price: number; // 金額
  cost: number; // 原価
  costRate: number; // 原価率
  subtotal: number; // 小計
}

export interface Estimate {
  customerName: string;
  title: string;
  total: number;
  // All other fields from the form
  version?: number;
  deliveryDate?: string;
  deliveryMethod?: string;
  paymentTerms?: string;
  notes?: string;
  items: EstimateItem[];
}

// Types for Lead Management
export enum LeadStatus {
    Untouched = '未対応',
    New = '新規',
    Contacted = 'コンタクト済',
    Qualified = '見込みあり',
    Disqualified = '見込みなし',
    Converted = 'コンバート済',
    Closed = '終了',
}

export interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string;
    source: string | null;
    tags: string[] | null;
    message: string | null;
    created_at: string;
    updated_at: string | null;
    referrer: string | null;
    referrer_url: string | null;
    landing_page_url: string | null;
    search_keywords: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    user_agent: string | null;
    ip_address: string | null;
    device_type: string | null;
    browser_name: string | null;
    os_name: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
    status: LeadStatus;
    employees: string | null;
    budget: string | null;
    timeline: string | null;
    inquiry_type: string | null; // Old field, can be deprecated
    inquiry_types: string[] | null; // New multi-select field
    infoSalesActivity: string | null; // New activity log field
}

export interface LeadScore {
  score: number;
  rationale: string;
}

// Types for Business Plan Page
export interface BusinessPlanRow {
  type: '目標' | '実績' | '前年';
  monthly: (number | string)[];
  cumulative: (number | string)[];
}

export interface BusinessPlanItem {
  name: string;
  totalValue: number | string;
  data: BusinessPlanRow[];
}

export interface BusinessPlan {
  name: string;
  headers: string[];
  items: BusinessPlanItem[];
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export interface ClosingChecklistItem {
    id: string;
    description: string;
    status: 'ok' | 'needs_review';
    count: number;
    actionPage: Page;
}

// Types for Bug/Improvement Reports
export enum BugReportStatus {
  Open = '未対応',
  InProgress = '対応中',
  Closed = '完了',
}

export interface BugReport {
  id: string;
  reporter_name: string;
  report_type: 'bug' | 'improvement';
  summary: string;
  description: string;
  status: BugReportStatus;
  created_at: string;
}
