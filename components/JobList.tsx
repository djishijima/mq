
import React, { useState, useMemo } from 'react';
import { Job, SortConfig } from '../types';
import JobStatusBadge from './JobStatusBadge';
import { ArrowUpDown, ChevronDown } from './Icons';

interface JobListProps {
  jobs: Job[];
}

const JobList: React.FC<JobListProps> = ({ jobs }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'createdAt', direction: 'descending' });

  const sortedJobs = useMemo(() => {
    let sortableItems = [...jobs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Job];
        const bValue = b[sortConfig.key as keyof Job];

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
  }, [jobs, sortConfig]);

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
              {label}
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
      <div className="p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">全案件一覧</h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
          すべての印刷案件の状況とMQ会計指標を含むリストです。見出しをクリックしてソートできます。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-6 py-3">案件ID</th>
              <th scope="col" className="px-6 py-3">クライアント / タイトル</th>
              <SortableHeader sortKey="price" label="売上高 (P)" className="text-right" />
              <SortableHeader sortKey="variableCost" label="変動費 (V)" className="text-right" />
              <th scope="col" className="px-6 py-3 text-right">限界利益 (M)</th>
              <SortableHeader sortKey="status" label="ステータス" />
              <SortableHeader sortKey="dueDate" label="納期" />
            </tr>
          </thead>
          <tbody>
            {sortedJobs.map((job) => {
              const margin = job.price - job.variableCost;
              return (
                <tr key={job.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">
                    {job.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{job.clientName}</div>
                    <div className="text-slate-500">{job.title}</div>
                  </td>
                  <td className="px-6 py-4 text-right">¥{job.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">¥{job.variableCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">¥{margin.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4">{job.dueDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobList;