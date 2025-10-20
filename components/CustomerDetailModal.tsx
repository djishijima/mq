import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { X, Pencil, Loader, Lightbulb, AlertTriangle, Save } from './Icons';

interface CustomerDetailModalProps {
    customer: Customer | null;
    mode: 'view' | 'edit' | 'new';
    onClose: () => void;
    onSave: (customerData: Partial<Customer>) => Promise<void>;
    onSetMode: (mode: 'view' | 'edit' | 'new') => void;
    onAnalyzeCustomer: (customer: Customer) => void;
}

const TABS = [
    { id: 'basic', label: '基本情報' },
    { id: 'financial', label: '取引・財務情報' },
    { id: 'sales', label: '営業情報' },
    { id: 'notes', label: '備考・履歴' },
];

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, mode, onClose, onSave, onSetMode, onAnalyzeCustomer }) => {
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    const formatDateForInput = (dateString: string | null | undefined) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    }

    useEffect(() => {
        if (mode === 'new') {
            setFormData({});
        } else if (customer) {
            const initialData = { ...customer };
            // Format date fields for input[type=date]
            initialData.foundationDate = formatDateForInput(initialData.foundationDate);
            initialData.startDate = formatDateForInput(initialData.startDate);
            initialData.endDate = formatDateForInput(initialData.endDate);
            initialData.drawingDate = formatDateForInput(initialData.drawingDate);
            setFormData(initialData);
        }
    }, [customer, mode]);

    if (mode === 'view' && !customer) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerName) {
            setError('顧客名は必須項目です。');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await onSave(formData);
        } catch (err) {
            console.error(err);
            setError('顧客情報の保存に失敗しました。入力内容とデータベース接続を確認してください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAnalyzeClick = () => {
        if(customer && mode === 'view') {
            onAnalyzeCustomer(customer);
        }
    }

    const isEditing = mode === 'edit' || mode === 'new';
    const title = mode === 'new' ? '新規顧客登録' : (mode === 'edit' ? '顧客情報の編集' : '顧客詳細');
    
    const formattedCurrency = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '-';
        const num = typeof val === 'string' ? parseInt(val, 10) : val;
        return isNaN(num) ? '-' : `¥${num.toLocaleString()}`;
    };

    const renderField = (label: string, value: any, key: keyof Customer, type = 'text', options: {rows?: number, className?: string} = {}) => {
        let displayValue = value;
        if (type === 'date' && value) {
            try {
                displayValue = new Date(value).toLocaleDateString('ja-JP');
            } catch (e) {
                displayValue = value; // Show original value if date is invalid
            }
        }
        
        const inputClass = "block w-full rounded-md border-0 py-1.5 px-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed";

        return (
            <div className={options.className || ''}>
                <label htmlFor={key} className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">{label}</label>
                <div className="mt-1">
                    {isEditing ? (
                        type === 'textarea' ? (
                            <textarea
                                name={key}
                                id={key}
                                rows={options.rows || 3}
                                value={formData[key] as string || ''}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={isSubmitting}
                            />
                        ) : (
                            <input
                                type={type}
                                name={key}
                                id={key}
                                value={formData[key] as string || ''}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={isSubmitting}
                            />
                        )
                    ) : (
                        <div className="text-base leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words min-h-[40px] flex items-center py-1.5">
                            {displayValue || '-'}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        const gridClass = "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4";

        switch (activeTab) {
            case 'basic': return (
                <div className={gridClass}>
                    {renderField('顧客コード', customer?.customerCode, 'customerCode')}
                    {renderField('顧客名', customer?.customerName, 'customerName')}
                    {renderField('顧客名 (カナ)', customer?.customerNameKana, 'customerNameKana')}
                    {renderField('顧客名2', customer?.name2, 'name2')}
                    {renderField('代表者', customer?.representative, 'representative')}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">住所</label>
                        <div className="mt-1">
                            {isEditing ? (
                                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700">
                                    <input type="text" name="zipCode" id="zipCode" placeholder="郵便番号" value={formData.zipCode || ''} onChange={handleChange} disabled={isSubmitting} className="block w-1/2 rounded-md border-0 py-1.5 px-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base disabled:opacity-50" />
                                    <input type="text" name="address1" id="address1" placeholder="住所1" value={formData.address1 || ''} onChange={handleChange} disabled={isSubmitting} className="block w-full rounded-md border-0 py-1.5 px-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base disabled:opacity-50" />
                                    <input type="text" name="address2" id="address2" placeholder="住所2" value={formData.address2 || ''} onChange={handleChange} disabled={isSubmitting} className="block w-full rounded-md border-0 py-1.5 px-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base disabled:opacity-50" />
                                    <input type="text" name="address3" id="address3" placeholder="住所3" value={formData.address3 || ''} onChange={handleChange} disabled={isSubmitting} className="block w-full rounded-md border-0 py-1.5 px-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base disabled:opacity-50" />
                                </div>
                            ) : (
                                <div className="text-base leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words min-h-[40px] flex items-center py-1.5">
                                    {customer?.zipCode || customer?.address1 || customer?.address2 || customer?.address3 ? (
                                        <>
                                            {customer?.zipCode && `〒${customer.zipCode}`}
                                            <br />
                                            {`${customer?.address1 || ''}${customer?.address2 || ''}${customer?.address3 || ''}`}
                                        </>
                                    ) : '-'}
                                </div>
                            )}
                        </div>
                    </div>
                    {renderField('最寄り駅', customer?.nearestStation, 'nearestStation')}
                    {renderField('電話番号', customer?.phoneNumber, 'phoneNumber')}
                    {renderField('FAX', customer?.fax, 'fax')}
                    {renderField('設立年月日', customer?.foundationDate, 'foundationDate', 'date')}
                    {renderField('資本金', customer?.capital, 'capital')}
                    {renderField('年商', isEditing ? customer?.annualSales : formattedCurrency(customer?.annualSales), 'annualSales')}
                    {renderField('従業員数', customer?.employeesCount, 'employeesCount')}
                    {renderField('事業内容', customer?.companyContent, 'companyContent', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('会社特徴', customer?.companyFeatures, 'companyFeatures', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('キーパーソン', customer?.keyPerson, 'keyPerson', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('主要製品', customer?.mainProducts, 'mainProducts', 'textarea', { className: 'md:col-span-2' })}
                </div>
            );
            case 'financial': return (
                 <div className={gridClass}>
                    {renderField('顧客ランク', customer?.customerRank, 'customerRank')}
                    {renderField('顧客区分', customer?.customerDivision, 'customerDivision')}
                    {renderField('販売種別', customer?.salesType, 'salesType')}
                    {renderField('与信限度額', isEditing ? customer?.creditLimit : formattedCurrency(customer?.creditLimit), 'creditLimit')}
                    {renderField('締日', customer?.closingDay, 'closingDay')}
                    {renderField('支払日', customer?.payDay, 'payDay')}
                    {renderField('回収方法', customer?.recoveryMethod, 'recoveryMethod')}
                    {renderField('支払方法', customer?.payMoney, 'payMoney')}
                    {renderField('取引条件', customer?.tradeTerms, 'tradeTerms')}
                    {renderField('手形支払日', customer?.billPaymentDay, 'billPaymentDay')}
                    {renderField('手形支払', customer?.billPay, 'billPay', 'number')}
                    {renderField('掛売支払', customer?.creditSalesPay, 'creditSalesPay', 'number')}
                    {renderField('消費税端数処理', customer?.taxFraction, 'taxFraction')}
                    {renderField('税込みフラグ', customer?.taxInFlag, 'taxInFlag')}
                    {renderField('銀行名', customer?.bankName, 'bankName', 'text', { className: 'md:col-span-2' })}
                    {renderField('支店名', customer?.branchName, 'branchName')}
                    {renderField('支店コード', customer?.branchCode, 'branchCode')}
                    {renderField('口座番号', customer?.accountNo, 'accountNo')}
                    {renderField('口座名義カナ', customer?.accountNameKana, 'accountNameKana')}
                    {renderField('PQ', customer?.pq, 'pq')}
                    {renderField('VQ', customer?.vq, 'vq')}
                    {renderField('MQ', customer?.mq, 'mq')}
                    {renderField('M率', customer?.mRate, 'mRate')}
                </div>
            );
            case 'sales': return (
                <div className={gridClass}>
                    {renderField('営業担当者コード', customer?.salesUserCode, 'salesUserCode')}
                    {renderField('支援会社フラグ', customer?.supportCompanyFlag, 'supportCompanyFlag')}
                    {renderField('予算フラグ', customer?.budgetFlag, 'budgetFlag')}
                    {renderField('取引開始日', customer?.startDate, 'startDate', 'date')}
                    {renderField('取引終了日', customer?.endDate, 'endDate', 'date')}
                    {renderField('紹介者', customer?.introducer, 'introducer')}
                    {renderField('前任者', customer?.previousPerson, 'previousPerson')}
                    {renderField('受注率', customer?.orderRate, 'orderRate')}
                    {renderField('粗利', customer?.grossProfit, 'grossProfit')}
                    {renderField('経緯', customer?.keii, 'keii', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('販売動向', customer?.salesTrends, 'salesTrends', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('商品別粗利', customer?.grossProfitByProduct, 'grossProfitByProduct', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('営業実績', customer?.businessResult, 'businessResult', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('顧客動向', customer?.customerTrend, 'customerTrend', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('何があったか', customer?.whatHappened, 'whatHappened', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('競合対策', customer?.responseToCompetitors, 'responseToCompetitors', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('営業目標', customer?.salesGoal, 'salesGoal', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('外部要因', customer?.externalItems, 'externalItems', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('内部要因', customer?.internalItems, 'internalItems', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('見積ポイント', customer?.quotationPoint, 'quotationPoint', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('競合情報', customer?.rivalInfo, 'rivalInfo', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('成長性', customer?.growthPotential, 'growthPotential', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('失注案件', customer?.lostOrders, 'lostOrders', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('月次計画', customer?.monthlyPlan, 'monthlyPlan', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('年間行動計画', customer?.annualActionPlan, 'annualActionPlan', 'textarea', { className: 'md:col-span-2' })}
                    {renderField('一般書', customer?.ippanPub, 'ippanPub')}
                    {renderField('教科書', customer?.textPub, 'textPub')}
                    {renderField('業界紙', customer?.gyokaiPub, 'gyokaiPub')}
                    {renderField('商業印刷', customer?.shoinPub, 'shoinPub')}
                    {renderField('通信教育', customer?.tsushinEdu, 'tsushinEdu')}
                    {renderField('その他', customer?.otherPub, 'otherPub')}
                </div>
            );
            case 'notes': return (
                <div className={gridClass}>
                    {renderField('備考', customer?.note, 'note', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('情報履歴', customer?.infoHistory, 'infoHistory', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('営業活動', customer?.infoSalesActivity, 'infoSalesActivity', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('受注フロー', customer?.infoOrderFlow, 'infoOrderFlow', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('取引状況', customer?.infoTransactionProgress, 'infoTransactionProgress', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('現在受注', customer?.infoCurrentOrders, 'infoCurrentOrders', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('今後提案', customer?.infoFutureProposals, 'infoFutureProposals', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('競合他社', customer?.infoCompetitors, 'infoCompetitors', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('要求事項', customer?.infoRequirements, 'infoRequirements', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('営業アイデア', customer?.infoSalesIdeas, 'infoSalesIdeas', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('経営メモ', customer?.infoManagementNotes, 'infoManagementNotes', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('その他情報', customer?.infoOther, 'infoOther', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('作図メモ', customer?.drawingMemo, 'drawingMemo', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('作図日', customer?.drawingDate, 'drawingDate', 'date')}
                    {renderField('担当者情報', customer?.customerContactInfo, 'customerContactInfo', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('組織図', customer?.orgChart, 'orgChart', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('事故履歴', customer?.accidentHistory, 'accidentHistory', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                    {renderField('お客様の声', customer?.customerVoice, 'customerVoice', 'textarea', {rows: 5, className: 'md:col-span-2'})}
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {TABS.map(tab => (
                                <button
                                    type="button"
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${
                                        activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base`}
                                    aria-current={activeTab === tab.id ? 'page' : undefined}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {renderTabContent()}
                </div>

                <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex gap-2">
                        {mode === 'view' && customer && (
                            <>
                                <button 
                                    type="button"
                                    onClick={() => onSetMode('edit')}
                                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                                >
                                    <Pencil className="w-4 h-4" />
                                    編集
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleAnalyzeClick}
                                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50"
                                >
                                    <Lightbulb className="w-4 h-4" />
                                    AI企業分析
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex gap-4">
                        {isEditing ? (
                            <>
                                <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">キャンセル</button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
                                >
                                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2"/>保存</>}
                                </button>
                            </>
                        ) : (
                             <button type="button" onClick={onClose} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700">閉じる</button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CustomerDetailModal;
