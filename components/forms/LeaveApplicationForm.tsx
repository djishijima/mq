import React, { useState } from 'react';
import { submitApplication } from '../../services/dataService';
import ApprovalRoute from './ApprovalRoute';
import { Loader } from '../Icons';

interface LeaveApplicationFormProps {
    isDemoMode: boolean;
}

const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({ isDemoMode }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = {};
        const approvalRoute = {};

        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            await submitApplication({
                applicationCodeId: 'LEV',
                formData,
                approvalRoute
            });
            setSuccess('休暇申請を提出しました。');
        } catch (err) {
            setError('申請の提出に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">休暇申請フォーム</h2>
            
             <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">休暇申請のフォーム項目はここに表示されます。</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">（UIデモのため、入力フィールドは省略されています）</p>
            </div>
            
            <ApprovalRoute onChange={() => {}} isSubmitting={isSubmitting} />

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}

            <div className="flex justify-end gap-4">
                <button type="button" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isSubmitting}>下書き保存</button>
                <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isSubmitting || isDemoMode}>
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin"/> : '申請を送信する'}
                </button>
            </div>
        </form>
    );
};

export default LeaveApplicationForm;
