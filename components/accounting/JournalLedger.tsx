

import React, { useState, useMemo, useEffect } from 'react';
import { JournalEntry, SortConfig, AIJournalSuggestion } from '../../types';
import { PlusCircle, Sparkles, Loader, BookOpen, Trash2, AlertTriangle } from '../Icons';
import { suggestFullJournalEntry } from '../../services/geminiService';
import EmptyState from '../ui/EmptyState';
import SortableHeader from '../ui/SortableHeader';

interface JournalLedgerProps {
  entries: JournalEntry[];
  // FIX: Correct the type of the `onAddEntry` prop to match the expected signature from the parent component (`App.tsx`), which expects an object without `id`, `date`, or `status`.
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'date' | 'status'>) => void;
}

const JournalLedger: React.FC<JournalLedgerProps> = ({ entries, onAddEntry }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'descending' });
  const [showForm, setShowForm] = useState(false);
  const [entryList, setEntryList] = useState<Omit<JournalEntry, 'id' | 'date' | 'status'>[]>([]);
  const [error, setError] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (showForm && entryList.length === 0) {
      // Start with two empty rows for a standard double-entry
      setEntryList([
        { account: '', description: '', debit: 0, credit: 0 },
        { account: '', description: '', debit: 0, credit: 0 }
      ]);
    } else if (!showForm) {
      setEntryList([]);
      setError('');
      setAiPrompt('');
    }
  }, [showForm, entryList.length]);

  const sortedEntries = useMemo(() => {
    let sortableItems = [...entries];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof JournalEntry];
        const bValue = b[sortConfig.key as keyof JournalEntry];
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [entries, sortConfig]);

  const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
    const totals = entryList.reduce((acc, entry) => {
      acc.debit += Number(entry.debit) || 0;
      acc.credit += Number(entry.credit) || 0;
      return acc;
    }, { debit: 0, credit: 0 });
    return { totalDebit: totals.debit, totalCredit: totals.credit, isBalanced: totals.debit === totals.credit && totals.debit > 0 };
  }, [entryList]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const updateEntryRow = (index: number, field: keyof AIJournalSuggestion, value: string | number) => {
    setEntryList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addEntryRow = () => {
    setEntryList(prev => [...prev, { account: '', description: '', debit: 0, credit: 0 }]);
  };

  const removeEntryRow = (index: number) => {
    setEntryList(prev => prev.filter((_, i) => i !== index));
  };


  const handleAiGenerate = async () => {
    if (!aiPrompt) {
        setError("AIへの依頼内容を入力してください。");
        return;
    }
    setIsAiLoading(true);
    setError('');
    try {
        const { entries } = await suggestFullJournalEntry(aiPrompt);
        if (entries && entries.length > 0) {
            setEntryList(entries);
        } else {
            setError('AIから有効な仕訳が提案されませんでした。');
        }
    } catch (e) {
        setError(e instanceof Error ? e.message : "AIによる提案の生成中に不明なエラーが発生しました。");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError('借方と貸方の合計が一致しません。');
      return;
    }
    const validEntries = entryList.filter(e => e.account && (e.debit > 0 || e.credit > 0));
    if (validEntries.length === 0) {
      setError('有効な仕訳がありません。');
      return;
    }
    setError('');
    validEntries.forEach(entry => onAddEntry(entry));
    setShowForm(false);
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 p-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500";
  
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
          className="flex-shrink-0 flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>仕訳を追加</span>
        </button>
      </div>
      
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out">
          <div className="bg-blue-50 dark:bg-slate-900/50 p-4 rounded-lg border border-blue-200 dark:border-slate-700 mb-6">
              <label htmlFor="ai-prompt" className="block text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              AIアシスタント (仕訳入力)
              </label>
              <div className="flex gap-2">
                  <input
                      type="text"
                      id="ai-prompt"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="例: カフェでミーティング、コーヒー代1000円を現金で支払った"
                      className="w-full bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isAiLoading}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAiGenerate(); }}}
                  />
                  <button type="button" onClick={handleAiGenerate} disabled={isAiLoading || !aiPrompt} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-400 flex items-center gap-2 transition-colors">
                      {isAiLoading ? <Loader className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
                      <span>{isAiLoading ? '生成中...' : 'AIで生成'}</span>
                  </button>
              </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">勘定科目</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">摘要</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">借方</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">貸方</th>
                            <th className="p-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {entryList.map((entry, index) => (
                            <tr key={index}>
                                <td className="p-1 min-w-[180px]"><input type="text" placeholder="例: 消耗品費" value={entry.account} onChange={e => updateEntryRow(index, 'account', e.target.value)} className={inputClass} required/></td>
                                <td className="p-1 min-w-[240px]"><input type="text" placeholder="例: 事務用品購入" value={entry.description} onChange={e => updateEntryRow(index, 'description', e.target.value)} className={inputClass} /></td>
                                <td className="p-1 min-w-[120px]"><input type="number" placeholder="0" value={entry.debit || ''} onChange={e => updateEntryRow(index, 'debit', Number(e.target.value))} className={`${inputClass} text-right`} /></td>
                                <td className="p-1 min-w-[120px]"><input type="number" placeholder="0" value={entry.credit || ''} onChange={e => updateEntryRow(index, 'credit', Number(e.target.value))} className={`${inputClass} text-right`} /></td>
                                <td className="text-center p-1">
                                    <button type="button" onClick={() => removeEntryRow(index)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex items-start justify-between mt-2">
                <button type="button" onClick={addEntryRow} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                    <PlusCircle className="w-4 h-4" /> 行を追加
                </button>
                <div className="text-right space-y-1">
                    <div className="flex justify-end items-center gap-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">借方合計:</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white w-32 text-right">{`¥${totalDebit.toLocaleString()}`}</span>
                    </div>
                    <div className="flex justify-end items-center gap-4">
                         <span className="text-sm text-slate-500 dark:text-slate-400">貸方合計:</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white w-32 text-right">{`¥${totalCredit.toLocaleString()}`}</span>
                    </div>
                     {!isBalanced && totalDebit + totalCredit > 0 && (
                        <div className="flex justify-end items-center gap-4 pt-2 border-t border-dashed border-red-300 dark:border-red-700">
                             <span className="text-sm font-bold text-red-500 dark:text-red-400">差額:</span>
                            <span className="text-lg font-bold text-red-500 dark:text-red-400 w-32 text-right">{`¥${(totalDebit - totalCredit).toLocaleString()}`}</span>
                        </div>
                    )}
                </div>
            </div>
            
            {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/50 p-3 rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{error}</p>}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-600">
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">キャンセル</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={!isBalanced}>保存</button>
            </div>
          </form>
        </div>
      )}

      {sortedEntries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <SortableHeader sortKey="date" label="日付" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader sortKey="account" label="勘定科目" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader sortKey="description" label="摘要" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader sortKey="debit" label="借方" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                <SortableHeader sortKey="credit" label="貸方" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
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
      ) : (
        <EmptyState 
            icon={BookOpen}
            title="仕訳がありません"
            message="「仕訳を追加」ボタンから最初の取引を記録してください。"
            action={{ label: '仕訳を追加', onClick: () => setShowForm(true), icon: PlusCircle }}
        />
      )}
    </div>
  );
};

export default React.memo(JournalLedger);
