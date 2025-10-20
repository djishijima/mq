import React from 'react';
import { CompanyAnalysis } from '../types';
import { X, Loader, AlertTriangle, Lightbulb } from './Icons';

interface CompanyAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: CompanyAnalysis | null;
    customerName: string;
    isLoading: boolean;
    error: string;
}

const AnalysisSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-300 dark:border-slate-600 pb-2">{title}</h3>
        <div className="text-base text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{children}</div>
    </div>
);

const CompanyAnalysisModal: React.FC<CompanyAnalysisModalProps> = ({ isOpen, onClose, analysis, customerName, isLoading, error }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Lightbulb className="w-7 h-7 text-blue-500" />
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI企業分析</h2>
                             <p className="text-sm text-slate-500 dark:text-slate-400">{customerName}</p>
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
                             <AnalysisSection title="想定される課題（ペインポイント）">
                                {analysis.painPoints}
                            </AnalysisSection>
                             <AnalysisSection title="潜在的な印刷ニーズ">
                                {analysis.potentialNeeds}
                            </AnalysisSection>
                             <AnalysisSection title="営業戦略の提案">
                                {analysis.salesStrategy}
                            </AnalysisSection>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanyAnalysisModal;