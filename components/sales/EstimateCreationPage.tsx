

import React, { useState, useMemo, useRef } from 'react';
import { Customer, Estimate, EstimateItem, Job, JobStatus, InvoiceStatus, Page, Toast } from '../../types';
import { draftEstimate } from '../../services/geminiService';
import { Loader, Sparkles, PlusCircle, Trash2, FileText, Send } from '../Icons';

declare const jspdf: any;
declare const html2canvas: any;

interface EstimateCreationPageProps {
  customers: Customer[];
  onAddJob: (job: Omit<Job, 'id' | 'createdAt'>) => Promise<void>;
  onNavigate: (page: Page) => void;
  addToast: (message: string, type: Toast['type']) => void;
}

const JPY = (n: number | undefined) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(Math.round(n || 0));

const initialEstimateState: Partial<Estimate> = {
    items: [],
    total: 0,
    deliveryDate: new Date().toISOString().split('T')[0],
    paymentTerms: '月末締め、翌月末払い',
    title: '',
    customerName: '',
    deliveryMethod: '',
    notes: '',
};


const EstimateCreationPage: React.FC<EstimateCreationPageProps> = ({ customers, onAddJob, onNavigate, addToast }) => {
    const [estimate, setEstimate] = useState<Partial<Estimate>>(initialEstimateState);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const pdfPrintRef = useRef<HTMLDivElement>(null);

    const total = useMemo(() => {
        return estimate.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
    }, [estimate.items]);
    const totalCost = useMemo(() => {
        return estimate.items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
    }, [estimate.items]);

    const resetForm = () => {
        setEstimate(initialEstimateState);
        setSelectedCustomer(null);
        setAiPrompt('');
        setError('');
        const customerSelect = document.getElementById('customer-select') as HTMLSelectElement;
        if (customerSelect) {
            customerSelect.value = "";
        }
    };

    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customer = customers.find(c => c.id === e.target.value) || null;
        setSelectedCustomer(customer);
        setEstimate(prev => ({ ...prev, customerName: customer?.customerName || '' }));
    };
    
    const handleAiDraft = async () => {
        if (!aiPrompt) return;
        setIsAiLoading(true);
        setError('');
        try {
            const draft = await draftEstimate(aiPrompt);
            setEstimate(prev => ({
                ...prev,
                title: draft.title,
                items: draft.items,
                notes: draft.notes,
                total: draft.total,
            }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'AIによる下書き作成に失敗しました。');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleItemChange = (index: number, field: keyof EstimateItem, value: any) => {
        const newItems = [...(estimate.items || [])];
        const item = { ...newItems[index] };
        (item[field] as any) = value;

        if (field === 'quantity' || field === 'unitPrice') {
            item.price = (item.quantity || 0) * (item.unitPrice || 0);
        }
        if (field === 'price' || field === 'cost') {
            item.costRate = item.price > 0 ? (item.cost || 0) / item.price : 0;
        }
        item.subtotal = item.price;

        newItems[index] = item;
        setEstimate(prev => ({ ...prev, items: newItems }));
    };
    
    const addItem = () => {
        const newItem: EstimateItem = {
            division: 'その他', content: '', quantity: 1, unit: '式', unitPrice: 0, price: 0, cost: 0, costRate: 0, subtotal: 0,
        };
        setEstimate(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };

    const removeItem = (index: number) => {
        setEstimate(prev => ({ ...prev, items: (prev.items || []).filter((_, i) => i !== index) }));
    };
    
    const handleGeneratePdf = async () => {
        if (!pdfPrintRef.current || !selectedCustomer) {
            addToast("顧客を選択してください。", 'error');
            return;
        }
        setIsPdfLoading(true);
        try {
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const element = pdfPrintRef.current;
            const canvas = await html2canvas(element, { 
                scale: 3, 
                useCORS: true, 
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`見積書_${selectedCustomer?.customerName}_${estimate.title || '無題'}.pdf`);
        } catch (e) {
            console.error(e);
            addToast("PDFの生成に失敗しました。", 'error');
        } finally {
            setIsPdfLoading(false);
        }
    };
    
    const handleCreateOrder = async () => {
        if (!selectedCustomer || !estimate.title || !estimate.items?.length) {
            addToast('顧客、件名、明細は必須です。', 'error');
            return;
        }
        setIsSubmitting(true);
        const jobDetails = estimate.items?.map(item => `${item.content} (数量: ${item.quantity} ${item.unit})`).join('\n') || '';

        const newJob: Omit<Job, 'id' | 'createdAt'> = {
            clientName: selectedCustomer!.customerName,
            title: estimate.title || '無題の案件',
            status: JobStatus.Pending,
            dueDate: estimate.deliveryDate || new Date().toISOString().split('T')[0],
            quantity: 1,
            paperType: '見積参照',
            finishing: '見積参照',
            details: jobDetails,
            price: total,
            variableCost: totalCost,
            invoiceStatus: InvoiceStatus.Uninvoiced,
            readyToInvoice: true,
        };
        try {
            await onAddJob(newJob);
            addToast('受注登録が完了しました。案件・受注管理ページに移動します。', 'success');
            resetForm();
            onNavigate('sales_orders');
        } catch (e) {
            addToast('受注登録に失敗しました。', 'error');
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEstimate(prev => ({ ...prev, [name]: value }));
    };

    const inputClass = "w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 text-base";
    const tableInputClass = "w-full bg-transparent p-2 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none rounded-md";

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
            <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                <div ref={pdfPrintRef} style={{ width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', color: 'black', fontFamily: "'Noto Sans JP', sans-serif" }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10mm' }}>御 見 積 書</h1>
                    <p style={{ textAlign: 'right', marginBottom: '5mm' }}>発行日: {new Date().toLocaleDateString('ja-JP')}</p>
                    <p style={{ fontSize: '16px', borderBottom: '1px solid black', paddingBottom: '2mm', marginBottom: '5mm' }}>{selectedCustomer?.customerName || ''} 御中</p>
                    <div style={{ textAlign: 'right', fontSize: '10px' }}>
                        <p style={{fontWeight: 'bold'}}>株式会社MQ会計</p>
                        <p>〒100-0001 東京都千代田区千代田1-1</p>
                        <p>TEL: 03-1234-5678 / FAX: 03-1234-5679</p>
                    </div>
                    <div style={{ background: '#f0f0f0', padding: '5mm', marginTop: '10mm' }}>
                        <p>件名: {estimate.title || ''}</p>
                        <p style={{ borderTop: '1px solid #ccc', paddingTop: '5mm', marginTop: '5mm' }}>合計金額: <span style={{fontSize: '18px', fontWeight: 'bold'}}>{JPY(total)} (税込)</span></p>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10mm', fontSize: '10px' }}>
                        <thead style={{ background: '#f0f0f0' }}>
                            <tr>
                                {['内容', '数量', '単位', '単価', '金額'].map(h => 
                                    <th key={h} style={{ border: '1px solid #ccc', padding: '2mm', textAlign: 'center' }}>{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {estimate.items?.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #ccc', padding: '2mm' }}>{item.content}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '2mm', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '2mm', textAlign: 'center' }}>{item.unit}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '2mm', textAlign: 'right' }}>{JPY(item.unitPrice)}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '2mm', textAlign: 'right' }}>{JPY(item.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     <div style={{ marginTop: '10mm', fontSize: '10px' }}>
                        <p><strong>納期:</strong> {estimate.deliveryDate ? new Date(estimate.deliveryDate).toLocaleDateString('ja-JP') : ''}</p>
                        <p><strong>納品方法:</strong> {estimate.deliveryMethod || ''}</p>
                        <p><strong>支払条件:</strong> {estimate.paymentTerms || ''}</p>
                        <p><strong>備考:</strong></p>
                        <p style={{whiteSpace: 'pre-wrap'}}>{estimate.notes || ''}</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg border border-blue-200 dark:border-slate-700">
                <label className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 block">AI下書き作成</label>
                <div className="flex gap-2">
                    <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="例：A4チラシ、コート90kg、両面カラー、1000枚の見積もり" className={inputClass} />
                    <button onClick={handleAiDraft} disabled={isAiLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                        {isAiLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        AIで生成
                    </button>
                </div>
                 {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">顧客名 *</label>
                    <select id="customer-select" onChange={handleCustomerChange} value={selectedCustomer?.id || ''} className={inputClass}>
                        <option value="" disabled>顧客を選択してください</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">件名 *</label>
                    <input type="text" name="title" value={estimate.title || ''} onChange={handleInputChange} className={inputClass} />
                </div>
            </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium mb-1">納期</label><input type="date" name="deliveryDate" value={estimate.deliveryDate || ''} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium mb-1">納品方法</label><input type="text" name="deliveryMethod" value={estimate.deliveryMethod || ''} onChange={handleInputChange} placeholder="例: 分納" className={inputClass} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">支払条件</label><input type="text" name="paymentTerms" value={estimate.paymentTerms || ''} onChange={handleInputChange} className={inputClass} /></div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-base font-semibold">明細</label>
                    <button onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        <PlusCircle className="w-4 h-4" /> 行を追加
                    </button>
                </div>
                 <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {['区分', '内容', '数量', '単位', '単価', '原価', '金額'].map(h => <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">{h}</th>)}
                                <th className="w-12 p-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {estimate.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-1"><input value={item.division} onChange={e => handleItemChange(index, 'division', e.target.value)} className={tableInputClass} /></td>
                                    <td className="p-1 min-w-[200px]"><input value={item.content} onChange={e => handleItemChange(index, 'content', e.target.value)} className={tableInputClass} /></td>
                                    <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className={`${tableInputClass} w-20`} /></td>
                                    <td className="p-1"><input value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} className={`${tableInputClass} w-20`} /></td>
                                    <td className="p-1"><input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} className={`${tableInputClass} w-24`} /></td>
                                    <td className="p-1"><input type="number" value={item.cost} onChange={e => handleItemChange(index, 'cost', Number(e.target.value))} className={`${tableInputClass} w-24`} /></td>
                                    <td className="p-1"><input readOnly value={JPY(item.price)} className={`${tableInputClass} w-28 text-slate-500 dark:text-slate-400`} /></td>
                                    <td className="text-center p-1"><button onClick={() => removeItem(index)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">備考</label>
                    <textarea name="notes" value={estimate.notes || ''} onChange={handleInputChange} rows={4} className={inputClass} />
                </div>
                <div className="space-y-2 text-lg text-right">
                    <div className="flex justify-between font-bold">
                        <span>合計金額 (P)</span>
                        <span>{JPY(total)}</span>
                    </div>
                    <div className="flex justify-between text-base text-slate-500">
                        <span>合計原価 (V)</span>
                        <span>{JPY(totalCost)}</span>
                    </div>
                     <div className="flex justify-between font-bold text-blue-600 dark:text-blue-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>限界利益 (M)</span>
                        <span>{JPY(total - totalCost)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button onClick={handleGeneratePdf} disabled={isPdfLoading || !selectedCustomer} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">
                    {isPdfLoading ? <Loader className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                    PDF出力
                </button>
                <button onClick={handleCreateOrder} disabled={isSubmitting || !selectedCustomer || !estimate.items?.length} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400">
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    受注登録する
                </button>
            </div>
        </div>
    );
};

export default EstimateCreationPage;
