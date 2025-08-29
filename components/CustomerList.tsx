
import React, { useState, useMemo } from 'react';
import { Customer, SortConfig } from '../types';
import { ArrowUpDown, ChevronDown, Search, PlusCircle, Pencil } from './Icons';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onNewCustomer: () => void;
  isDemoMode: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onEditCustomer, onNewCustomer, isDemoMode }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'customerName', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.customerName.toLowerCase().includes(lowercasedTerm) ||
      (customer.representative && customer.representative.toLowerCase().includes(lowercasedTerm)) ||
      (customer.phoneNumber && customer.phoneNumber.includes(lowercasedTerm))
    );
  }, [customers, searchTerm]);

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

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader: React.FC<{ sortKey: string; label: string; className?: string }> = ({ sortKey, label, className }) => {
    const isActive = sortConfig?.key === sortKey;
    const isAscending = sortConfig?.direction === 'ascending';

    return (
        <th scope="col" className={`px-6 py-3 ${className || ''}`}>
          <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1 group">
              <span className={isActive ? 'font-bold text-slate-800 dark:text-slate-100' : ''}>{label}</span>
              <div className="w-4 h-4">
                  {isActive ? (
                      <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-slate-200 transition-transform duration-200 ${isAscending ? 'rotate-180' : 'rotate-0'}`} />
                  ) : (
                      <ArrowUpDown className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
              </div>
          </button>
      </th>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">顧客一覧</h2>
                <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                登録されている全顧客のリストです。顧客名をクリックすると詳細を表示・編集できます。
                </p>
            </div>
            <button
                onClick={onNewCustomer}
                disabled={isDemoMode}
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                <PlusCircle className="w-5 h-5" />
                <span>新規顧客登録</span>
            </button>
        </div>
        <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="顧客名, 代表者, 電話番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-base bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 pl-10 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <SortableHeader sortKey="customerCode" label="顧客コード" />
              <th scope="col" className="px-6 py-3">顧客名</th>
              <th scope="col" className="px-6 py-3">代表者</th>
              <th scope="col" className="px-6 py-3">電話番号</th>
              <th scope="col" className="px-6 py-3">住所</th>
              <th scope="col" className="px-6 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((customer) => (
              <tr key={customer.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">{customer.customerCode || '-'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => onSelectCustomer(customer)} className="text-left hover:underline text-blue-600 dark:text-blue-400">
                    <div className="font-medium">{customer.customerName}</div>
                    <div className="text-slate-500 text-sm">{customer.customerNameKana}</div>
                  </button>
                </td>
                <td className="px-6 py-4">{customer.representative || '-'}</td>
                <td className="px-6 py-4">{customer.phoneNumber || '-'}</td>
                <td className="px-6 py-4 truncate max-w-sm">{customer.address1 || '-'}</td>
                <td className="px-6 py-4 text-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditCustomer(customer);
                        }}
                        className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-1 px-3 rounded-md text-sm transition-colors"
                        aria-label={`顧客 ${customer.customerName} を編集`}
                    >
                        <Pencil className="w-4 h-4" />
                        <span>編集</span>
                    </button>
                </td>
              </tr>
            ))}
             {sortedCustomers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <p className="font-semibold">{searchTerm ? '検索結果がありません。' : '顧客データがありません。'}</p>
                    <p className="text-base mt-1">{searchTerm ? '検索条件を変更してください。' : '新規顧客を登録してください。'}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerList;