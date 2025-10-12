

import React, { useState, useMemo } from 'react';
import { JournalEntry, SortConfig } from '../types';
import { ArrowUpDown, PlusCircle, ChevronDown } from './Icons';

interface JournalLedgerProps {
  entries: JournalEntry[];
  // FIX: Correct the type of the `onAddEntry` prop to match the expected signature from the parent component (`App.tsx`), which expects an object without `id`, `date`, or `status`.
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'date' | 'status'>) => void;
  isDemoMode: boolean;
}

const JournalLedger: React.FC<JournalLedgerProps> = ({ entries, onAddEntry, isDemoMode }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'descending' });
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    account: '',
    description: '',
    debit: 0,
    credit: 0,
  });
  const [error, setError] = useState('');

  const sortedEntries = useMemo(() => {
    let sortableItems = [...entries];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof JournalEntry];
        const bValue = b[sortConfig.key as keyof JournalEntry];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [entries, sortConfig]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: (name === 'debit' || name === 'credit') ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return;
    if (!newEntry.account || !newEntry.description) {
      setError('勘定科目と摘要は必須です。');
      return;
    }
    if (newEntry.debit === 0 && newEntry.credit === 0) {
      setError('借方または貸方のいずれかに数値を入力してください。');
      return;
    }
    if (newEntry.debit > 0 && newEntry.credit > 0) {
      setError('借方と貸方の両方を同時に入力することはできません。');
      return;
    }
    setError('');
    onAddEntry(newEntry);
    setNewEntry({ account: '', description: '', debit: 0, credit: 0 });
    setShowForm(false);
  };

  const inputClass = "w-full bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">仕訳帳</h3>
          <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
            すべての金銭的取引がここに記録されます。見出しをクリックしてソートできます。
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={isDemoMode}
          className="flex-shrink-0 flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-5 h-5" />
          <span>仕訳を追加</span>
        </button>
      </div>
      
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="account" className={labelClass}>勘定科目</label>
                    <input type="text" id="account" name="account" value={newEntry.account} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="description" className={labelClass}>摘要</label>
                    <input type="text" id="description" name="description" value={newEntry.description} onChange={handleInputChange} className={inputClass} required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="debit" className={labelClass}>借方</label>
                    <input type="number" id="debit" name="debit" value={newEntry.debit} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="credit" className={labelClass}>貸方</label>
                    <input type="number" id="credit" name="credit" value={newEntry.credit} onChange={handleInputChange} className={inputClass} />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">キャンセル</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={isDemoMode}>保存</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <SortableHeader sortKey="date" label="日付" />
              <SortableHeader sortKey="account" label="勘定科目" />
              <SortableHeader sortKey="description" label="摘要" />
              <SortableHeader sortKey="debit" label="借方" className="text-right" />
              <SortableHeader sortKey="credit" label="貸方" className="text-right" />
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => (
              <tr key={entry.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{entry.account}</td>
                <td className="px-6 py-4">{entry.description}</td>
                <td className="px-6 py-4 text-right">{entry.debit > 0 ? `¥${entry.debit.toLocaleString()}` : '-'}</td>
                <td className="px-6 py-4 text-right">{entry.credit > 0 ? `¥${entry.credit.toLocaleString()}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JournalLedger;