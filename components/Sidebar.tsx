
import * as React from 'react';
import { Page, User } from '../types';
import { LayoutDashboard, Users, Settings, Package, FileText, Briefcase, ChevronDown, DollarSign, TrendingUp, Inbox, PieChart, ShoppingCart, BookOpen, CheckCircle, Archive } from './Icons';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: User | null;
}

type NavItemType = {
  page: Page;
  name: string;
};

type NavCategoryType = {
  id: string;
  name: string;
  icon: React.ElementType;
  items: NavItemType[];
  adminOnly?: boolean;
};

const ALL_NAV_CATEGORIES: NavCategoryType[] = [
    {
        id: 'sales',
        name: '販売',
        icon: Briefcase,
        adminOnly: true,
        items: [
            { page: 'sales_leads', name: 'リード' },
            { page: 'sales_customers', name: '取引先' },
            { page: 'sales_pipeline', name: 'パイプライン（進捗）' },
            { page: 'sales_estimates', name: '見積' },
            { page: 'sales_orders', name: '案件・受注管理' },
            { page: 'sales_billing', name: '売上請求 (AR)' },
        ]
    },
    {
        id: 'purchasing',
        name: '購買',
        icon: ShoppingCart,
        adminOnly: true,
        items: [
            { page: 'purchasing_orders', name: '発注 (PO)' },
        ]
    },
    {
        id: 'inventory',
        name: '在庫／製造',
        icon: Package,
        adminOnly: true,
        items: [
            { page: 'inventory_management', name: '在庫管理' },
            { page: 'manufacturing_cost', name: '製造原価' },
        ]
    },
    {
        id: 'hr',
        name: '人事労務',
        icon: Users,
        adminOnly: true,
        items: [
            { page: 'hr_labor_cost', name: '人件費配賦' },
        ]
    },
    {
        id: 'approvals',
        name: '申請・承認',
        icon: CheckCircle,
        items: [
            { page: 'approval_list', name: '承認一覧' },
            { page: 'approval_form_expense', name: '経費精算' },
            { page: 'approval_form_transport', name: '交通費申請' },
            { page: 'approval_form_leave', name: '休暇申請' },
            { page: 'approval_form_approval', name: '稟議' },
            { page: 'approval_form_daily', name: '日報' },
            { page: 'approval_form_weekly', name: '週報' },
        ]
    },
    {
        id: 'daily_accounting',
        name: '日常会計',
        icon: BookOpen,
        adminOnly: true,
        items: [
            { page: 'accounting_inbox', name: 'AI受信箱' },
            { page: 'accounting_journal', name: '仕訳入力・確認' },
        ]
    },
    {
        id: 'monthly_closing',
        name: '月次・決算',
        icon: FileText,
        adminOnly: true,
        items: [
            { page: 'accounting_general_ledger', name: '総勘定元帳' },
            { page: 'accounting_trial_balance', name: '試算表' },
        ]
    },
    {
        id: 'analysis',
        name: '分析・経営',
        icon: PieChart,
        adminOnly: true,
        items: [
            { page: 'accounting_business_plan', name: '経営計画' },
            { page: 'analysis_ranking', name: '売上ランキング' },
        ]
    },
    {
        id: 'management',
        name: '管理',
        icon: Settings,
        adminOnly: true,
        items: [
            { page: 'admin_user_management', name: 'ユーザー管理' },
            { page: 'admin_route_management', name: '承認ルート管理' },
        ]
    },
    {
        id: 'settings',
        name: '設定',
        icon: Settings,
        items: [
            { page: 'settings', name: '設定' }
        ]
    }
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, currentUser }) => {
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({
    sales: true,
    approvals: true,
  });

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navCategories = ALL_NAV_CATEGORIES.filter(cat => !cat.adminOnly || currentUser?.role === 'admin');

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 p-4 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="flex items-center gap-2 px-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-700">
        <LayoutDashboard className="w-8 h-8 text-blue-600" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">文唱堂ERP</h1>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        <button
          onClick={() => onNavigate('analysis_dashboard')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors text-base font-medium ${
              currentPage === 'analysis_dashboard'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>ホーム</span>
        </button>
        {navCategories.map(cat => (
          <div key={cat.id}>
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg text-left text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
            >
              <div className="flex items-center gap-3">
                <cat.icon className="w-5 h-5" />
                <span>{cat.name}</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${openCategories[cat.id] ? 'rotate-180' : ''}`} />
            </button>
            {openCategories[cat.id] && (
              <div className="pl-6 pt-1 pb-2 space-y-1 border-l-2 border-slate-200 dark:border-slate-600 ml-5">
                {cat.items.map(item => (
                  <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item.page
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
