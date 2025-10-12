import React, { useState } from 'react';

interface DatabaseSetupInstructionsModalProps {
  onRetry: () => void;
}

const DatabaseIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
);

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ClipboardIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
);

const RefreshCw: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/>
    </svg>
);


const DatabaseSetupInstructionsModal: React.FC<DatabaseSetupInstructionsModalProps> = ({ onRetry }) => {
  const sqlScript = `CREATE OR REPLACE FUNCTION setup_database()
RETURNS void AS $$
BEGIN
  -- 0.冪等性を確保するため、既存のオブジェクトをすべて削除 (CASCADEで依存関係も削除)
  DROP FUNCTION IF EXISTS public.create_invoice_from_jobs(TEXT[]) CASCADE;
  DROP FUNCTION IF EXISTS public.mark_invoice_paid(UUID) CASCADE;
  DROP TABLE IF EXISTS public.invoice_items CASCADE;
  DROP TABLE IF EXISTS public.applications CASCADE;
  DROP TABLE IF EXISTS public.purchase_orders CASCADE;
  DROP TABLE IF EXISTS public.accounts_payable CASCADE;
  DROP TABLE IF EXISTS public.jobs CASCADE;
  DROP TABLE IF EXISTS public.journal_entries CASCADE;
  DROP TABLE IF EXISTS public.account_items CASCADE;
  DROP TABLE IF EXISTS public.customers CASCADE;
  DROP TABLE IF EXISTS public.leads CASCADE;
  DROP TABLE IF EXISTS public.invoices CASCADE;
  DROP TABLE IF EXISTS public.inbox_items CASCADE;
  DROP TABLE IF EXISTS public.users CASCADE;
  DROP TABLE IF EXISTS public.application_codes CASCADE;
  DROP TABLE IF EXISTS public.approval_routes CASCADE;
  DROP TABLE IF EXISTS public.inventory_items CASCADE;
  DROP TABLE IF EXISTS public.sales_pipeline CASCADE;
  DROP SEQUENCE IF EXISTS public.invoice_no_seq;

  -- 1. テーブルを再作成
  CREATE TABLE public.users ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, role TEXT NOT NULL DEFAULT 'user' );
  CREATE TABLE public.application_codes ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(10) UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL );
  CREATE TABLE public.approval_routes ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, route_data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL );
  CREATE TABLE public.customers ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_code VARCHAR, customer_code_alt VARCHAR, customer_name VARCHAR NOT NULL, customer_name_kana VARCHAR, name2 VARCHAR, customer_rank VARCHAR, customer_division VARCHAR, sales_type VARCHAR, support_company_flag TEXT, zip_code VARCHAR, address_1 VARCHAR, address_2 VARCHAR, address_3 VARCHAR, nearest_station VARCHAR, phone_number VARCHAR, fax VARCHAR, representative VARCHAR, foundation_date DATE, capital VARCHAR, annual_sales VARCHAR, employees_count VARCHAR, credit_limit VARCHAR, closing_day TEXT, pay_day TEXT, recovery_method TEXT, pay_money TEXT, trade_terms TEXT, bank_name VARCHAR, branch_name VARCHAR, branch_code VARCHAR, account_no VARCHAR, account_name_kana VARCHAR, sales_user_code TEXT, note TEXT, info_history TEXT, info_sales_activity TEXT, info_order_flow TEXT, info_transaction_progress TEXT, info_current_orders TEXT, info_future_proposals TEXT, info_competitors TEXT, info_requirements TEXT, info_sales_ideas TEXT, info_management_notes TEXT, info_other TEXT, create_user_id UUID, create_date TIMESTAMPTZ, update_user_id UUID, update_date TIMESTAMPTZ, drawing_memo TEXT, drawing_date TEXT, bill_payment_day TEXT, bill_pay NUMERIC, credit_sales_pay NUMERIC, tax_fraction INTEGER, tax_in_flag TEXT, budget_flag TEXT, start_date DATE, end_date DATE, introducer TEXT, keii TEXT, previous_person TEXT, sales_trends TEXT, gross_profit TEXT, gross_profit_by_product TEXT, company_content TEXT, key_person TEXT, order_rate TEXT, ippan_pub TEXT, text_pub TEXT, gyokai_pub TEXT, shoin_pub TEXT, tsushin_edu TEXT, other_pub TEXT, business_result TEXT, company_features TEXT, customer_trend TEXT, what_happened TEXT, response_to_competitors TEXT, sales_goal TEXT, external_items TEXT, internal_items TEXT, quotation_point TEXT, main_products TEXT, total_order_amount TEXT, rival_info TEXT, customer_contact_info TEXT, org_chart TEXT, pq TEXT, vq TEXT, mq TEXT, m_rate TEXT, accident_history TEXT, customer_voice TEXT, annual_action_plan TEXT, lost_orders TEXT, growth_potential TEXT, monthly_plan TEXT, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL );
  CREATE TABLE public.invoices ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_no TEXT UNIQUE NOT NULL, invoice_date DATE NOT NULL DEFAULT CURRENT_DATE, due_date DATE, customer_name TEXT NOT NULL, subtotal_amount NUMERIC NOT NULL, tax_amount NUMERIC NOT NULL, total_amount NUMERIC NOT NULL, status TEXT NOT NULL DEFAULT 'issued', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), paid_at TIMESTAMPTZ );
  CREATE TABLE public.jobs ( id TEXT PRIMARY KEY, customer_id UUID REFERENCES public.customers(id), client_name TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, due_date DATE NOT NULL, quantity INTEGER NOT NULL, paper_type TEXT NOT NULL, finishing TEXT NOT NULL, details TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), price INTEGER NOT NULL, variable_cost INTEGER NOT NULL, invoice_status TEXT NOT NULL, invoiced_at TIMESTAMPTZ, paid_at TIMESTAMPTZ, ready_to_invoice BOOLEAN DEFAULT false, invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL );
  CREATE TABLE public.invoice_items ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE, job_id TEXT REFERENCES public.jobs(id), description TEXT NOT NULL, quantity NUMERIC NOT NULL, unit TEXT, unit_price NUMERIC NOT NULL, line_total NUMERIC NOT NULL, sort_index INTEGER DEFAULT 0 );
  CREATE TABLE public.journal_entries ( id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, date TIMESTAMPTZ NOT NULL DEFAULT NOW(), account TEXT NOT NULL, debit NUMERIC NOT NULL DEFAULT 0, credit NUMERIC NOT NULL DEFAULT 0, description TEXT, status TEXT NOT NULL DEFAULT 'posted' );
  CREATE TABLE public.account_items ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category_code TEXT, is_active BOOLEAN NOT NULL DEFAULT true, sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() );
  CREATE TABLE public.leads ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT NOT NULL, source TEXT, tags TEXT[], message TEXT, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, updated_at TIMESTAMPTZ, referrer TEXT, referrer_url TEXT, landing_page_url TEXT, search_keywords TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_term TEXT, utm_content TEXT, user_agent TEXT, ip_address TEXT, device_type TEXT, browser_name TEXT, os_name TEXT, country TEXT, city TEXT, region TEXT, status TEXT NOT NULL, employees TEXT, budget TEXT, timeline TEXT, inquiry_type TEXT, inquiry_types TEXT[], info_sales_activity TEXT, assignee_id UUID );
  CREATE TABLE public.inbox_items ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_name TEXT NOT NULL, file_path TEXT NOT NULL, mime_type TEXT NOT NULL, status TEXT NOT NULL, doc_type TEXT NOT NULL DEFAULT 'unknown', extracted_data JSONB, error_message TEXT, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL );
  CREATE TABLE public.applications ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), applicant_id UUID REFERENCES public.users(id), application_code_id UUID REFERENCES public.application_codes(id), form_data JSONB, status TEXT NOT NULL DEFAULT 'draft', submitted_at TIMESTAMPTZ, approved_at TIMESTAMPTZ, rejected_at TIMESTAMPTZ, rejection_reason TEXT, current_level INTEGER, approver_id UUID REFERENCES public.users(id), approval_route_id UUID REFERENCES public.approval_routes(id), created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL );
  CREATE TABLE public.purchase_orders ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), supplier_name TEXT NOT NULL, item_name TEXT NOT NULL, order_date DATE NOT NULL DEFAULT NOW(), quantity NUMERIC NOT NULL, unit_price NUMERIC NOT NULL DEFAULT 0, status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() );
  CREATE TABLE public.inventory_items ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, category TEXT NOT NULL, quantity NUMERIC NOT NULL, unit TEXT NOT NULL, unit_price NUMERIC NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() );

  -- 2. 関数とシーケンスを再作成
  CREATE SEQUENCE public.invoice_no_seq START 1001;
  CREATE FUNCTION public.create_invoice_from_jobs(job_ids TEXT[]) RETURNS TABLE(invoice_id UUID, invoice_no TEXT) AS $$ DECLARE v_customer_name TEXT; v_subtotal_amount NUMERIC := 0; v_tax_rate NUMERIC := 0.10; v_tax_amount NUMERIC; v_total_amount NUMERIC; v_new_invoice_id UUID; v_invoice_no TEXT; job_record RECORD; BEGIN SELECT client_name INTO v_customer_name FROM public.jobs WHERE id = job_ids[1]; IF NOT FOUND THEN RAISE EXCEPTION 'Job with ID % not found', job_ids[1]; END IF; IF EXISTS ( SELECT 1 FROM public.jobs WHERE id = ANY(job_ids) AND (client_name != v_customer_name OR invoice_status != '未請求' OR ready_to_invoice != TRUE) ) THEN RAISE EXCEPTION '全ての案件は同じ顧客のもので、請求準備完了かつ未請求である必要があります。'; END IF; SELECT SUM(price) INTO v_subtotal_amount FROM public.jobs WHERE id = ANY(job_ids); v_tax_amount := v_subtotal_amount * v_tax_rate; v_total_amount := v_subtotal_amount + v_tax_amount; v_invoice_no := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_no_seq')::text, 4, '0'); INSERT INTO public.invoices (invoice_no, customer_name, subtotal_amount, tax_amount, total_amount, status, due_date) VALUES (v_invoice_no, v_customer_name, v_subtotal_amount, v_tax_amount, v_total_amount, 'issued', CURRENT_DATE + interval '30 days') RETURNING id INTO v_new_invoice_id; FOR job_record IN SELECT * FROM public.jobs WHERE id = ANY(job_ids) LOOP INSERT INTO public.invoice_items (invoice_id, job_id, description, quantity, unit, unit_price, line_total) VALUES (v_new_invoice_id, job_record.id, job_record.title, 1, '式', job_record.price, job_record.price); UPDATE public.jobs SET invoice_status = '請求済', invoice_id = v_new_invoice_id, invoiced_at = NOW() WHERE id = job_record.id; END LOOP; RETURN QUERY SELECT v_new_invoice_id, v_invoice_no; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
  CREATE FUNCTION public.mark_invoice_paid(p_invoice_id UUID) RETURNS void AS $$ DECLARE job_record RECORD; BEGIN UPDATE public.invoices SET status = 'paid', paid_at = NOW() WHERE id = p_invoice_id; FOR job_record IN SELECT j.* FROM public.jobs j JOIN public.invoice_items ii ON j.id = ii.job_id WHERE ii.invoice_id = p_invoice_id LOOP UPDATE public.jobs SET invoice_status = '入金済', paid_at = NOW() WHERE id = job_record.id; END LOOP; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 3. トリガーを再作成 (なし)

  -- 4. 初期データを再登録
  INSERT INTO public.account_items (code, name, category_code, sort_order, is_active) VALUES ('1111', '現金', 'NOC', 0, true), ('1114', '普通預金', 'NOC', 0, true), ('1121', '売掛金', 'NOC', 0, true), ('2111', '買掛金', 'NOC', 0, true), ('2112', '未払金', 'NOC', 0, true), ('4111', '売上', 'NOC', 4, true), ('5111', '仕入', 'NOC', 5, true), ('5121', '会議費', 'TRP', 5, true), ('5122', '旅費交通費', 'TRP', 5, true), ('5123', '消耗品費', 'NOC', 5, true) ON CONFLICT (code) DO NOTHING;
  INSERT INTO public.users (id, name, role) VALUES ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'デモ管理者', 'admin'), ('b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'デモユーザー', 'user') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
  INSERT INTO public.application_codes (code, name, description) VALUES ('EXP', '経費精算', '日常的な経費の精算'), ('TRP', '交通費申請', '業務上の移動に伴う交通費の申請'), ('LEV', '休暇申請', '年次有給休暇やその他の休暇の申請'), ('APL', '稟議', '金額の発生しない決裁'), ('DLY', '日報', '日々の業務報告'), ('WKR', '週報', '週次の業務報告') ON CONFLICT (code) DO NOTHING;
  INSERT INTO public.leads (name, company, email, status, source, inquiry_types) SELECT * FROM (VALUES ('井村 拓真', 'レバレジーズM&Aアドバイザリー株式会社', 't.akuma@leverages.jp', '新規'::text, 'Webフォーム'::text, ARRAY['資料請求']::text[]), ('山下 瑞典', '株式会社vanquet', 'yamashitayk@vanquet.jp', '新規'::text, '紹介'::text, ARRAY['見積依頼']::text[]), ('テスト ユーザー', 'テスト株式会社', 'djiohijma@proton.me', '未対応'::text, '不明'::text, ARRAY['その他']::text[])) AS v(name, company, email, status, source, inquiry_types) WHERE NOT EXISTS ( SELECT 1 FROM public.leads WHERE email = v.email );

END;
$$ LANGUAGE plpgsql;
`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex justify-center items-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <header className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <DatabaseIcon className="w-8 h-8 text-blue-500" />
                    自動セットアップの有効化
                </h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    アプリケーションがデータベースを自動的に管理できるように、一度だけ設定が必要です。
                </p>
            </header>
            <main className="p-6 overflow-y-auto">
                <p className="mb-4">
                    SupabaseプロジェクトのSQL Editorで以下のスクリプトを一度だけ実行してください。
                </p>
                <ol className="list-decimal list-inside space-y-4">
                    <li>
                        Supabaseダッシュボードの <strong>SQL Editor</strong> を開きます。
                    </li>
                    <li>
                        下のボックス内のSQLスクリプト全体をコピーし、エディタに貼り付けます。
                        <div className="relative mt-2">
                            <textarea
                                readOnly
                                value={sqlScript}
                                className="w-full h-48 p-3 font-mono text-sm bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-700 focus:outline-none"
                            />
                            <button 
                                onClick={handleCopy}
                                className="absolute top-2 right-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-semibold text-sm py-1 px-2 rounded-md flex items-center gap-1.5 transition-colors"
                            >
                                {copied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                                {copied ? 'コピーしました' : 'コピー'}
                            </button>
                        </div>
                    </li>
                    <li>
                        <strong>RUN</strong> ボタンをクリックしてスクリプトを実行します。
                    </li>
                    <li>
                        完了したら、下の「再試行」ボタンをクリックしてください。
                    </li>
                </ol>
            </main>
            <footer className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button 
                    onClick={onRetry}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                    再試行
                </button>
            </footer>
        </div>
    </div>
  );
};

export default DatabaseSetupInstructionsModal;