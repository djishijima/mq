
import React, { useState } from 'react';
import { submitApplication } from '../../services/dataService';
import { generateWeeklyReportSummary } from '../../services/geminiService';
import ApprovalRouteSelector from './ApprovalRouteSelector';
import { Loader, Sparkles } from '../Icons';
import { User, Toast } from '../../types';
import ChatApplicationModal from '../ChatApplicationModal';

interface WeeklyReportFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
    addToast: (message: string, type: Toast['type']) => void;
}

const WeeklyReportForm: React.FC<WeeklyReportFormProps> = ({ onSuccess, applicationCodeId, currentUser, addToast }) => {
    const [formData, setFormData] = useState({ title: `週報 ${new Date().toLocaleDateString('ja-JP')}`, details: '' });
    const [approvalRouteId, setApprovalRouteId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [error, setError] = useState('');
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleGenerateSummary = async () => {
        if (!formData.details) {
            addToast('AIが下書きを作成するために、報告内容のキーワードを入力してください。', 'info');
            return;
        }
        setIsSummaryLoading(true);
        try {
            const summary = await generateWeeklyReportSummary(formData.details);
            setFormData(prev => ({ ...prev, details: summary }));
            addToast('AIが報告内容の下書きを作成しました。', 'success');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : '不明なエラーが発生しました。';
            addToast(errorMessage, 'error');
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!approvalRouteId) {
            setError('承認ルートは必須です。');
            return;
        }
        if (!currentUser) {
            setError('ユーザー情報が見つかりません。再度ログインしてください。');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await submitApplication({
                applicationCodeId: applicationCodeId,
                formData,
                approvalRouteId
            }, currentUser.id);
            onSuccess();
        } catch (err) {
            setError('週報の提出に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
    const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50";

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">週報作成</h2>
                    <button type="button" onClick={() => setIsChatModalOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors">
                        <Sparkles className="w-5 h-5" />
                        <span>AIチャットで申請</span>
                    </button>
                </div>
                
                <div>
                    <label htmlFor="title" className={labelClass}>件名 *</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className={inputClass} required disabled={isSubmitting} />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="details" className={labelClass}>報告内容 *</label>
                        <button
                            type="button"
                            onClick={handleGenerateSummary}
                            disabled={isSummaryLoading || isSubmitting}
                            className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50"
                        >
                            {isSummaryLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            AIで下書きを作成
                        </button>
                    </div>
                    <textarea id="details" name="details" rows={10} value={formData.details} onChange={handleChange} className={inputClass} required disabled={isSubmitting} placeholder="今週の業務内容、成果、課題、来週の予定などを記述してください。または、キーワードを入力してAIに下書き作成を依頼してください。" />
                </div>
            
                <ApprovalRouteSelector onChange={setApprovalRouteId} isSubmitting={isSubmitting} />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isSubmitting}>下書き保存</button>
                    <button type="submit" className="w-40 flex justify-center items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isSubmitting}>
                        {isSubmitting ? <Loader className="w-5 h-5 animate-spin"/> : '報告を提出する'}
                    </button>
                </div>
            </form>
             {isChatModalOpen && (
                <ChatApplicationModal
                    isOpen={isChatModalOpen}
                    onClose={() => setIsChatModalOpen(false)}
                    onSuccess={() => {
                        setIsChatModalOpen(false);
                        onSuccess();
                    }}
                    currentUser={currentUser}
                    initialMessage="週報を提出したいです。"
                />
            )}
        </>
    );
};

export default WeeklyReportForm;
