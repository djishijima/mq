

import React, { useState, useMemo, useEffect } from 'react';
import { submitApplication } from '../../services/dataService';
import { extractInvoiceDetails } from '../../services/geminiService';
import ApprovalRouteSelector from './ApprovalRouteSelector';
import { Loader, Upload, PlusCircle, Trash2 } from '../Icons';
import { User, InvoiceData } from '../../types';

interface TransportExpenseFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
}

interface TransportDetail {
    id: string;
    travelDate: string;
    departure: string;
    arrival: string;
    transportMode: string;
    amount: number;
}

const TRANSPORT_MODES = ['電車', 'バス', 'タクシー', '飛行機', 'その他'];

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject("Read failed");
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const TransportExpenseForm: React.FC<TransportExpenseFormProps> = ({ onSuccess, applicationCodeId, currentUser }) => {
    const [details, setDetails] = useState<TransportDetail[]>([]);
    const [notes, setNotes] = useState('');
    const [approvalRouteId, setApprovalRouteId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (details.length === 0) addNewRow();
    }, []);

    const totalAmount = useMemo(() => details.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [details]);

    const addNewRow = () => {
        setDetails(prev => [...prev, {
            id: `row_${Date.now()}`,
            travelDate: new Date().toISOString().split('T')[0],
            departure: '',
            arrival: '',
            transportMode: TRANSPORT_MODES[0],
            amount: 0,
        }]);
    };

    const handleDetailChange = (id: string, field: keyof TransportDetail, value: string | number) => {
        setDetails(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveRow = (id: string) => setDetails(prev => prev.filter(item => item.id !== id));
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOcrLoading(true);
        setError('');
        try {
            const base64String = await readFileAsBase64(file);
            const ocrData: InvoiceData = await extractInvoiceDetails(base64String, file.type);
            
            // Heuristic to parse departure/arrival from description
            const description = ocrData.description || '';
            const parts = description.split(/から|→|～/);
            const departure = parts[0]?.trim() || '';
            const arrival = parts[1]?.trim() || '';

            setDetails(prev => [...prev.filter(d => d.departure || d.arrival), {
                id: `row_ocr_${Date.now()}`,
                travelDate: ocrData.invoiceDate || new Date().toISOString().split('T')[0],
                departure,
                arrival,
                transportMode: TRANSPORT_MODES[0],
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
        if (!approvalRouteId) return setError('承認ルートを選択してください。');
        if (!currentUser) return setError('ユーザー情報が見つかりません。');
        if (details.length === 0 || details.every(d => !d.departure && !d.arrival)) {
            return setError('少なくとも1つの明細を入力してください。');
        }

        setIsSubmitting(true);
        setError('');
        try {
            const submissionData = {
                details: details.filter(d => d.departure || d.arrival),
                notes: notes,
                totalAmount: totalAmount,
            };
            await submitApplication({ applicationCodeId, formData: submissionData, approvalRouteId }, currentUser.id);
            onSuccess();
        } catch (err) {
            setError('申請の提出に失敗しました。');
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center">交通費申請フォーム</h2>
            
            <details className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700" open>
                <summary className="text-base font-semibold cursor-pointer text-slate-700 dark:text-slate-200">明細書 (AI-OCR)</summary>
                 <div className="mt-4 flex items-center gap-4">
                    <label htmlFor="ocr-file-upload" className={`relative inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer ${isOcrLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isOcrLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <span>{isOcrLoading ? '解析中...' : 'ファイルから読み取り'}</span>
                        <input id="ocr-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isOcrLoading} />
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">交通費の領収書を選択すると、下の表に自動で追加されます。</p>
                </div>
            </details>

            <div>
                <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">交通費明細 *</label>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {['利用日', '出発地', '目的地', '交通手段', '金額(円)'].map(h => <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>)}
                                <th className="p-2 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {details.map((item) => (
                                <tr key={item.id}>
                                    <td className="p-1"><input type="date" value={item.travelDate} onChange={e => handleDetailChange(item.id, 'travelDate', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[150px]"><input type="text" placeholder="例: 東京駅" value={item.departure} onChange={e => handleDetailChange(item.id, 'departure', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[150px]"><input type="text" placeholder="例: 幕張メッセ" value={item.arrival} onChange={e => handleDetailChange(item.id, 'arrival', e.target.value)} className={inputClass} /></td>
                                    <td className="p-1 min-w-[120px]">
                                        <select value={item.transportMode} onChange={e => handleDetailChange(item.id, 'transportMode', e.target.value)} className={inputClass}>
                                            {TRANSPORT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                        </select>
                                    </td>
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

export default TransportExpenseForm;
