import React, { useState, useEffect, useMemo } from 'react';
import ExpenseReimbursementForm from '../forms/ExpenseReimbursementForm';
import TransportExpenseForm from '../forms/TransportExpenseForm';
import LeaveApplicationForm from '../forms/LeaveApplicationForm';
import ApprovalForm from '../forms/ApprovalForm';
import DailyReportForm from '../forms/DailyReportForm';
import ApplicationList from '../ApplicationList';
// FIX: Import getApplicationCodes and ApplicationCode type.
import { getApplications, getApplicationCodes } from '../../services/dataService';
// FIX: Import User type.
import { ApplicationWithDetails, ApplicationCode, User } from '../../types';
import { Loader, PlusCircle } from '../Icons';

type FormType = 'expense' | 'transport' | 'leave' | 'approval' | 'daily_report' | 'weekly_report';

const NAV_ITEMS: { id: FormType; label: string; code: string }[] = [
    { id: 'expense', label: '経費精算', code: 'EXP' },
    { id: 'transport', label: '交通費申請', code: 'TRP' },
    { id: 'leave', label: '休暇申請', code: 'LEV' },
    { id: 'approval', label: '金額なし決裁', code: 'APL' },
    { id: 'daily_report', label: '日報', code: 'DLY' },
    { id: 'weekly_report', label: '週報', code: 'WKR' }, // Assuming a code for weekly report
];

// FIX: Add currentUser prop.
interface ApprovalWorkflowPageProps {
    currentUser: User | null;
}

const ApprovalWorkflowPage: React.FC<ApprovalWorkflowPageProps> = ({ currentUser }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [activeCategory, setActiveCategory] = useState(NAV_ITEMS[0]);
    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    // FIX: Add state for application codes.
    const [applicationCodes, setApplicationCodes] = useState<ApplicationCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // FIX: Add state for selected application to pass to ApplicationList.
    const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);

    const fetchApplications = async () => {
        try {
            setIsLoading(true);
            // FIX: Fetch applications and application codes concurrently.
            const [apps, codes] = await Promise.all([getApplications(), getApplicationCodes()]);
            setApplications(apps);
            setApplicationCodes(codes);
        } catch (err: any) {
            setError(err.message || '申請データの読み込みに失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const filteredApplications = useMemo(() => {
        if (!applications) return [];
        return applications.filter(app => app.application_codes?.code === activeCategory.code);
    }, [applications, activeCategory]);

    const handleFormSuccess = () => {
        setView('list');
        fetchApplications(); // Refresh list after submission
    };
    
    const handleSelectCategory = (category: typeof NAV_ITEMS[0]) => {
        setActiveCategory(category);
        setView('list'); // Always return to list view when changing category
    };

    const renderForm = () => {
        // FIX: Find the active application code to get its ID.
        const activeApplicationCode = applicationCodes.find(code => code.code === activeCategory.code);

        if (!activeApplicationCode) {
            return (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center">
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-300">設定エラー</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">申請コード「{activeCategory.code}」が見つかりません。</p>
                </div>
            );
        }
        
        // FIX: Create formProps with the required applicationCodeId.
        // FIX: Pass currentUser to form components.
        const formProps = { 
            onSuccess: handleFormSuccess, 
            applicationCodeId: activeApplicationCode.id,
            currentUser,
        };
        switch (activeCategory.id) {
            case 'expense': return <ExpenseReimbursementForm {...formProps} />;
            case 'transport': return <TransportExpenseForm {...formProps} />;
            case 'leave': return <LeaveApplicationForm {...formProps} />;
            case 'approval': return <ApprovalForm {...formProps} />;
            case 'daily_report': return <DailyReportForm {...formProps} />;
            case 'weekly_report':
                return (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center">
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">準備中です</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">この機能は現在開発中です。</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex gap-8 items-start">
            <aside className="w-56 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 sticky top-8">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white px-3 pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">申請種別</h2>
                <nav className="space-y-1">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleSelectCategory(item)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors text-sm font-medium ${
                                activeCategory.id === item.id
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
                {view === 'list' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{activeCategory.label} 一覧</h2>
                             <button
                                onClick={() => setView('form')}
                                className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                             >
                                <PlusCircle className="w-5 h-5" />
                                <span>新規申請</span>
                             </button>
                        </div>
                        {isLoading ? (
                             <div className="text-center py-10">
                                <Loader className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                                <p className="mt-2 text-slate-500 dark:text-slate-400">一覧を読み込んでいます...</p>
                            </div>
                        ) : error ? (
                             <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-red-700 dark:text-red-300">
                                <strong>エラー:</strong> {error}
                            </div>
                        ) : (
                            // FIX: Pass required props to ApplicationList.
                            <ApplicationList 
                                applications={filteredApplications} 
                                onApplicationSelect={setSelectedApplication}
                                selectedApplicationId={selectedApplication?.id || null}
                            />
                        )}
                    </div>
                ) : (
                    renderForm()
                )}
            </div>
        </div>
    );
};

export default React.memo(ApprovalWorkflowPage);
