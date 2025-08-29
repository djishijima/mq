import React, { useState } from 'react';
import { Page } from '../types';
import { LayoutDashboard, ListOrdered, Users, Settings, Package, FileText, Briefcase, ChevronDown, DollarSign, ScanLine, TrendingUp } from './Icons';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS = [
  { page: 'dashboard' as Page, name: 'ダッシュボード', icon: LayoutDashboard },
  { page: 'jobs' as Page, name: '案件一覧', icon: ListOrdered },
  { page: 'customers' as Page, name: '顧客管理', icon: Users },
  { page: 'business_support' as Page, name: '業務支援', icon: Briefcase },
];

const ACCOUNTING_SUB_ITEMS: { page: Page; name: string; icon: React.ElementType }[] = [
    { page: 'accounting_invoice', name: '請求・入金管理', icon: DollarSign },
    { page: 'accounting_expense', name: '経費入力', icon: ScanLine },
    { page: 'accounting_ledger', name: '仕訳帳', icon: FileText },
    { page: 'accounting_ranking', name: '売上ランキング', icon: TrendingUp },
];

const NavItem: React.FC<{
  name: string;
  Icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  isSubItem?: boolean;
}> = ({ name, Icon, isActive, onClick, children, isSubItem = false }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
      isSubItem ? 'pl-11' : ''
    } ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : `text-slate-300 ${isSubItem ? 'hover:bg-slate-700/50' : 'hover:bg-slate-700'} hover:text-white`
    }`}
  >
    {!isSubItem && <Icon className="w-5 h-5" />}
    <span className={isSubItem ? '' : 'ml-4 font-medium'}>{name}</span>
    {children}
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const [isAccountingOpen, setIsAccountingOpen] = useState(currentPage.startsWith('accounting_'));

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-800 text-white flex flex-col p-4">
      <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-700">
        <Package className="w-8 h-8 text-blue-400" />
        <h1 className="text-2xl font-bold tracking-tight">MQ会計管理</h1>
      </div>
      <nav className="flex-1 mt-6 space-y-1">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.page}>
              <NavItem
                name={item.name}
                Icon={item.icon}
                isActive={currentPage === item.page}
                onClick={() => onNavigate(item.page)}
              />
            </li>
          ))}
           <li>
            <NavItem
                name="会計管理"
                Icon={FileText}
                isActive={currentPage.startsWith('accounting_')}
                onClick={() => setIsAccountingOpen(!isAccountingOpen)}
            >
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isAccountingOpen ? 'rotate-180' : ''}`} />
            </NavItem>
            {isAccountingOpen && (
                <ul className="mt-1 space-y-1">
                    {ACCOUNTING_SUB_ITEMS.map(item => (
                        <li key={item.page}>
                            <NavItem
                                name={item.name}
                                Icon={item.icon}
                                isActive={currentPage === item.page}
                                onClick={() => onNavigate(item.page)}
                                isSubItem={true}
                            />
                        </li>
                    ))}
                </ul>
            )}
           </li>
        </ul>
      </nav>
      <div className="mt-auto">
         <NavItem
            name="設定"
            Icon={Settings}
            isActive={currentPage === 'settings'}
            onClick={() => onNavigate('settings')}
          />
      </div>
    </aside>
  );
};

export default Sidebar;
