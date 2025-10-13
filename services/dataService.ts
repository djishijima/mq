import { supabase } from './supabaseClient';
import { Job, JobStatus, InvoiceStatus, JournalEntry, Customer, User, InboxItem, Application, ApplicationWithDetails, Invoice, InvoiceItem, ApplicationCode, ApprovalRoute, Lead, AccountItem, PurchaseOrder, InventoryItem } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Type for DB job object (snake_case)
interface DbJob {
  id: string;
  customer_id?: string | null;
  client_name: string;
  title: string;
  status: JobStatus;
  due_date: string;
  quantity: number;
  paper_type: string;
  finishing: string;
  details: string;
  created_at: string;
  price: number;
  variable_cost: number;
  invoice_status: InvoiceStatus;
  invoiced_at?: string;
  paid_at?: string;
  ready_to_invoice?: boolean;
  invoice_id?: string | null;
}

// Type for DB customer object (snake_case)
// Using 'any' as the schema is very large. The mapper will enforce types.
type DbCustomer = any;
type DbLead = any; // Since it's large
type DbAccountItem = any;

// Mappers
const dbJobToJob = (job: DbJob): Job => ({
  id: job.id,
  customerId: job.customer_id,
  clientName: job.client_name,
  title: job.title,
  status: job.status,
  dueDate: job.due_date,
  quantity: job.quantity,
  paperType: job.paper_type,
  finishing: job.finishing,
  details: job.details,
  createdAt: job.created_at,
  price: job.price,
  variableCost: job.variable_cost,
  invoiceStatus: job.invoice_status,
  invoicedAt: job.invoiced_at,
  paidAt: job.paid_at,
  readyToInvoice: job.ready_to_invoice,
  invoiceId: job.invoice_id,
});

const jobToDbJob = (job: Partial<Job>): any => {
    const dbJob: any = {};
    for (const key in job) {
        if (Object.prototype.hasOwnProperty.call(job, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            dbJob[snakeKey] = job[key as keyof Job];
        }
    }
    return dbJob;
};

const dbCustomerToCustomer = (dbCust: DbCustomer): Customer => ({
    id: dbCust.id,
    customerCode: dbCust.customer_code,
    customerCodeAlt: dbCust.customer_code_alt,
    customerName: dbCust.customer_name,
    customerNameKana: dbCust.customer_name_kana,
    name2: dbCust.name2,
    customerRank: dbCust.customer_rank,
    customerDivision: dbCust.customer_division,
    salesType: dbCust.sales_type,
    supportCompanyFlag: dbCust.support_company_flag,
    zipCode: dbCust.zip_code,
    address1: dbCust.address_1,
    address2: dbCust.address_2,
    address3: dbCust.address_3,
    nearestStation: dbCust.nearest_station,
    phoneNumber: dbCust.phone_number,
    fax: dbCust.fax,
    representative: dbCust.representative,
    foundationDate: dbCust.foundation_date,
    capital: dbCust.capital,
    annualSales: dbCust.annual_sales,
    employeesCount: dbCust.employees_count,
    creditLimit: dbCust.credit_limit,
    closingDay: dbCust.closing_day,
    payDay: dbCust.pay_day,
    recoveryMethod: dbCust.recovery_method,
    payMoney: dbCust.pay_money,
    tradeTerms: dbCust.trade_terms,
    bankName: dbCust.bank_name,
    branchName: dbCust.branch_name,
    branchCode: dbCust.branch_code,
    accountNo: dbCust.account_no,
    accountNameKana: dbCust.account_name_kana,
    salesUserCode: dbCust.sales_user_code,
    note: dbCust.note,
    infoHistory: dbCust.info_history,
    infoSalesActivity: dbCust.info_sales_activity,
    infoOrderFlow: dbCust.info_order_flow,
    infoTransactionProgress: dbCust.info_transaction_progress,
    infoCurrentOrders: dbCust.info_current_orders,
    infoFutureProposals: dbCust.info_future_proposals,
    infoCompetitors: dbCust.info_competitors,
    infoRequirements: dbCust.info_requirements,
    infoSalesIdeas: dbCust.info_sales_ideas,
    infoManagementNotes: dbCust.info_management_notes,
    infoOther: dbCust.info_other,
    createUserId: dbCust.create_user_id,
    createDate: dbCust.create_date,
    updateUserId: dbCust.update_user_id,
    updateDate: dbCust.update_date,
    drawingMemo: dbCust.drawing_memo,
    drawingDate: dbCust.drawing_date,
    billPaymentDay: dbCust.bill_payment_day,
    billPay: dbCust.bill_pay,
    creditSalesPay: dbCust.credit_sales_pay,
    taxFraction: dbCust.tax_fraction,
    taxInFlag: dbCust.tax_in_flag,
    budgetFlag: dbCust.budget_flag,
    startDate: dbCust.start_date,
    endDate: dbCust.end_date,
    introducer: dbCust.introducer,
    keii: dbCust.keii,
    previousPerson: dbCust.previous_person,
    salesTrends: dbCust.sales_trends,
    grossProfit: dbCust.gross_profit,
    grossProfitByProduct: dbCust.gross_profit_by_product,
    companyContent: dbCust.company_content,
    keyPerson: dbCust.key_person,
    orderRate: dbCust.order_rate,
    ippanPub: dbCust.ippan_pub,
    textPub: dbCust.text_pub,
    gyokaiPub: dbCust.gyokai_pub,
    shoinPub: dbCust.shoin_pub,
    tsushinEdu: dbCust.tsushin_edu,
    otherPub: dbCust.other_pub,
    businessResult: dbCust.business_result,
    companyFeatures: dbCust.company_features,
    customerTrend: dbCust.customer_trend,
    whatHappened: dbCust.what_happened,
    responseToCompetitors: dbCust.response_to_competitors,
    salesGoal: dbCust.sales_goal,
    externalItems: dbCust.external_items,
    internalItems: dbCust.internal_items,
    quotationPoint: dbCust.quotation_point,
    mainProducts: dbCust.main_products,
    totalOrderAmount: dbCust.total_order_amount,
    rivalInfo: dbCust.rival_info,
    customerContactInfo: dbCust.customer_contact_info,
    orgChart: dbCust.org_chart,
    pq: dbCust.pq,
    vq: dbCust.vq,
    mq: dbCust.mq,
    mRate: dbCust.m_rate,
    accidentHistory: dbCust.accident_history,
    customerVoice: dbCust.customer_voice,
    annualActionPlan: dbCust.annual_action_plan,
    lostOrders: dbCust.lost_orders,
    growthPotential: dbCust.growth_potential,
    monthlyPlan: dbCust.monthly_plan,
    createdAt: dbCust.created_at,
});

const customerToDbCustomer = (cust: Partial<Customer>): DbCustomer => {
    const dbCust: DbCustomer = {};
    for (const key in cust) {
        if (Object.prototype.hasOwnProperty.call(cust, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            dbCust[snakeKey] = cust[key as keyof Customer];
        }
    }
    return dbCust;
};

const dbLeadToLead = (dbLead: DbLead): Lead => ({
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone,
    company: dbLead.company,
    source: dbLead.source,
    tags: dbLead.tags,
    message: dbLead.message,
    createdAt: dbLead.created_at,
    updatedAt: dbLead.updated_at,
    referrer: dbLead.referrer,
    referrer_url: dbLead.referrer_url,
    landing_page_url: dbLead.landing_page_url,
    search_keywords: dbLead.search_keywords,
    utm_source: dbLead.utm_source,
    utm_medium: dbLead.utm_medium,
    utm_campaign: dbLead.utm_campaign,
    utm_term: dbLead.utm_term,
    utm_content: dbLead.utm_content,
    user_agent: dbLead.user_agent,
    ip_address: dbLead.ip_address,
    device_type: dbLead.device_type,
    browser_name: dbLead.browser_name,
    os_name: dbLead.os_name,
    country: dbLead.country,
    city: dbLead.city,
    region: dbLead.region,
    status: dbLead.status,
    employees: dbLead.employees,
    budget: dbLead.budget,
    timeline: dbLead.timeline,
    inquiry_type: dbLead.inquiry_type,
    inquiry_types: dbLead.inquiry_types,
    infoSalesActivity: dbLead.info_sales_activity,
    assigneeId: dbLead.assignee_id
});

const leadToDbLead = (lead: Partial<Lead>): DbLead => {
    const dbLead: DbLead = {};
    for (const key in lead) {
        if (Object.prototype.hasOwnProperty.call(lead, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            dbLead[snakeKey] = lead[key as keyof Lead];
        }
    }
    return dbLead;
};

const dbAccountItemToAccountItem = (item: DbAccountItem): AccountItem => ({
  id: item.id,
  code: item.code,
  name: item.name,
  categoryCode: item.category_code,
  isActive: item.is_active,
  sortOrder: item.sort_order,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const dbInvoiceToInvoice = (db: any): Invoice => ({
    id: db.id,
    invoiceNo: db.invoice_no,
    invoiceDate: db.invoice_date,
    dueDate: db.due_date,
    customerName: db.customer_name,
    subtotalAmount: db.subtotal_amount,
    taxAmount: db.tax_amount,
    totalAmount: db.total_amount,
    status: db.status,
    createdAt: db.created_at,
    paidAt: db.paid_at,
    items: db.items ? db.items.map(dbItemToInvoiceItem) : [],
});

const dbItemToInvoiceItem = (db: any): InvoiceItem => ({
    id: db.id,
    invoiceId: db.invoice_id,
    jobId: db.job_id,
    description: db.description,
    quantity: db.quantity,
    unit: db.unit,
    unitPrice: db.unit_price,
    lineTotal: db.line_total,
    sortIndex: db.sort_index,
});

// API Functions
export const getJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching jobs:', error.message);
    throw error;
  }
  return data.map(dbJobToJob);
};

export const addJob = async (job: Omit<Job, 'createdAt' | 'id'> & {id: string}): Promise<Job> => {
  const dbJob = jobToDbJob(job);
  const { data, error } = await supabase.from('jobs').insert([dbJob]).select().single();
  if (error) {
    console.error('Error adding job:', error.message);
    throw error;
  }
  return dbJobToJob(data);
};

export const updateJob = async (jobId: string, updatedData: Partial<Job>): Promise<Job> => {
    const dbJob = jobToDbJob(updatedData);

    const { data, error } = await supabase
        .from('jobs')
        .update(dbJob)
        .eq('id', jobId)
        .select()
        .single();
    if (error) {
        console.error('Error updating job:', error.message);
        throw error;
    }
    return dbJobToJob(data);
};

export const deleteJob = async (jobId: string): Promise<void> => {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) {
        console.error('Error deleting job:', error.message);
        throw error;
    }
};

export const updateJobInvoiceStatus = async (jobId: string, status: InvoiceStatus): Promise<Job> => {
  const updates: { invoice_status: InvoiceStatus, invoiced_at?: string, paid_at?: string } = {
    invoice_status: status,
  };
  if (status === InvoiceStatus.Invoiced) {
    updates.invoiced_at = new Date().toISOString();
  } else if (status === InvoiceStatus.Paid) {
    updates.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select().single();

  if (error) {
    console.error('Error updating job status:', error.message);
    throw error;
  }
  return dbJobToJob(data);
};

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
    const { data, error } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
    if (error) {
      console.error('Error fetching journal entries:', error.message);
      throw error;
    }
    return data as JournalEntry[];
  };
  
export const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'date' | 'status'>): Promise<JournalEntry> => {
    const newEntry = {
        ...entry,
        date: new Date().toISOString(),
        status: 'posted'
    };
    const { data, error } = await supabase.from('journal_entries').insert([newEntry]).select().single();
    if (error) {
        console.error('Error adding journal entry:', error.message);
        throw error;
    }
    return data as JournalEntry;
};

export const addJournalEntries = async (entries: Omit<JournalEntry, 'id' | 'date' | 'status'>[]): Promise<JournalEntry[]> => {
    const newEntries = entries.map(entry => ({
        ...entry,
        date: new Date().toISOString(),
        status: 'posted'
    }));
    const { data, error } = await supabase.from('journal_entries').insert(newEntries).select();
    if (error) {
        console.error('Error adding multiple journal entries:', error.message);
        throw error;
    }
    return data as JournalEntry[];
};

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('customer_name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error.message);
    throw error;
  }
  return data.map(dbCustomerToCustomer);
};

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    const dbCustomer = customerToDbCustomer(customerData);
    const { data, error } = await supabase.from('customers').insert(dbCustomer).select().single();
    if (error) {
        console.error('Error adding customer:', error.message);
        throw error;
    }
    return dbCustomerToCustomer(data);
};

export const updateCustomer = async (customerId: string, customerData: Partial<Customer>): Promise<Customer> => {
    const dbCustomer = customerToDbCustomer(customerData);
    const { data, error } = await supabase.from('customers').update(dbCustomer).eq('id', customerId).select().single();
    if (error) {
        console.error('Error updating customer:', error.message);
        throw error;
    }
    return dbCustomerToCustomer(data);
};

// --- Inbox Functions ---
const INBOX_BUCKET = 'inbox_documents';
const APPLICATION_ATTACHMENTS_BUCKET = 'application_attachments';

export const getInboxItems = async (): Promise<InboxItem[]> => {
    const { data, error } = await supabase.from('inbox_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    return data.map(item => {
        const { data: fileData } = supabase.storage.from(INBOX_BUCKET).getPublicUrl(item.file_path);
        return {
            id: item.id,
            fileName: item.file_name,
            filePath: item.file_path,
            fileUrl: fileData.publicUrl,
            mimeType: item.mime_type,
            status: item.status,
            docType: item.doc_type,
            extractedData: item.extracted_data,
            errorMessage: item.error_message,
            createdAt: item.created_at,
        };
    });
};

export const addInboxItem = async (item: Omit<InboxItem, 'id' | 'createdAt' | 'fileUrl'>): Promise<InboxItem> => {
    const dbItem = {
        file_name: item.fileName,
        file_path: item.filePath,
        mime_type: item.mimeType,
        status: item.status,
        doc_type: item.docType,
        extracted_data: item.extractedData,
        error_message: item.errorMessage,
    };
    const { data, error } = await supabase.from('inbox_items').insert(dbItem).select().single();
    if (error) throw error;

    const { data: fileData } = supabase.storage.from(INBOX_BUCKET).getPublicUrl(data.file_path);
    return {
        id: data.id,
        fileName: data.file_name,
        filePath: data.file_path,
        fileUrl: fileData.publicUrl,
        mimeType: data.mime_type,
        status: data.status,
        docType: data.doc_type,
        extractedData: data.extracted_data,
        errorMessage: data.error_message,
        createdAt: data.created_at,
    };
};

export const updateInboxItem = async (id: string, updates: Partial<InboxItem>): Promise<InboxItem> => {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.extractedData) dbUpdates.extracted_data = updates.extractedData;
    if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
    if (updates.docType) dbUpdates.doc_type = updates.docType;

    const { data, error } = await supabase.from('inbox_items').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    
    const { data: fileData } = supabase.storage.from(INBOX_BUCKET).getPublicUrl(data.file_path);
    return {
        id: data.id,
        fileName: data.file_name,
        filePath: data.file_path,
        fileUrl: fileData.publicUrl,
        mimeType: data.mime_type,
        status: data.status,
        docType: data.doc_type,
        extractedData: data.extracted_data,
        errorMessage: data.error_message,
        createdAt: data.created_at,
    };
};

export const deleteInboxItem = async (item: InboxItem): Promise<void> => {
    const { error: fileError } = await supabase.storage.from(INBOX_BUCKET).remove([item.filePath]);
    if (fileError) console.warn('ストレージからのファイル削除に失敗:', fileError.message);
    
    const { error: dbError } = await supabase.from('inbox_items').delete().eq('id', item.id);
    if (dbError) throw dbError;
};

export const uploadToInbox = async (file: File): Promise<{ path: string }> => {
    const filePath = `public/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(INBOX_BUCKET).upload(filePath, file);
    if (error) throw error;
    return { path: data.path };
};

export const uploadApplicationAttachment = async (file: File): Promise<{ path: string }> => {
    const filePath = `public/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(APPLICATION_ATTACHMENTS_BUCKET).upload(filePath, file);
    if (error) throw error;
    return { path: data.path };
};

export const getApplicationAttachmentUrl = (path: string): string => {
    const { data } = supabase.storage.from(APPLICATION_ATTACHMENTS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

// --- Business Support / Approval Workflow Functions ---

export const getOrCreateUserProfile = async (supabaseUser: SupabaseUser): Promise<User> => {
    const { data: existingProfile, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
  
    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw selectError;
    }
  
    if (existingProfile) {
      return existingProfile as User;
    }
  
    const newUserProfileData = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email || '新規ユーザー',
      role: 'user', // Default role
    };
  
    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert(newUserProfileData)
      .select()
      .single();
  
    if (insertError) {
      throw insertError;
    }
  
    return newProfile as User;
  };

export const getApplicationCodes = async (): Promise<ApplicationCode[]> => {
    const { data, error } = await supabase.from('application_codes').select('*');
    if (error) {
        console.error('Error fetching application codes:', error.message);
        throw error;
    }
    return data;
};

export const getApplications = async (currentUser?: User | null): Promise<ApplicationWithDetails[]> => {
    const [
      applicationsResponse,
      users,
      codes,
      routes
    ] = await Promise.all([
      supabase
        .from('applications')
        .select('*')
        .order('submitted_at', { ascending: false, nullsFirst: false }),
      getUsers(),
      getApplicationCodes(),
      getApprovalRoutes()
    ]);

    const { data: applications, error: applicationsError } = applicationsResponse;

    if (applicationsError) throw applicationsError;

    const usersMap = new Map(users.map(u => [u.id, u]));
    const codesMap = new Map(codes.map(c => [c.id, c]));
    const routesMap = new Map(routes.map(r => [r.id, r]));

    let filteredApplications = applications;
    if (currentUser && currentUser.role === 'user') {
        filteredApplications = applications.filter(app => 
            app.applicant_id === currentUser.id || 
            app.approver_id === currentUser.id
        );
    }
    
    const applicationsWithDetails: ApplicationWithDetails[] = filteredApplications.map(app => ({
      ...app,
      applicant: usersMap.get(app.applicant_id) || null,
      approver: usersMap.get(app.approver_id) || null,
      application_codes: codesMap.get(app.application_code_id) || null,
      approval_routes: app.approval_route_id ? routesMap.get(app.approval_route_id) || null : null,
    }));

    return applicationsWithDetails;
};

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw error;
    return data;
};

export const addUser = async (userData: Pick<User, 'name' | 'role'>): Promise<User> => {
    const { data, error } = await supabase.from('users').insert(userData).select().single();
    if (error) throw error;
    return data;
};

export const updateUser = async (userId: string, userData: Partial<Pick<User, 'name' | 'role'>>): Promise<User> => {
    const { data, error } = await supabase.from('users').update(userData).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

export const deleteUser = async (userId: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
};

export const getApprovalRoutes = async (): Promise<ApprovalRoute[]> => {
    const { data, error } = await supabase.from('approval_routes').select('*').order('name');
    if (error) throw error;
    return data;
};

export const addApprovalRoute = async (routeData: Pick<ApprovalRoute, 'name' | 'route_data'>): Promise<ApprovalRoute> => {
    const { data, error } = await supabase.from('approval_routes').insert(routeData).select().single();
    if (error) throw error;
    return data;
};

export const updateApprovalRoute = async (routeId: string, routeData: Partial<Pick<ApprovalRoute, 'name' | 'route_data'>>): Promise<ApprovalRoute> => {
    const { data, error } = await supabase.from('approval_routes').update(routeData).eq('id', routeId).select().single();
    if (error) throw error;
    return data;
};

export const deleteApprovalRoute = async (routeId: string): Promise<void> => {
    const { error } = await supabase.from('approval_routes').delete().eq('id', routeId);
    if (error) throw error;
};

export const submitApplication = async (applicationData: {
    formData: any,
    applicationCodeId: string,
    approvalRouteId: string
}, applicantId: string) => {
    const { data: routeData, error: routeError } = await supabase
        .from('approval_routes')
        .select('route_data')
        .eq('id', applicationData.approvalRouteId)
        .single();
    
    if (routeError || !routeData) throw new Error('選択された承認ルートが見つかりません。');
    
    const firstApproverId = routeData.route_data?.steps?.[0]?.approver_id || null;
    if (!firstApproverId) throw new Error('承認ルートに承認者が設定されていません。');

    const submission = {
        form_data: applicationData.formData,
        status: 'pending_approval',
        approval_route_id: applicationData.approvalRouteId,
        application_code_id: applicationData.applicationCodeId,
        submitted_at: new Date().toISOString(),
        current_level: 1,
        applicant_id: applicantId,
        approver_id: firstApproverId,
    };

    const { data, error } = await supabase.from('applications').insert([submission]).select();

    if (error) throw error;
    return data[0];
};

export const approveApplication = async (application: ApplicationWithDetails, currentUser: User): Promise<Application> => {
    if (application.approver_id !== currentUser.id) throw new Error("権限がありません。");
    if (application.status !== 'pending_approval') throw new Error("この申請は承認待ちではありません。");

    const route = application.approval_routes;
    if (!route) throw new Error("申請に紐づく承認ルートが見つかりません。");

    const currentLevel = application.current_level;
    const steps = route.route_data.steps;
    let updates: Partial<Application> = {};
    
    if (currentLevel < steps.length) {
        updates = { current_level: currentLevel + 1, approver_id: steps[currentLevel].approver_id };
    } else {
        updates = { status: 'approved', approver_id: null, approved_at: new Date().toISOString() };
    }

    const { data, error } = await supabase.from('applications').update(updates).eq('id', application.id).select().single();
    if (error) throw error;
    return data;
};

export const rejectApplication = async (application: ApplicationWithDetails, reason: string, currentUser: User): Promise<Application> => {
    if (application.approver_id !== currentUser.id) throw new Error("権限がありません。");
    if (application.status !== 'pending_approval') throw new Error("この申請は承認待ちではありません。");

    const updates: Partial<Application> = {
        status: 'rejected',
        approver_id: null,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
    };

    const { data, error } = await supabase.from('applications').update(updates).eq('id', application.id).select().single();
    if (error) throw error;
    return data;
};

export const updateJobReadyToInvoice = async (jobId: string, ready: boolean): Promise<Job> => {
    const { data, error } = await supabase.from('jobs').update({ ready_to_invoice: ready }).eq('id', jobId).select().single();
    if (error) throw error;
    return dbJobToJob(data);
};

export const createInvoiceFromJobs = async (jobIds: string[]): Promise<{ invoiceId: string, invoiceNo: string }> => {
    const { data, error } = await supabase.rpc('create_invoice_from_jobs', { job_ids: jobIds });
    if (error) throw error;
    return data[0];
};

export const getInvoices = async (): Promise<Invoice[]> => {
    const { data, error } = await supabase.from('invoices').select('*, items:invoice_items(*)').order('invoice_date', { ascending: false });
    if (error) throw error;
    return data ? data.map(dbInvoiceToInvoice) : [];
};

export const markInvoiceAsPaid = async (invoiceId: string): Promise<void> => {
    const { error } = await supabase.rpc('mark_invoice_paid', { p_invoice_id: invoiceId });
    if (error) throw error;
};

export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(dbLeadToLead);
};

export const addLead = async (leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Lead> => {
    const dbLead = leadToDbLead(leadData);
    const { data, error } = await supabase.from('leads').insert(dbLead).select().single();
    if (error) throw error;
    return dbLeadToLead(data);
};

export const updateLead = async (leadId: string, leadData: Partial<Lead>): Promise<Lead> => {
    const dbLead = leadToDbLead(leadData);
    const { data, error } = await supabase.from('leads').update(dbLead).eq('id', leadId).select().single();
    if (error) throw error;
    return dbLeadToLead(data);
};

export const deleteLead = async (leadId: string): Promise<void> => {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (error) throw error;
};

export const getAccountItems = async (): Promise<AccountItem[]> => {
  const { data, error } = await supabase.from('account_items').select('*').order('code');
  if (error) throw error;
  return data.map(dbAccountItemToAccountItem);
};

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    const { data, error } = await supabase.from('purchase_orders').select('*').order('order_date', { ascending: false });
    if (error) throw error;
    return data.map(po => ({
        id: po.id,
        supplierName: po.supplier_name,
        itemName: po.item_name,
        orderDate: po.order_date,
        quantity: po.quantity,
        unitPrice: po.unit_price,
        status: po.status,
        createdAt: po.created_at
    }));
};

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase.from('inventory_items').select('*').order('name');
    if (error) throw error;
    return data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        createdAt: item.created_at,
    }));
};

export const runDatabaseSetup = async () => {
    const { error } = await supabase.rpc('setup_database');
    if (error) {
        console.error('Error running database setup function:', error);
        throw new Error(`Automatic database setup failed: ${error.message}. Please ensure the 'setup_database' function exists in your Supabase project.`);
    }
};