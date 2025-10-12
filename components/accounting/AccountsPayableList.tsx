
import React, { useState } from 'react';
import { AccountsPayable } from '../../types';
import { CreditCard, Loader, DollarSign } from '../Icons';
import { formatDate, formatJPY } from '../../utils';
import EmptyState from '../ui/EmptyState';

interface AccountsPayableListProps {
    accountsPayable: AccountsPayable[];
    onExecutePayment: (payable: AccountsPayable) => Promise<void>;
}

const AccountsPayableList: React.FC<AccountsPayableListProps> = ({ accountsPayable, onExecutePayment }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handlePay = async (payable: AccountsPayable) => {
        setProcessingId(payable.id);
        await onExecutePayment(payable);
        setProcessingId(null); // Parent component will refresh data, this might not be needed
    };

    const unpaid = accountsPayable.filter(p => p.status === 'unpaid').sort((a,b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    const paid = accountsPayable.filter(p => p.status === 'paid').sort((a,b) => new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime());

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ignore time part
        return new Date(dueDate) < today;
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">未払いの請求書 ({unpaid.length}件)</h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">支払先</th>
                                    <th scope="col" className="px-6 py-3">請求日</th>
                                    <th scope="col" className="px-6 py-3">支払期日</th>
                                    <th scope="col" className="px-6 py-3 text-right">金額</th>
                                    <th scope="col" className="px-6 py-3 text-center">アクション</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaid.map(p => (
                                    <tr key={p.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium">{p.supplierName}</td>
                                        <td className="px-6 py-4">{formatDate(p.invoiceDate)}</td>
                                        <td className={`px-6 py-4 font-semibold ${isOverdue(p.dueDate) ? 'text-red-500' : ''}`}>{formatDate(p.dueDate)}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{formatJPY(p.totalAmount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handlePay(p)}
                                                disabled={processingId === p.id}
                                                className="flex items-center justify-center gap-2 w-full max-w-[150px] mx-auto bg-green-600 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400"
                                            >
                                                {processingId === p.id ? <Loader className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                                <span>支払実行</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {unpaid.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState icon={DollarSign} title="未払いの請求書はありません" message="AI受信箱から請求書を計上すると、ここに表示されます。" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">支払い済みの請求書</h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">支払先</th>
                                    <th scope="col" className="px-6 py-3">支払期日</th>
                                    <th scope="col" className="px-6 py-3 text-right">金額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paid.map(p => (
                                    <tr key={p.id} className="border-b dark:border-slate-700">
                                        <td className="px-6 py-4">{p.supplierName}</td>
                                        <td className="px-6 py-4">{formatDate(p.dueDate)}</td>
                                        <td className="px-6 py-4 text-right">{formatJPY(p.totalAmount)}</td>
                                    </tr>
                                ))}
                                {paid.length === 0 && (
                                     <tr>
                                        <td colSpan={3}>
                                            <EmptyState icon={DollarSign} title="支払い済みの請求書はありません" message="支払処理を実行すると、ここに履歴が表示されます。" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountsPayableList;
