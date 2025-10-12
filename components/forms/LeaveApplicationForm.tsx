

import React, { useState, useEffect, useMemo } from 'react';
import { submitApplication, getApprovalRoutes, getUsers } from '../../services/dataService';
import { Loader, Sparkles } from '../Icons';
import { User, ApprovalRoute } from '../../types';
import ChatApplicationModal from '../ChatApplicationModal';

interface LeaveApplicationFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
}

const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({ onSuccess, applicationCodeId, currentUser }) => {
    const [formData, setFormData] = useState({
        leaveType: '有給休暇',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
    });
    const [fixedApprovalRoute, setFixedApprovalRoute] = useState<ApprovalRoute | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isRouteLoading, setIsRouteLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    useEffect(() => {
        const fetchRouteData = async () => {
            setIsRouteLoading(true);
            try {
                const presidentRouteName = '社長決裁ルート';
                const [routes, users] = await Promise.all([getApprovalRoutes(), getUsers()]);
                const route = routes.find(r => r.name === presidentRouteName);

                if (route) {
                    setFixedApprovalRoute(route);
                } else {
                    setError(`固定承認ルート「${presidentRouteName}」が見つかりません。管理者に連絡してください。`);
                }
                setAllUsers(users);
            } catch (err) {
                setError('承認ルート情報の読み込みに失敗しました。');
                console.error(err);
            } finally {
                setIsRouteLoading(false);
            }
        };

        fetchRouteData();
    }, []);

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!fixedApprovalRoute) {
            setError('承認ルートが設定されていません。');
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
                approvalRouteId: fixedApprovalRoute.id
            }, currentUser.id);
            onSuccess();
        } catch (err) {
            setError('申請の提出に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
    const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50";

    const usersById = useMemo(() => new Map(allUsers.map(u => [u.id, u.name])), [allUsers]);
    const approverNames = fixedApprovalRoute?.route_data.steps.map(step => usersById.get(step.approver_id) || '不明').join(' → ');

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">休暇申請フォーム</h2>
                    <button type="button" onClick={() => setIsChatModalOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors">
                        <Sparkles className="w-5 h-5" />
                        <span>AIチャットで申請</span>
                    </button>
                </div>
                
                <div>
                    <label htmlFor="leaveType" className={labelClass}>休暇の種類 *</label>
                    <select id="leaveType" name="leaveType" value={formData.leaveType} onChange={handleChange} className={inputClass} required disabled={isSubmitting}>
                        <option>有給休暇</option>
                        <option>午前半休</option>
                        <option>午後半休</option>
                        <option>欠勤</option>
                        <option>その他</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="startDate" className={labelClass}>開始日 *</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} required disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="endDate" className={labelClass}>終了日 *</label>
                        <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass} required disabled={isSubmitting} />
                    </div>
                </div>

                <div>
                    <label htmlFor="reason" className={labelClass}>理由 *</label>
                    <textarea id="reason" name="reason" rows={4} value={formData.reason} onChange={handleChange} className={inputClass} required disabled={isSubmitting} placeholder="例: 私用のため" />
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">承認ルート</label>
                    {isRouteLoading ? (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>読み込み中...</span>
                        </div>
                    ) : approverNames ? (
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                            {approverNames}
                        </div>
                    ) : (
                        <div className="text-red-500 text-sm">承認ルートを表示できませんでした。</div>
                    )}
                </div>


                {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
                
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isSubmitting}>下書き保存</button>
                    <button type="submit" className="w-40 flex justify-center items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isSubmitting || isRouteLoading}>
                        {isSubmitting ? <Loader className="w-5 h-5 animate-spin"/> : '申請を送信する'}
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
                    initialMessage="休暇を申請したいです。"
                />
            )}
        </>
    );
};

export default LeaveApplicationForm;