
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { X, Pencil, Loader } from './Icons';

interface CustomerDetailModalProps {
    customer: Customer | null;
    mode: 'view' | 'edit' | 'new';
    onClose: () => void;
    onSave: (customerData: Partial<Customer>) => void;
    onSetMode: (mode: 'view' | 'edit' | 'new') => void;
    isDemoMode: boolean;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, mode, onClose, onSave, onSetMode, isDemoMode }) => {
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (mode === 'new') {
            setFormData({});
        } else {
            setFormData(customer || {});
        }
    }, [customer, mode]);

    if (mode === 'view' && !customer) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isDemoMode) return;
        setIsLoading(true);
        await onSave(formData);
        setIsLoading(false);
    };

    const isEditing = mode === 'edit' || mode === 'new';
    const title = mode === 'new' ? '新規顧客登録' : (mode === 'edit' ? '顧客情報の編集' : '顧客詳細');
    
    const formattedAnnualSales = (sales: string | null | undefined) => {
        if (!sales) return '-';
        const num = parseInt(sales, 10);
        return isNaN(num) ? '-' : `¥${num.toLocaleString()}`;
    };
    
    const fullAddress = [customer?.address1, customer?.address2, customer?.address3].filter(Boolean).join(' ');

    const renderField = (label: string, value: any, key: keyof Customer, type = 'text') => (
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-base font-medium leading-6 text-slate-900 dark:text-white">{label}</dt>
            <dd className="mt-1 text-base leading-6 text-slate-700 dark:text-slate-300 sm:col-span-2 sm:mt-0">
                {isEditing ? (
                    <input
                        type={type}
                        name={key}
                        id={key}
                        value={formData[key] || ''}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6"
                    />
                ) : (
                    value || '-'
                )}
            </dd>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="px-4 sm:px-0">
                            <h3 className="text-lg font-semibold leading-7 text-slate-900 dark:text-white">基本情報</h3>
                            <p className="mt-1 max-w-2xl text-base leading-6 text-slate-500 dark:text-slate-400">顧客の基本的な連絡先と識別情報。</p>
                        </div>
                        <div className="mt-6 border-t border-slate-200 dark:border-slate-700">
                            <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                                {renderField('顧客名', customer?.customerName, 'customerName')}
                                {renderField('顧客名 (カナ)', customer?.customerNameKana, 'customerNameKana')}
                                {renderField('代表者', customer?.representative, 'representative')}
                                {renderField('電話番号', customer?.phoneNumber, 'phoneNumber')}
                                {renderField('住所', fullAddress, 'address1')}
                            </dl>
                        </div>

                         <div className="px-4 sm:px-0 mt-8">
                            <h3 className="text-lg font-semibold leading-7 text-slate-900 dark:text-white">財務情報</h3>
                            <p className="mt-1 max-w-2xl text-base leading-6 text-slate-500 dark:text-slate-400">取引に関連する財務情報。</p>
                        </div>
                        <div className="mt-6 border-t border-slate-200 dark:border-slate-700">
                             <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                                {renderField('年商', formattedAnnualSales(customer?.annualSales), 'annualSales')}
                                {renderField('銀行名', customer?.bankName, 'bankName')}
                                {renderField('支店名', customer?.branchName, 'branchName')}
                                {renderField('口座番号', customer?.accountNo, 'accountNo')}
                            </dl>
                        </div>
                    </form>
                </div>

                <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        {mode === 'view' && (
                            <button 
                                onClick={() => onSetMode('edit')}
                                disabled={isDemoMode}
                                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <Pencil className="w-4 h-4" />
                                編集
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={isEditing ? () => { if (mode === 'edit') onSetMode('view'); else onClose(); } : onClose} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                            {isEditing ? 'キャンセル' : '閉じる'}
                        </button>
                        {isEditing && (
                             <button
                                onClick={handleSubmit}
                                disabled={isDemoMode || isLoading}
                                className="w-32 flex justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader className="w-5 h-5 animate-spin"/> : '保存'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailModal;