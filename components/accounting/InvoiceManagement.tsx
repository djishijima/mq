
import React from 'react';
import { Job, InvoiceStatus } from '../../types';
import { CheckCircle } from '../Icons';

interface InvoiceManagementProps {
    jobs: Job[];
    onUpdateJobInvoiceStatus: (jobId: string, status: InvoiceStatus) => void;
    isDemoMode: boolean;
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({ jobs, onUpdateJobInvoiceStatus, isDemoMode }) => {
    const jobsToDisplay = jobs
        .filter(j => j.invoiceStatus === InvoiceStatus.Invoiced || j.invoiceStatus === InvoiceStatus.Paid)
        .sort((a, b) => {
            if (a.invoiceStatus === InvoiceStatus.Paid && b.invoiceStatus !== InvoiceStatus.Paid) return 1;
            if (a.invoiceStatus !== InvoiceStatus.Paid && b.invoiceStatus === InvoiceStatus.Paid) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

    return (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
            <p className="mb-6 text-base text-slate-500 dark:text-slate-400">
                請求済みおよび入金済み案件の一覧です。未入金の案件について入金確認を行いステータスを更新します。
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">案件ID</th>
                            <th scope="col" className="px-6 py-3">クライアント</th>
                            <th scope="col" className="px-6 py-3 text-right">金額</th>
                            <th scope="col" className="px-6 py-3">納期</th>
                            <th scope="col" className="px-6 py-3">ステータス</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobsToDisplay.length > 0
                            ? jobsToDisplay.map(job => (
                                <tr key={job.id} className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                                    job.invoiceStatus === InvoiceStatus.Paid ? 'bg-slate-50/50 dark:bg-slate-800/50 opacity-70' : 'bg-white dark:bg-slate-800'
                                }`}>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{job.id}</td>
                                    <td className="px-6 py-4">{job.clientName}</td>
                                    <td className="px-6 py-4 text-right">¥{job.price.toLocaleString()}</td>
                                    <td className="px-6 py-4">{job.dueDate}</td>
                                    <td className="px-6 py-4">
                                        {job.invoiceStatus === InvoiceStatus.Invoiced ? (
                                            <button
                                                onClick={() => onUpdateJobInvoiceStatus(job.id, InvoiceStatus.Paid)}
                                                disabled={isDemoMode}
                                                className="flex items-center gap-1.5 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-semibold py-1 px-3 rounded-full hover:bg-green-200 dark:hover:bg-green-800 text-base transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                                            >
                                                <CheckCircle className="w-4 h-4"/>
                                                入金済みにする
                                            </button>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-semibold text-base px-3">
                                                <CheckCircle className="w-4 h-4"/>
                                                入金済み
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                            : <tr><td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">対象の案件はありません。</td></tr>
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceManagement;