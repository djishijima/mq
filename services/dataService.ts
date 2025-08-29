import { supabase } from './supabaseClient';
import { Job, JobStatus, InvoiceStatus, JournalEntry, Customer, User } from '../types';

// Type for DB job object (snake_case)
interface DbJob {
  id: string;
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
}

// Type for DB customer object (snake_case)
// Using 'any' as the schema is very large. The mapper will enforce types.
type DbCustomer = any;


// Mappers
const dbJobToJob = (job: DbJob): Job => ({
  id: job.id,
  clientName: job.client_name,
  title: job.title,
  status: job.status,
  dueDate: job.due_date,
  quantity: job.quantity,
  paperType: job.paper_type,
  finishing: job.finishing,
  details: job.details,
  createdAt: new Date(job.created_at),
  price: job.price,
  variableCost: job.variable_cost,
  invoiceStatus: job.invoice_status,
});

const jobToDbJob = (job: Omit<Job, 'createdAt'>): Omit<DbJob, 'created_at' | 'id'> & { id: string } => ({
  id: job.id,
  client_name: job.clientName,
  title: job.title,
  status: job.status,
  due_date: job.dueDate,
  quantity: job.quantity,
  paper_type: job.paperType,
  finishing: job.finishing,
  details: job.details,
  price: job.price,
  variable_cost: job.variableCost,
  invoice_status: job.invoiceStatus,
});

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


// API Functions
export const getJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching jobs:', error.message);
    throw new Error('Failed to fetch jobs from Supabase.');
  }
  return data.map(dbJobToJob);
};

export const addJob = async (job: Omit<Job, 'createdAt'>): Promise<Job> => {
  const dbJob = jobToDbJob(job);
  const { data, error } = await supabase.from('jobs').insert([dbJob]).select();
  if (error) {
    console.error('Error adding job:', error.message);
    throw new Error('Failed to add job to Supabase.');
  }
  return dbJobToJob(data[0]);
};

export const updateJobInvoiceStatus = async (jobId: string, status: InvoiceStatus): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .update({ invoice_status: status })
    .eq('id', jobId)
    .select();
  if (error) {
    console.error('Error updating job status:', error.message);
    throw new Error('Failed to update job status in Supabase.');
  }
  return dbJobToJob(data[0]);
};

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
    const { data, error } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
    if (error) {
      console.error('Error fetching journal entries:', error.message);
      throw new Error('Failed to fetch journal entries from Supabase.');
    }
    return data.map(entry => ({...entry, date: new Date(entry.date)}));
  };
  
export const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>): Promise<JournalEntry> => {
    const newEntry = {
        ...entry,
        date: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('journal_entries').insert([newEntry]).select();
    if (error) {
        console.error('Error adding journal entry:', error.message);
        throw new Error('Failed to add journal entry to Supabase.');
    }
    return {...data[0], date: new Date(data[0].date)};
};

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('customer_name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error.message);
    throw new Error('Failed to fetch customers from Supabase.');
  }
  return data.map(dbCustomerToCustomer);
};

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    const dbCustomer = customerToDbCustomer(customerData);
    const { data, error } = await supabase.from('customers').insert(dbCustomer).select();
    if (error) {
        console.error('Error adding customer:', error.message);
        throw new Error('Failed to add customer to Supabase.');
    }
    return dbCustomerToCustomer(data[0]);
};

export const updateCustomer = async (customerId: string, customerData: Partial<Customer>): Promise<Customer> => {
    const dbCustomer = customerToDbCustomer(customerData);
    const { data, error } = await supabase.from('customers').update(dbCustomer).eq('id', customerId).select();
    if (error) {
        console.error('Error updating customer:', error.message);
        throw new Error('Failed to update customer in Supabase.');
    }
    return dbCustomerToCustomer(data[0]);
};

// --- Business Support / Approval Workflow Functions ---

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) {
        console.error('Error fetching users:', error.message);
        throw new Error('Failed to fetch users from Supabase.');
    }
    return data;
};

export const submitApplication = async (applicationData: any) => {
    // This is a simplified submission process for the demo.
    // In a real app, this would involve setting applicant_id, approver_id, etc.
    const submission = {
        form_data: applicationData.formData,
        status: 'pending_approval',
        approval_route: applicationData.approvalRoute,
        application_code_id: applicationData.applicationCodeId,
        submitted_at: new Date().toISOString(),
        current_level: 1,
        // In a real app, applicant_id would be the current logged in user.
        // And approver_id would be the first person in the approval_route.
    };

    const { data, error } = await supabase.from('applications').insert([submission]).select();

    if (error) {
        console.error('Error submitting application:', error.message);
        throw new Error('Failed to submit application.');
    }
    return data[0];
};
