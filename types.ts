

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
  customerId?: string | null;
  clientName: string;
  title: string;
  status: JobStatus;
  dueDate: string;
  quantity: number;
  paperType: string;
  finishing: string;
  details: string;
  createdAt: string;
  price: number; // P (売上高)
  variableCost: number; // V (変動費)
  invoiceStatus: InvoiceStatus;
  invoicedAt?: string;
  paidAt?: string;
  readyToInvoice?: boolean;
  invoiceId?: string | null;
  userId?: string;
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
  | 'accounting_inbox'
  | 'accounting_payable_list' // FIX: Add missing page type for accounts payable list.
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
  