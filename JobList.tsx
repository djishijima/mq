
import React, { useState, useMemo } from 'react';
import { Job, SortConfig } from '../types';
import JobStatusBadge from './JobStatusBadge';
import { formatJPY, formatDate } from '../utils';
import EmptyState from './ui/EmptyState';
import { Briefcase, PlusCircle } from './Icons';
import SortableHeader from './ui/SortableHeader';

interface JobListProps {
  jobs: Job[];
  searchTerm: string;
  onSelectJob: (job: Job) => void;
  onNewJob: () => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, searchTerm, onSelectJob, onNewJob }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'createdAt', direction: 'descending' });

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    const lowercasedTerm = searchTerm.toLowerCase();
    return jobs.filter(job => 
      job.clientName.toLowerCase().includes(lowercasedTerm) ||
      job.title.toLowerCase().includes(lowercasedTerm) ||
      job.id.toLowerCase().includes(lowercasedTerm)
    );
  }, [jobs, searchTerm]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedJobs = useMemo(() => {
    let sortableItems = [...filteredJobs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Job] as any;
        const bValue = b[sortConfig.key as keyof Job] as any;

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
  }, [filteredJobs, sortConfig]);

  if (jobs.length === 0 && !searchTerm) {
    return (
        <EmptyState 
            icon={Briefcase}
            title="案件がありません"
            message="最初の案件を登録して、ビジネスの管理を始めましょう。"
            action={{ label: "新規案件作成", onClick: onNewJob, icon: PlusCircle }}
        />
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <SortableHeader sortKey="id" label="案件ID" sortConfig={sortConfig} requestSort={requestSort}/>
              <SortableHeader sortKey="clientName" label="クライアント / タイトル" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="price" label="売上高 (P)" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="variableCost" label="変動費 (V)" sortConfig={sortConfig} requestSort={requestSort} />
              <th scope="col" className="px-6 py-3 font-medium whitespace-nowrap">限界利益 (M)</th>
              <SortableHeader sortKey="status" label="ステータス" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="dueDate" label="納期" sortConfig={sortConfig} requestSort={requestSort} />
            </tr>
          </thead>
          <tbody>
            {sortedJobs.map((job) => {
              const margin = job.price - job.variableCost;
              return (
                <tr key={job.id} onClick={() => onSelectJob(job)} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer odd:bg-slate-50 dark:odd:bg-slate-800/50">
                  <td className="px-6 py-5 font-mono text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {job.id}
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-medium text-base text-slate-800 dark:text-slate-200">{job.clientName}</div>
                    <div className="text-slate-500 dark:text-slate-400">{job.title}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">{formatJPY(job.price)}</td>
                  <td className="px-6 py-5 whitespace-nowrap">{formatJPY(job.variableCost)}</td>
                  <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatJPY(margin)}</td>
                  <td className="px-6 py-5">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">{formatDate(job.dueDate)}</td>
                </tr>
              );
            })}
             {sortedJobs.length === 0 && (
                <tr>
                    <td colSpan={7}>
                        <EmptyState 
                            icon={Briefcase}
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

export default React.memo(JobList);
