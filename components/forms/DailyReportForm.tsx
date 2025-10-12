
import React, { useState } from 'react';
import { submitApplication } from '../../services/dataService';
import ApprovalRouteSelector from './ApprovalRouteSelector';
import { Loader, Sparkles } from '../Icons';
import { User } from '../../types';
import ChatApplicationModal from '../ChatApplicationModal';

interface DailyReportFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
}

interface DailyReportData {
    reportDate: string;
    startTime: string;
    endTime: string;
    customerName: string;
    activityContent: string;
    nextDayPlan: string;
}

const DailyReportForm: React.FC<DailyReportFormProps> = ({ onSuccess, applicationCodeId, currentUser }) => {
    const [formData, setFormData] = useState<DailyReportData>({
        reportDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '18:00',
        customerName: '',
        activityContent: '',
        nextDayPlan: '',
    });
    const [approvalRouteId, setApprovalRouteId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            setError('日報の提出に失敗しました。');
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
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">日報作成</h2>
                    <button type="button" onClick={() => setIsChatModalOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors">
                        <Sparkles className="w-5 h-5" />
                        <span>AIチャットで申請</span>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="reportDate" className={labelClass}>報告日 *</label>
                        <input type="date" id="reportDate" name="reportDate" value={formData.reportDate} onChange={handleChange} className={inputClass} required disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="startTime" className={labelClass}>業務開始</label>
                        <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} className={inputClass} disabled={isSubmitting} />
                    </div>
                     <div>
                        <label htmlFor="endTime" className={labelClass}>業務終了</label>
                        <input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleChange} className={inputClass} disabled={isSubmitting} />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="customerName" className={labelClass}>訪問先・顧客名</label>
                    <input type="text" id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} className={inputClass} disabled={isSubmitting} placeholder="例: 株式会社〇〇" />
                </div>


                <div>
                    <label htmlFor="activityContent" className={labelClass}>活動内容 *</label>
                    <textarea id="activityContent" name="activityContent" rows={8} value={formData.activityContent} onChange={handleChange} className={inputClass} required disabled={isSubmitting} placeholder="本日の業務内容、進捗、課題などを具体的に記述してください。" />
                </div>
                
                <div>
                    <label htmlFor="nextDayPlan" className={labelClass}>翌日予定</label>
                    <textarea id="nextDayPlan" name="nextDayPlan" rows={3} value={formData.nextDayPlan} onChange={handleChange} className={inputClass} disabled={isSubmitting} placeholder="明日のタスクやアポイントなどを記述してください。" />
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
                    initialMessage="日報を提出したいです。"
                />
            )}
        </>
    );
};

export default DailyReportForm;
