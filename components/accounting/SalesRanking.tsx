
import React, { useMemo } from 'react';
import { Job, JobStatus } from '../../types';

interface SalesRankingProps {
    jobs: Job[];
}

const SalesRanking: React.FC<SalesRankingProps> = ({ jobs }) => {
    const customerData = useMemo(() => {
        const data = jobs.reduce((acc, job) => {
            if (job.status === JobStatus.Completed || job.status === JobStatus.InProgress) {
                if (!acc[job.clientName]) {
                    acc[job.clientName] = { clientName: job.clientName, jobCount: 0, totalSales: 0, totalMargin: 0 };
                }
                acc[job.clientName].jobCount += 1;
                acc[job.clientName].totalSales += job.price;
                acc[job.clientName].totalMargin += (job.price - job.variableCost);
            }
            return acc;
        }, {} as Record<string, { clientName: string, jobCount: number, totalSales: number, totalMargin: number }>);

        return Object.values(data).sort((a, b) => b.totalSales - a.totalSales);
    }, [jobs]);

    return (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">順位</th>
                            <th scope="col" className="px-6 py-3">クライアント名</th>
                            <th scope="col" className="px-6 py-3 text-right">案件数</th>
                            <th scope="col" className="px-6 py-3 text-right">総売上 (P)</th>
                            <th scope="col" className="px-6 py-3 text-right">総限界利益 (M)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customerData.map((customer, index) => (
                            <tr key={customer.clientName} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{index + 1}</td>
                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{customer.clientName}</td>
                                <td className="px-6 py-4 text-right">{customer.jobCount}</td>
                                <td className="px-6 py-4 text-right">¥{customer.totalSales.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">¥{customer.totalMargin.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesRanking;