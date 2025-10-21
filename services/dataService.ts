import { getSupabase } from './supabaseClient';
import { EmployeeUser, Job, Customer, JournalEntry, User, AccountItem, Lead, ApprovalRoute, PurchaseOrder, InventoryItem, Employee, JobStatus, InvoiceStatus, LeadStatus, PurchaseOrderStatus, BugReport, Estimate, ApplicationWithDetails, Application, Invoice, InboxItem, InvoiceData, InboxItemStatus, ApplicationCode, BugReportStatus, ManufacturingStatus, InvoiceItem, EstimateStatus } from '../types';

// Mappers from snake_case (DB) to camelCase (JS)
const dbJobToJob = (dbJob: any): Job => ({
    id: dbJob.id,
    jobNumber: dbJob.job_number,
    clientName: dbJob.client_name,
    title: dbJob.title,
    status: dbJob.status,
    dueDate: dbJob.due_date,
    quantity: dbJob.quantity,
    paperType: dbJob.paper_type,
    finishing: dbJob.finishing,
    details: dbJob.details,
    createdAt: dbJob.created_at,
    price: dbJob.price,
    variableCost: dbJob.variable_cost,
    invoiceStatus: dbJob.invoice_status,
    invoicedAt: dbJob.invoiced_at,
    paidAt: dbJob.paid_at,
    readyToInvoice: dbJob.ready_to_invoice,
    invoiceId: dbJob.invoice_id,
    manufacturingStatus: dbJob.manufacturing_status,
});

const jobToDbJob = (job: Partial<Job>): any => ({
    id: job.id,
    job_number: job.jobNumber,
    client_name: job.clientName,
    title: job.title,
    status: job.status,
    due_date: job.dueDate,
    quantity: job.quantity,
    paper_type: job.paperType,
    finishing: job.finishing,
    details: job.details,
    created_at: job.createdAt,
    price: job.price,
    variable_cost: job.variableCost,
    invoice_status: job.invoiceStatus,
    invoiced_at: job.invoicedAt,
    paid_at: job.paidAt,
    ready_to_invoice: job.readyToInvoice,
    invoice_id: job.invoiceId,
    manufacturing_status: job.manufacturingStatus,
});


// --- Data Service Functions ---

export const getJobs = async (): Promise<Job[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('jobs').select('*').order('job_number', { ascending: false });
    if (error) throw error;
    return (data || []).map(dbJobToJob);
};

export const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'jobNumber'>): Promise<Job> => {
    const supabase = getSupabase();
    const dbJob = jobToDbJob(jobData);
    const { data, error } = await supabase.from('jobs').insert(dbJob).select().single();
    if (error) throw error;
    return dbJobToJob(data);
};

export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('jobs').update(jobToDbJob(updates)).eq('id', id).select().single();
    if (error) throw error;
    return dbJobToJob(data);
};

export const deleteJob = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw error;
};

export const getCustomers = async (): Promise<Customer[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(c => ({...c, customerName: c.customer_name, createdAt: c.created_at, websiteUrl: c.website_url }));
};

export const addCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
    const supabase = getSupabase();
    const { id, createdAt, ...rest } = customerData;
    const { data, error } = await supabase.from('customers').insert({ ...rest, customer_name: rest.customerName, website_url: rest.websiteUrl }).select().single();
    if (error) throw error;
    return data as Customer;
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('customers').update({ ...updates, customer_name: updates.customerName, website_url: updates.websiteUrl }).eq('id', id).select().single();
    if (error) throw error;
    return data as Customer;
};


export const getJournalEntries = async (): Promise<JournalEntry[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const addJournalEntry = async (entryData: Omit<JournalEntry, 'id'|'date'>): Promise<JournalEntry> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('journal_entries').insert(entryData).select().single();
    if (error) throw error;
    return data;
};

export async function getUsers(): Promise<EmployeeUser[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('v_employees_active')
      .select('user_id, name, department, title, email, role, created_at')
      .order('name', { ascending: true });
  
    if (error) {
        console.error('Error fetching users:', error);
        throw new Error(`ユーザーの取得に失敗しました: ${error.message}`);
    }
    return (data || []).map(u => ({
        id: u.user_id,
        name: u.name,
        department: u.department,
        title: u.title,
        email: u.email,
        role: u.role,
        created_at: u.created_at
    }));
}

export const addUser = async (userData: { name: string, email: string | null, role: 'admin' | 'user' }): Promise<void> => {
    console.log("Attempting to add user (placeholder):", userData);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').insert({ email: userData.email, name: userData.name, role: userData.role }).select().single();
    if (error) console.error("This will fail if the user doesn't exist in auth.users. It requires an invite flow.", error);
    return;
};

export const updateUser = async (id: string, updates: Partial<EmployeeUser>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('users').update({ name: updates.name, email: updates.email, role: updates.role }).eq('id', id);
    if (error) throw error;
};

export const deleteUser = async (userId: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('employees').update({ active: false }).eq('user_id', userId);
    if (error) throw error;
};

export const getLeads = async (): Promise<Lead[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const addLead = async (leadData: Partial<Lead>): Promise<Lead> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('leads').insert(leadData).select().single();
    if (error) throw error;
    return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteLead = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
};

export const getApprovalRoutes = async (): Promise<ApprovalRoute[]> => { 
    const supabase = getSupabase();
    const { data, error } = await supabase.from('approval_routes').select('*');
    if (error) throw error;
    return data || [];
};
export const addApprovalRoute = async (routeData: any): Promise<ApprovalRoute> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('approval_routes').insert(routeData).select().single();
    if (error) throw error;
    return data;
};
export const updateApprovalRoute = async (id: string, updates: Partial<ApprovalRoute>): Promise<ApprovalRoute> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('approval_routes').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteApprovalRoute = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('approval_routes').delete().eq('id', id);
    if (error) throw error;
};

export const getApplications = async (currentUser: User | null): Promise<ApplicationWithDetails[]> => { 
    const supabase = getSupabase();
    const { data, error } = await supabase.from('applications').select(`*, applicant:applicant_id(*), application_codes:application_code_id(*), approval_routes:approval_route_id(*)`).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};
export const getApplicationCodes = async (): Promise<ApplicationCode[]> => { 
    const supabase = getSupabase();
    const { data, error } = await supabase.from('application_codes').select('*');
    if (error) throw error;
    return data || [];
};
export const submitApplication = async (appData: any, applicantId: string): Promise<Application> => { 
    const supabase = getSupabase();
    const { data, error } = await supabase.from('applications').insert({ ...appData, applicant_id: applicantId, status: 'pending_approval', submitted_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data;
};
export const approveApplication = async (app: ApplicationWithDetails, currentUser: User): Promise<void> => { return Promise.resolve(); };
export const rejectApplication = async (app: ApplicationWithDetails, reason: string, currentUser: User): Promise<void> => { return Promise.resolve(); };

export const getAccountItems = async (): Promise<AccountItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('account_items').select('*');
    if (error) throw error;
    return data || [];
};
export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('purchase_orders').select('*').order('order_date', { ascending: false });;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, supplierName: d.supplier_name, itemName: d.item_name, orderDate: d.order_date, unitPrice: d.unit_price }));
};

export const addPurchaseOrder = async (order: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('purchase_orders').insert({
        supplier_name: order.supplierName,
        item_name: order.itemName,
        order_date: order.orderDate,
        quantity: order.quantity,
        unit_price: order.unitPrice,
        status: order.status,
    }).select().single();
    if (error) throw error;
    return data as PurchaseOrder;
}


export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inventory_items').select('*').order('name');
    if (error) throw error;
    return (data || []).map(d => ({ ...d, unitPrice: d.unit_price }));
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inventory_items').insert({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice
    }).select().single();
    if (error) throw error;
    return data as InventoryItem;
}

export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inventory_items').update({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice
    }).eq('id', id).select().single();
    if (error) throw error;
    return data as InventoryItem;
}


export const getEmployees = async (): Promise<Employee[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('employees').select('*');
    if (error) throw error;
    return data || [];
};
export const getBugReports = async (): Promise<BugReport[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bug_reports').select('*').order('created_at', {ascending: false});
    if (error) throw error;
    return data || [];
};
export const addBugReport = async (report: any): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('bug_reports').insert({ ...report, status: '未対応' });
    if (error) throw error;
};
export const updateBugReport = async (id: string, updates: Partial<BugReport>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('bug_reports').update(updates).eq('id', id);
    if (error) throw error;
};

export const getEstimates = async (): Promise<Estimate[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('estimates').select('*');
    if (error) throw error;
    return data || [];
};
export const addEstimate = async (estimateData: any): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('estimates').insert(estimateData);
    if (error) throw error;
};

export const updateEstimate = async (id: string, updates: Partial<Estimate>): Promise<Estimate> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('estimates').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const supabase = getSupabase();
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.paid_at) dbUpdates.paid_at = updates.paid_at;
    
    const { data, error } = await supabase.from('invoices').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};


// --- Implemented Functions ---

export const getInvoices = async (): Promise<Invoice[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('invoices').select('*, items:invoice_items(*)').order('invoice_date', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createInvoiceFromJobs = async (jobIds: string[]): Promise<{ invoiceNo: string }> => {
    // This should ideally be a single transaction or an RPC call in Supabase for atomicity.
    // We'll simulate it client-side.
    const supabase = getSupabase();

    // 1. Fetch jobs to be invoiced
    const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*').in('id', jobIds);
    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) throw new Error("No jobs found for invoicing.");

    // 2. Group by customer and create invoices
    const customerName = jobs[0].client_name;
    const subtotal = jobs.reduce((sum, job) => sum + job.price, 0);
    const tax = subtotal * 0.1; // Assuming 10% tax
    const total = subtotal + tax;
    const invoiceNo = `INV-${Date.now()}`;

    // 3. Insert invoice record
    const { data: newInvoice, error: invoiceError } = await supabase.from('invoices').insert({
        invoice_no: invoiceNo,
        invoice_date: new Date().toISOString().split('T')[0],
        customer_name: customerName,
        subtotal_amount: subtotal,
        tax_amount: tax,
        total_amount: total,
        status: 'issued',
    }).select().single();
    if (invoiceError) throw invoiceError;

    // 4. Insert invoice items
    const invoiceItems: Omit<InvoiceItem, 'id'>[] = jobs.map((job, index) => ({
        invoice_id: newInvoice.id,
        job_id: job.id,
        description: `${job.title} (案件番号: ${job.job_number})`,
        quantity: 1,
        unit: '式',
        unit_price: job.price,
        line_total: job.price,
        sort_index: index,
    }));
    const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
    if (itemsError) throw itemsError;

    // 5. Update jobs
    const { error: updateJobsError } = await supabase.from('jobs').update({
        invoice_id: newInvoice.id,
        invoice_status: InvoiceStatus.Invoiced,
        invoiced_at: new Date().toISOString(),
    }).in('id', jobIds);
    if (updateJobsError) throw updateJobsError;

    return { invoiceNo };
};

export const uploadToInbox = async (file: File): Promise<{ path: string }> => {
    const supabase = getSupabase();
    const filePath = `public/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('inbox').upload(filePath, file);
    if (error) throw error;
    return { path: data.path };
};

export const getInboxItems = async (): Promise<InboxItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inbox_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map(item => {
        const { data: urlData } = supabase.storage.from('inbox').getPublicUrl(item.file_path);
        return {
            ...item,
            fileUrl: urlData.publicUrl,
            extractedData: item.extracted_data,
            errorMessage: item.error_message,
            createdAt: item.created_at,
            fileName: item.file_name,
            filePath: item.file_path,
        }
    });
};

export const addInboxItem = async (item: Omit<InboxItem, 'id' | 'createdAt' | 'fileUrl'>): Promise<InboxItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inbox_items').insert({
        file_name: item.fileName,
        file_path: item.filePath,
        mime_type: item.mimeType,
        status: item.status,
        extracted_data: item.extractedData,
        error_message: item.errorMessage,
    }).select().single();
    if (error) throw error;
    return data as InboxItem;
};

export const updateInboxItem = async (id: string, updates: Partial<InboxItem>): Promise<InboxItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inbox_items').update({
        status: updates.status,
        extracted_data: updates.extractedData,
    }).eq('id', id).select().single();
    if (error) throw error;
    
    const { data: urlData } = supabase.storage.from('inbox').getPublicUrl(data.file_path);
    return { ...data, fileUrl: urlData.publicUrl, extractedData: data.extracted_data } as InboxItem;
};

export const deleteInboxItem = async (itemToDelete: InboxItem): Promise<void> => {
    const supabase = getSupabase();
    const { error: storageError } = await supabase.storage.from('inbox').remove([itemToDelete.filePath]);
    if (storageError) console.error("Storage deletion failed, proceeding with DB deletion:", storageError);

    const { error: dbError } = await supabase.from('inbox_items').delete().eq('id', itemToDelete.id);
    if (dbError) throw dbError;
};

export const updateJobReadyToInvoice = async (jobId: string, value: boolean): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('jobs').update({ ready_to_invoice: value }).eq('id', jobId);
    if (error) throw error;
};