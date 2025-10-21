export type Page =
  | 'analysis_dashboard' | 'sales_dashboard' | 'sales_leads' | 'sales_customers' | 'sales_pipeline'
  | 'sales_estimates' | 'sales_orders' | 'sales_billing' | 'analysis_ranking'
  | 'purchasing_orders' | 'purchasing_invoices' | 'purchasing_payments'
  | 'inventory_management' | 'manufacturing_orders' | 'manufacturing_progress' | 'manufacturing_cost'
  | 'hr_attendance' | 'hr_man_hours' | 'hr_labor_cost'
  | 'approval_list' | 'approval_form_expense' | 'approval_form_transport' | 'approval_form_leave'
  | 'approval_form_approval' | 'approval_form_daily' | 'approval_form_weekly'
  | 'accounting_journal' | 'accounting_general_ledger' | 'accounting_trial_balance'
  | 'accounting_tax_summary' | 'accounting_period_closing' | 'accounting_business_plan'
  | 'admin_audit_log' | 'admin_journal_queue' | 'admin_user_management' | 'admin_route_management'
  | 'admin_bug_reports' | 'settings';

export enum JobStatus {
  Pending = '保留',
  InProgress = '進行中',
  Completed = '完了',
  Cancelled = 'キャンセル',
}

export enum InvoiceStatus {
  Uninvoiced = '未請求',
  Invoiced = '請求済',
  Paid = '入金済',
}

export enum LeadStatus {
    Untouched = '未対応',
    New = '新規',
    Contacted = 'コンタクト済',
    Qualified = '有望',
    Disqualified = '失注',
    Converted = '商談化',
    Closed = 'クローズ',
}

export enum PurchaseOrderStatus {
    Ordered = '発注済',
    Received = '受領済',
    Cancelled = 'キャンセル',
}

export enum ManufacturingStatus {
  OrderReceived = '受注',
  DataCheck = 'データチェック',
  Prepress = '製版',
  Printing = '印刷',
  Finishing = '加工',
  AwaitingShipment = '出荷待ち',
  Delivered = '納品済',
}

export enum EstimateStatus {
  Draft = '見積中',
  Ordered = '受注',
  Lost = '失注',
}

export enum BugReportStatus {
    Open = '未対応',
    InProgress = '対応中',
    Closed = '完了',
}


export interface Job {
  id: string;
  jobNumber: number;
  clientName: string;
  title: string;
  status: JobStatus;
  dueDate: string;
  quantity: number;
  paperType: string;
  finishing: string;
  details: string;
  createdAt: string;
  price: number;
  variableCost: number;
  invoiceStatus: InvoiceStatus;
  invoicedAt?: string | null;
  paidAt?: string | null;
  readyToInvoice?: boolean;
  invoiceId?: string | null;
  manufacturingStatus?: ManufacturingStatus;
}

export interface JournalEntry {
  id: number;
  date: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export interface EmployeeUser {
  id: string;
  name: string;
  department: string | null;
  title: string | null;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Customer {
  id: string;
  customerCode?: string;
  customerName: string;
  customerNameKana?: string;
  representative?: string;
  phoneNumber?: string;
  address1?: string;
  companyContent?: string;
  annualSales?: string;
  employeesCount?: string;
  note?: string;
  infoSalesActivity?: string;
  infoRequirements?: string;
  infoHistory?: string;
  createdAt: string;
  post_no?: string;
  address_2?: string;
  fax?: string;
  closingDay?: string;
  monthly_plan?: string;
  payDay?: string;
  recoveryMethod?: string;
  user_id?: string;
  // from modal
  name2?: string;
  websiteUrl?: string;
  zipCode?: string;
  address2?: string;
  foundationDate?: string;
  capital?: string;
  customerRank?: string;
  customerDivision?: string;
  salesType?: string;
  creditLimit?: string;
  payMoney?: string;
  bankName?: string;
  branchName?: string;
  accountNo?: string;
  salesUserCode?: string;
  startDate?: string;
  endDate?: string;
  drawingDate?: string;
  salesGoal?: string;
  infoSalesIdeas?: string;
  customerContactInfo?: string; // for mailto
}

export interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export interface AISuggestions {
    title: string;
    quantity: number;
    paperType: string;
    finishing: string;
    details: string;
    price: number;
    variableCost: number;
}

export interface CompanyAnalysis {
    swot: string;
    painPointsAndNeeds: string;
    suggestedActions: string;
    proposalEmail: {
        subject: string;
        body: string;
    };
}

export interface InvoiceData {
    vendorName: string;
    invoiceDate: string;
    totalAmount: number;
    description: string;
    costType: 'V' | 'F';
    account: string;
    relatedCustomer?: string;
    project?: string;
}

export interface AIJournalSuggestion {
    account: string;
    description: string;
    debit: number;
    credit: number;
}

export interface ApplicationCode {
    id: string;
    code: string;
    name: string;
    description: string;
    created_at: string;
}

export interface EstimateItem {
    division: 'paper' | 'print' | 'design' | 'finishing' | 'other' | 'その他';
    content: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    price: number;
    cost: number;
    costRate: number;
    subtotal: number;
}

export interface Estimate {
    id: string;
    estimateNumber: number;
    customerName: string;
    title: string;
    items: EstimateItem[];
    total: number;
    deliveryDate: string;
    paymentTerms: string;
    deliveryMethod: string;
    notes: string;
    status: EstimateStatus;
    version: number;
    userId: string;
    user?: User;
    createdAt: string;
    updatedAt: string;
}

export interface Lead {
    id: string;
    status: LeadStatus;
    created_at: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string;
    source: string | null;
    tags: string[] | null;
    message: string | null;
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
    employees: string | null;
    budget: string | null;
    timeline: string | null;
    inquiry_type: string | null;
    inquiry_types: string[] | null;
    infoSalesActivity: string | null;
    score?: number;
}

export interface ApprovalRoute {
    id: string;
    name: string;
    route_data: {
        steps: { approver_id: string }[];
    };
    created_at: string;
}

export interface Application {
    id: string;
    applicant_id: string;
    application_code_id: string;
    form_data: any;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
    submitted_at: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    current_level: number;
    approver_id: string | null;
    rejection_reason: string | null;
    approval_route_id: string;
    created_at: string;
}

export interface ApplicationWithDetails extends Application {
    applicant?: User;
    application_codes?: ApplicationCode;
    approval_routes?: ApprovalRoute;
}

export interface Employee {
    id: string;
    name: string;
    department: string;
    title: string;
    hire_date: string;
    salary: number;
    created_at: string;
}

export interface AccountItem {
    id: string;
    code: string;
    name: string;
    categoryCode: string;
    isActive: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrder {
    id: string;
    supplierName: string;
    itemName: string;
    orderDate: string;
    quantity: number;
    unitPrice: number;
    status: PurchaseOrderStatus;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
}

export interface BusinessPlan {
    name: string;
    headers: string[];
    items: {
        name: string;
        totalValue: number | string;
        data: {
            type: '目標' | '実績' | '前年';
            monthly: (number | string)[];
            cumulative: (number | string)[];
        }[];
    }[];
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

export interface LeadScore {
    score: number;
    rationale: string;
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

export interface ClosingChecklistItem {
    id: string;
    description: string;
    count: number;
    status: 'ok' | 'needs_review';
    actionPage?: Page;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
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
    status: 'draft' | 'issued' | 'paid' | 'void';
    created_at: string;
    paid_at?: string;
    items?: InvoiceItem[];
}

export enum InboxItemStatus {
  Processing = 'processing',
  PendingReview = 'pending_review',
  Approved = 'approved',
  Error = 'error',
}

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