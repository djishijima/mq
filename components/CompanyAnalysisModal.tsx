import React from 'react';
import { CompanyAnalysis, Customer, EmployeeUser } from '../types';
import { X, Loader, AlertTriangle, Lightbulb, Mail } from './Icons';

interface CompanyAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: CompanyAnalysis | null;
    customer: Customer | null;
    isLoading: boolean;
    error: string;
    currentUser: EmployeeUser | null;
}

const AnalysisSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-300 dark:border-slate-600 pb-2">{title}</h3>
        <div className="text-base text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed prose prose-slate dark:prose-invert max-w-none">{children}</div>
    </div>
);

const CompanyAnalysisModal: React.FC<CompanyAnalysisModalProps> = ({ isOpen, onClose, analysis, customer, isLoading, error, currentUser }) => {
    if (!isOpen) return null;

    const handleCreateEmail = () => {
        if (!analysis || !analysis.proposalEmail || !customer || !currentUser) return;
        const { subject, body } = analysis.proposalEmail;
        const finalBody = body.replace(/\[あなたの名前\]/g, currentUser.name);
        const mailto = `mailto:${customer.customerContactInfo || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
        window.open(mailto, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Lightbulb className="w-7 h-7 text-blue-500" />
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI企業分析</h2>
                             <p className="text-sm text-slate-500 dark:text-slate-400">{customer?.customerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-6">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                            <p className="mt-4 text-slate-500 dark:text-slate-400">AIが企業情報を分析中...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                             <AlertTriangle className="w-12 h-12 text-red-500" />
                            <p className="mt-4 font-semibold text-red-700 dark:text-red-300">分析エラー</p>
                            <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    {analysis && !isLoading && (
                        <>
                            <AnalysisSection title="SWOT分析">
                                {analysis.swot}
                            </AnalysisSection>
                             <AnalysisSection title="課題と潜在的ニーズ">
                                {analysis.painPointsAndNeeds}
                            </AnalysisSection>
                             <AnalysisSection title="提案アクション">
                                {analysis.suggestedActions}
                            </AnalysisSection>
                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">AI提案メール</h3>
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2 border border-slate-200 dark:border-slate-700">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{analysis.proposalEmail.subject}</p>
                                    <p className="text-base text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{analysis.proposalEmail.body.replace(/\[あなたの名前\]/g, currentUser?.name || '担当者名')}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                     <button
                        onClick={handleCreateEmail}
                        disabled={!analysis || isLoading}
                        className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold py-2 px-4 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 disabled:opacity-50"
                    >
                        <Mail className="w-4 h-4" />
                        この内容でメールを作成
                    </button>
                    <button onClick={onClose} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanyAnalysisModal;