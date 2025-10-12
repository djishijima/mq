

import React, { useState, useEffect, useMemo } from 'react';
import { submitApplication } from '../../services/dataService';
import { extractInvoiceDetails } from '../../services/geminiService';
import ApprovalRouteSelector from './ApprovalRouteSelector';
import { Loader, Upload, PlusCircle, Trash2 } from '../Icons';
import { User, InvoiceData } from '../../types';

interface ExpenseReimbursementFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
}

interface ExpenseDetail {
    id: string;
    paymentDate: string;
    account: string;
    payee: string;
    description: string;
    relatedCustomer: string;
    project: string;
    amount: number;
}

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("ファイル読み取りに失敗しました。"));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


const ExpenseReimbursementForm: React.FC<ExpenseReimbursementFormProps> = ({ onSuccess, applicationCodeId, currentUser }) => {
    const [details, setDetails] = useState<ExpenseDetail[]>([]);
    const [notes, setNotes] = useState('');
    const [approvalRouteId, setApprovalRouteId] = useState<string>('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (details.length === 0) {
            addNewRow();
        }
    }, []);

    const totalAmount = useMemo(() => {
        return details.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [details]);

    const addNewRow = () => {
        setDetails(prev => [...prev, {
            id: `row_${Date.now()}`,
            paymentDate: new Date().toISOString().split('T')[0],
            account: '',
            payee: '',
            description: '',
            relatedCustomer: '',
            project: '',
            amount: 0,
        }]);
    };

    const handleDetailChange = (id: string, field: keyof ExpenseDetail, value: string | number) => {
        setDetails(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveRow = (id: string) => {
        setDetails(prev => prev.filter(item => item.id !== id));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOcrLoading(true);
        setError('');
        try {
            const base64String = await readFileAsBase64(file);
            const ocrData: InvoiceData = await extractInvoiceDetails(base64String, file.type);
            
            setDetails(prev => [...prev.filter(d => d.description || d.amount > 0), { // remove empty rows before adding
                id: `row_ocr_${Date.now()}`,
                paymentDate: ocrData.invoiceDate || new Date().toISOString().split('T')[0],
                account: ocrData.account || '',
                payee: ocrData.vendorName || '',
                description: ocrData.description || '',
                relatedCustomer: ocrData.relatedCustomer || '',
                project: ocrData.project || '',
                amount: ocrData.totalAmount || 0,
            }]);
        } catch (err: any) {
            setError(err.message || 'AI-OCR処理中にエラーが発生しました。');
        } finally {
            setIsOcrLoading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!approvalRouteId) {
            setError('承認ルートを選択してください。');
            return;
        }
        if (!currentUser) {
            setError('ユーザー情報が見つかりません。');
            return;
        }
        if (details.length === 0 || details.every(d => !d.description)) {
            setError('少なくとも1つの明細を入力してください。');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const submissionData = {
                details: details.filter(d => d.description || d.amount > 0),
                notes: notes,
                totalAmount: totalAmount,
            };

            await submitApplication({
                applicationCodeId: applicationCodeId,
                formData: submissionData,
                approvalRouteId: approvalRouteId
            }, currentUser.id);
            onSuccess();
        } catch (err) {
            console.error('Submission failed:', err);
            setError('申請の提出に失敗しました。データベース接続を確認してください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearForm = () => {
        setDetails([]);
        setNotes('');
        setError('');
        addNewRow();
    };

    const inputClass = "w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500";
    
    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm space-y-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center">経費精算申請フォーム</h2>
            
            <details className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700" open>
                <summary className="text-base font-semibold cursor-pointer text-slate-700 dark:text-slate-200">領収書 (AI-OCR)</summary>
                <div className="mt-4 flex items-center gap-4">
                    <label htmlFor="ocr-file-upload" className={`relative inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer ${isOcrLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isOcrLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <span>{isOcrLoading ? '解析中...' : 'ファイルから読み取り'}</span>
                        <input id="ocr-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isOcrLoading} />
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">領収書の画像・PDFを選択すると、下の表に自動で追加されます。</p>
                </div>
            </details>

            <div>
                <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">経費明細 *</label>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {['支払日', '勘定科目', '支払先', '内容', '関連顧客', 'プロジェクト', '金額(円)'].map(h => <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>)}
                                <th className="p-2 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {details.map((item) => (
                                <tr key={item.id}>
                                    <td className="p-1"><input type="date" value={item.paymentDate} onChange={e => handleDetailChange(item.id, 'paymentDate', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[150px]"><input type="text" placeholder="例: 会議費" value={item.account} onChange={e => handleDetailChange(item.id, 'account', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[150px]"><input type="text" placeholder="例: ABC社" value={item.payee} onChange={e => handleDetailChange(item.id, 'payee', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[200px]"><input type="text" value={item.description} onChange={e => handleDetailChange(item.id, 'description', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[150px]"><input type="text" placeholder="検索または新規入力" value={item.relatedCustomer} onChange={e => handleDetailChange(item.id, 'relatedCustomer', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[150px]"><input type="text" value={item.project} onChange={e => handleDetailChange(item.id, 'project', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[120px]"><input type="number" value={item.amount} onChange={e => handleDetailChange(item.id, 'amount', Number(e.target.value))} className={`${inputClass} text-right`} /></td>
                                    <td className="text-center p-1">
                                        <button type="button" onClick={() => handleRemoveRow(item.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <button type="button" onClick={addNewRow} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        <PlusCircle className="w-4 h-4" /> 行を追加
                    </button>
                    <div className="text-right">
                        <span className="text-sm text-slate-500 dark:text-slate-400">合計金額: </span>
                        <span className="text-xl font-bold text-slate-800 dark:text-white">¥{totalAmount.toLocaleString()}</span>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">※Excelから範囲選択でコピーし、表内で貼り付けると複数行を追加できます。</p>
            </div>

            <div>
                <label htmlFor="notes" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">備考</label>
                <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="補足事項があれば入力してください。" />
            </div>
            
            <ApprovalRouteSelector onChange={setApprovalRouteId} isSubmitting={isSubmitting} />

            {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
            
            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={clearForm} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isSubmitting}>内容をクリア</button>
                <button type="button" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isSubmitting}>下書き保存</button>
                <button type="submit" className="w-40 flex justify-center items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin"/> : '申請を送信する'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseReimbursementForm;
