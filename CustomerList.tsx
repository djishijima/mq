
import React, { useState, useMemo } from 'react';
import { Customer, SortConfig } from '../types';
import { Pencil, Eye, Mail, Lightbulb, Users, PlusCircle } from './Icons';
import EmptyState from './ui/EmptyState';
import SortableHeader from './ui/SortableHeader';
import { DropdownMenu, DropdownMenuItem } from './ui/DropdownMenu';

interface CustomerListProps {
  customers: Customer[];
  searchTerm: string;
  onSelectCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onAnalyzeCustomer: (customer: Customer) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, searchTerm, onSelectCustomer, onEditCustomer, onAnalyzeCustomer, addToast }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'customerName', direction: 'ascending' });

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.customerName.toLowerCase().includes(lowercasedTerm) ||
      (customer.representative && customer.representative.toLowerCase().includes(lowercasedTerm)) ||
      (customer.phoneNumber && customer.phoneNumber.includes(lowercasedTerm))
    );
  }, [customers, searchTerm]);
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = useMemo(() => {
    let sortableItems = [...filteredCustomers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Customer];
        const bValue = b[sortConfig.key as keyof Customer];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCustomers, sortConfig]);

  const handleGenerateProposal = async (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    addToast('現在この機能は利用できません。', 'info');
  };

  if (customers.length === 0 && !searchTerm) {
      return <EmptyState icon={Users} title="顧客が登録されていません" message="最初の顧客を登録して、取引を開始しましょう。" />;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <SortableHeader sortKey="customerCode" label="顧客コード" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="customerName" label="顧客名" sortConfig={sortConfig} requestSort={requestSort}/>
              <th scope="col" className="px-6 py-3 font-medium">代表者</th>
              <th scope="col" className="px-6 py-3 font-medium">電話番号</th>
              <th scope="col" className="px-6 py-3 font-medium">住所</th>
              <th scope="col" className="px-6 py-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((customer) => (
              <tr key={customer.id} onClick={() => onSelectCustomer(customer)} className="group bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 odd:bg-slate-50 dark:odd:bg-slate-800/50 cursor-pointer">
                <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">{customer.customerCode || '-'}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{customer.customerName}</div>
                  <div className="text-slate-500 text-sm">{customer.customerNameKana}</div>
                </td>
                <td className="px-6 py-4">{customer.representative || '-'}</td>
                <td className="px-6 py-4">{customer.phoneNumber || '-'}</td>
                <td className="px-6 py-4 truncate max-w-sm">{customer.address1 || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectCustomer(customer); }}>
                          <Eye className="w-4 h-4" /> 詳細表示
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditCustomer(customer); }}>
                          <Pencil className="w-4 h-4" /> 編集
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAnalyzeCustomer(customer); }}>
                          <Lightbulb className="w-4 h-4" /> AI企業分析
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={(e) => handleGenerateProposal(e, customer)}>
                          <Mail className="w-4 h-4" /> 提案メール作成
                       </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
             {sortedCustomers.length === 0 && (
              <tr>
                <td colSpan={6}>
                    <EmptyState 
                        icon={Users}
                        title="検索結果がありません"
                        message="検索条件を変更して、もう一度お試しください。"
                    />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(CustomerList);
