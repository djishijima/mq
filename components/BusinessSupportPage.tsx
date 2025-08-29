import React, { useState } from 'react';
import ExpenseReimbursementForm from './forms/ExpenseReimbursementForm';
import TransportExpenseForm from './forms/TransportExpenseForm';
import LeaveApplicationForm from './forms/LeaveApplicationForm';
import ApprovalForm from './forms/ApprovalForm';
import DailyReportForm from './forms/DailyReportForm';

type FormType = 'expense' | 'transport' | 'leave' | 'approval' | 'daily_report' | 'weekly_report';

const NAV_ITEMS: { id: FormType; label: string }[] = [
    { id: 'expense', label: '経費精算' },
    { id: 'transport', label: '交通費申請' },
    { id: 'leave', label: '休暇申請' },
    { id: 'approval', label: '金額なし決裁' },
    { id: 'daily_report', label: '日報' },
    { id: 'weekly_report', label: '週報' },
];

interface BusinessSupportPageProps {
    isDemoMode: boolean;
}

const BusinessSupportPage: React.FC<BusinessSupportPageProps> = ({ isDemoMode }) => {
    const [activeForm, setActiveForm] = useState<FormType>('daily_report');

    const renderForm = () => {
        switch (activeForm) {
            case 'expense':
                return <ExpenseReimbursementForm isDemoMode={isDemoMode} />;
            case 'transport':
                return <TransportExpenseForm isDemoMode={isDemoMode} />;
            case 'leave':
                return <LeaveApplicationForm isDemoMode={isDemoMode} />;
            case 'approval':
                return <ApprovalForm isDemoMode={isDemoMode} />;
            case 'daily_report':
                return <DailyReportForm isDemoMode={isDemoMode} />;
            case 'weekly_report':
                return (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center">
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">準備中です</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">この機能は現在開発中です。</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex gap-8 items-start">
            <aside className="w-56 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 sticky top-8">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white px-3 pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">各種申請</h2>
                <nav className="space-y-1">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveForm(item.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors text-sm font-medium ${
                                activeForm === item.id
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <div className="flex-1">
                {renderForm()}
            </div>
        </div>
    );
};

export default BusinessSupportPage;
