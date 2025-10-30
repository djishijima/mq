

import { supabase } from './supabaseClient';
import { AuthUser } from '@supabase/supabase-js';
import {
    EmployeeUser,
    Job,
    Customer,
    JournalEntry,
    User,
    AccountItem,
    Lead,
    ApprovalRoute,
    PurchaseOrder,
    InventoryItem,
    Employee,
    Toast,
    ConfirmationDialogProps,
    BugReport,
    Estimate,
    ApplicationWithDetails,
    Application,
    Invoice,
    InboxItem,
    InvoiceData,
    InboxItemStatus,
    ApplicationCode,
    BugReportStatus,
    ManufacturingStatus,
    InvoiceItem,
    EstimateItem, // Keep for LeadProposalPackage
    EstimateStatus,
    MasterAccountItem,
    PaymentRecipient,
    Department,
    InvoiceStatus,
    LeadStatus,
    AllocationDivision,
    Title,
    UUID, // NEW
    PostalInfo, // NEW
    TrackingInfo, // NEW
    PostalStatus, // NEW
    MailOpenStatus, // NEW
    EstimateLineItem, // NEW
    Project,
    ProjectAttachment, // NEW
    AnalysisHistory
} from '../types';
import { v4 as uuidv4 } from 'uuid'; // NEW

// calcTotalsはEstimateLineItem[]を受け取り、EstimateLineItem[]を返すように修正
function calcTotals(items: EstimateLineItem[], taxInclusive: boolean) {
  let subtotal = 0;
  let taxTotal = 0;
  const normalized = items.map((it) => {
    const sub = it.qty * it.unitPrice;
    const rate = it.taxRate ?? 0.1;
    const tax = taxInclusive ? Math.round(sub - sub / (1 + rate)) : Math.round(sub * rate);
    const total = taxInclusive ? sub : sub + tax;
    return { ...it, subtotal: sub, taxAmount: tax, total };
  });
  normalized.forEach((n) => {
    subtotal += n.subtotal ?? 0;
    taxTotal += n.taxAmount ?? 0;
  });
  const grandTotal = taxInclusive ? Math.round(subtotal) : Math.round(subtotal + taxTotal);
  return { items: normalized, subtotal, taxTotal, grandTotal };
}

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
    projectId: dbJob.project_id, // New
    projectName: dbJob.project_name, // New
    userId: dbJob.user_id,
});

const jobToDbJob = (job: Partial<Job>): any => ({
    job_number: job.jobNumber,
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
    invoiced_at: job.invoicedAt,
    paid_at: job.paidAt,
    ready_to_invoice: job.readyToInvoice,
    invoice_id: job.invoiceId,
    manufacturing_status: job.manufacturingStatus,
    project_id: job.projectId, // New
    project_name: job.projectName, // New
    user_id: job.userId,
});

const dbCustomerToCustomer = (dbCustomer: any): Customer => ({
    id: dbCustomer.id,
    customerCode: dbCustomer.customer_code,
    customerName: dbCustomer.customer_name,
    customerNameKana: dbCustomer.customer_name_kana,
    representative: dbCustomer.representative,
    phoneNumber: dbCustomer.phone_number,
    address1: dbCustomer.address_1,
    companyContent: dbCustomer.company_content,
    annualSales: dbCustomer.annual_sales,
    employeesCount: dbCustomer.employees_count,
    note: dbCustomer.note,
    infoSalesActivity: dbCustomer.info_sales_activity,
    infoRequirements: dbCustomer.info_requirements,
    infoHistory: dbCustomer.info_history,
    createdAt: dbCustomer.created_at,
    postNo: dbCustomer.post_no,
    address2: dbCustomer.address_2,
    fax: dbCustomer.fax,
    closingDay: dbCustomer.closing_day,
    monthlyPlan: dbCustomer.monthly_plan,
    payDay: dbCustomer.pay_day,
    recoveryMethod: dbCustomer.recovery_method,
    userId: dbCustomer.user_id,
    name2: dbCustomer.name2,
    websiteUrl: dbCustomer.website_url,
    zipCode: dbCustomer.zip_code,
    foundationDate: dbCustomer.foundation_date,
    capital: dbCustomer.capital,
    customerRank: dbCustomer.customer_rank,
    customerDivision: dbCustomer.customer_division,
    salesType: dbCustomer.sales_type,
    creditLimit: dbCustomer.credit_limit,
    payMoney: dbCustomer.pay_money,
    bankName: dbCustomer.bank_name,
    branchName: dbCustomer.branch_name,
    accountNo: dbCustomer.account_no,
    salesUserCode: dbCustomer.sales_user_code,
    startDate: dbCustomer.start_date,
    endDate: dbCustomer.end_date,
    drawingDate: dbCustomer.drawing_date,
    salesGoal: dbCustomer.sales_goal,
    infoSalesIdeas: dbCustomer.info_sales_ideas,
    customerContactInfo: dbCustomer.customer_contact_info,
    aiAnalysis: dbCustomer.ai_analysis,
});

const customerToDbCustomer = (customer: Partial<Customer>): any => {
    const dbData: { [key: string]: any } = {};
    for (const key in customer) {
        const camelKey = key as keyof Customer;
        const snakeKey = camelKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        dbData[snakeKey] = customer[camelKey];
    }
    return dbData;
};

const dbProjectAttachmentToProjectAttachment = (att: any): ProjectAttachment => ({
    id: att.id,
    projectId: att.project_id,
    fileName: att.file_name,
    filePath: att.file_path,
    fileUrl: supabase.storage.from('project_files').getPublicUrl(att.file_path).data.publicUrl,
    mimeType: att.mime_type,
    category: att.category,
    createdAt: att.created_at,
});

const dbProjectToProject = (p: any): Project => ({
    id: p.id,
    projectName: p.project_name,
    customerName: p.customer_name,
    customerId: p.customer_id,
    status: p.status,
    overview: p.overview,
    extracted_details: p.extracted_details,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    userId: p.user_id,
    attachments: (p.attachments || []).map(dbProjectAttachmentToProjectAttachment),
    relatedEstimates: p.relatedEstimates, 
    relatedJobs: p.relatedJobs,
});


const dbLeadToLead = (dbLead: any): Lead => ({
    id: dbLead.id,
    status: dbLead.status,
    createdAt: dbLead.created_at,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone,
    company: dbLead.company,
    source: dbLead.source,
    tags: dbLead.tags,
    message: dbLead.message,
    updatedAt: dbLead.updated_at,
    referrer: dbLead.referrer,
    referrerUrl: dbLead.referrer_url,
    landingPageUrl: dbLead.landing_page_url,
    searchKeywords: dbLead.search_keywords,
    utmSource: dbLead.utm_source,
    utmMedium: dbLead.utm_medium,
    utmCampaign: dbLead.utm_campaign,
    utmTerm: dbLead.utm_term,
    utmContent: dbLead.utm_content,
    userAgent: dbLead.user_agent,
    ipAddress: dbLead.ip_address,
    deviceType: dbLead.device_type,
    browserName: dbLead.browser_name,
    osName: dbLead.os_name,
    country: dbLead.country,
    city: dbLead.city,
    region: dbLead.region,
    employees: dbLead.employees,
    budget: dbLead.budget,
    timeline: dbLead.timeline,
    inquiryType: dbLead.inquiry_type,
    inquiryTypes: dbLead.inquiry_types,
    infoSalesActivity: dbLead.info_sales_activity,
    score: dbLead.score,
    aiAnalysisReport: dbLead.ai_analysis_report,
    aiDraftProposal: dbLead.ai_draft_proposal,
    aiInvestigation: dbLead.ai_investigation ? { summary: dbLead.ai_investigation.summary, sources: dbLead.ai_investigation.sources } : undefined,
});

const leadToDbLead = (lead: Partial<Lead>): any => {
    const dbData: { [key: string]: any } = {};
    for (const key in lead) {
        const camelKey = key as keyof Lead;
        const snakeKey = camelKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        dbData[snakeKey] = lead[camelKey];
    }
    return dbData;
};

const dbBugReportToBugReport = (dbReport: any): BugReport => ({
    id: dbReport.id,
    reporterName: dbReport.reporter_name,
    reportType: dbReport.report_type,
    summary: dbReport.summary,
    description: dbReport.description,
    status: dbReport.status,
    createdAt: dbReport.created_at,
});

const bugReportToDbBugReport = (report: Partial<BugReport>): any => ({
    reporter_name: report.reporterName,
    report_type: report.reportType,
    summary: report.summary,
    description: report.description,
    status: report.status,
});

const dbApplicationCodeToApplicationCode = (d: any): ApplicationCode => ({
    id: d.id,
    code: d.code,
    name: d.name,
    description: d.description,
    createdAt: d.created_at,
});

const dbApprovalRouteToApprovalRoute = (d: any): ApprovalRoute => ({
    id: d.id,
    name: d.name,
    routeData: {
        steps: (d.route_data?.steps || []).map((s: any) => ({
            approverId: s.approver_id,
        })),
    },
    createdAt: d.created_at,
});

// Mappers for Estimate (UPDATED)
const dbEstimateToEstimate = (dbEstimate: any): Estimate => ({
    id: dbEstimate.id as UUID,
    estimateNumber: dbEstimate.estimate_number,
    customerName: dbEstimate.customer_name,
    title: dbEstimate.title,
    items: dbEstimate.items, // JSONB field, no key transformation needed
    subtotal: dbEstimate.subtotal,
    taxTotal: dbEstimate.tax_total,
    grandTotal: dbEstimate.grand_total,
    // total: dbEstimate.total, // Removed as per type definition update
    deliveryDate: dbEstimate.delivery_date,
    paymentTerms: dbEstimate.payment_terms,
    deliveryTerms: dbEstimate.delivery_terms, // Added
    deliveryMethod: dbEstimate.delivery_method,
    notes: dbEstimate.notes,
    status: dbEstimate.status,
    version: dbEstimate.version,
    userId: dbEstimate.user_id,
    user: dbEstimate.user, // Assuming user is joined if needed
    createdAt: dbEstimate.created_at,
    updatedAt: dbEstimate.updated_at,
    projectId: dbEstimate.project_id, // New
    projectName: dbEstimate.project_name, // New
    // NEW tracking/postal fields
    taxInclusive: dbEstimate.tax_inclusive, // Added
    pdfUrl: dbEstimate.pdf_url,
    tracking: dbEstimate.tracking,
    postal: dbEstimate.postal,
});

// FIX: Bug where totals were always recalculated to 0 on partial updates without items.
// Now, totals are only calculated and included if 'items' are part of the update.
const estimateToDbEstimate = (estimate: Partial<Estimate>): any => {
    const dbData: { [key: string]: any } = {};

    // Only handle non-total-related fields in the loop
    for (const key in estimate) {
        if (['user', 'estimateNumber', 'id', 'createdAt', 'updatedAt', 'items', 'subtotal', 'taxTotal', 'grandTotal'].includes(key)) {
            continue; // Skip fields handled separately or not for DB
        }
        const camelKey = key as keyof Estimate;
        const snakeKey = camelKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        dbData[snakeKey] = estimate[camelKey];
    }

    // Only recalculate and add totals if 'items' is explicitly part of the update
    if (estimate.hasOwnProperty('items')) {
        const totals = calcTotals(estimate.items || [], estimate.taxInclusive || false);
        dbData['items'] = totals.items;
        dbData['subtotal'] = totals.subtotal;
        dbData['tax_total'] = totals.taxTotal;
        dbData['grand_total'] = totals.grandTotal;
    }

    return dbData;
};

const dbToAnalysisHistory = (dbHistory: any): AnalysisHistory => ({
    id: dbHistory.id,
    userId: dbHistory.user_id,
    viewpoint: dbHistory.viewpoint,
    dataSources: dbHistory.data_sources,
    result: dbHistory.result,
    createdAt: dbHistory.created_at,
});


export const isSupabaseUnavailableError = (error: any): boolean => {
    if (!error) return false;
    const message = typeof error === 'string' ? error : error.message || error.details || error.error_description;
    if (!message) return false;
    return /fetch failed/i.test(message) || /failed to fetch/i.test(message) || /network/i.test(message);
};

export const resolveUserSession = async (authUser: AuthUser): Promise<EmployeeUser> => {
    // 1. Upsert into public.users to ensure the profile exists and is up-to-date.
    const { error: usersUpsertError } = await supabase
        .from('users')
        .upsert({
            id: authUser.id,
            name