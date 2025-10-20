import React, { useState, useEffect } from 'react';

import { Lead, LeadStatus, Toast, ConfirmationDialogProps, User, LeadScore } from '@/types';
import { generateLeadReplyEmail } from '@/services/geminiService';
import { INQUIRY_TYPES } from '@/constants';

import { X, Save, Loader, Pencil, Trash2, Mail, CheckCircle } from '../Icons';
import LeadScoreBadge from '../ui/LeadScoreBadge';
import LeadStatusBadge from './LeadStatusBadge';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onSave: (leadId: string, updatedData: Partial<Lead>) => Promise<void>;
    onDelete: (leadId: string) => Promise<void>;
    addToast: (message: string, type: Toast['type']) => void;
    requestConfirmation: (dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => void;
    currentUser: User | null;
    scoreData?: LeadScore;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-4">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Field: React.FC<{
    label: string;
    name: keyof Lead;
    value: string | string[] | null | undefined;
    isEditing: boolean;
    onChange: (e: React.ChangeEvent<any>) => void;
    type?: 'text' | 'email' | 'select' | 'textarea';
    options?: any[];
    className?: string;
}> = ({ label, name, value, isEditing, onChange, type = 'text', options = [], className = '' }) => {
    const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500";
    
    return (
        <div className={className}>
            <label htmlFor={name} className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</label>
            <div className="mt-1">
                {isEditing ? (
                    <>
                        {type === 'textarea' && <textarea id={name} name={name} value={(value as string) || ''} onChange={onChange} className={inputClass} rows={5} />}
                        {type === 'select' && <select id={name} name={name} value={(value as string) || ''} onChange={onChange} className={inputClass}>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>}
                        {type !== 'textarea' && type !== 'select' && <input type={type} id={name} name={name} value={(value as string) || ''} onChange={onChange} className={inputClass} />}
                    </>
                ) : (
                    <p className="text-base text-slate-900 dark:text-white min-h-[44px] flex items-center whitespace-pre-wrap break-words">
                        {value || '-'}
                    </p>
                )}
            </div>
        </div>
    );
};

const InquiryTypesField: React.FC<{ isEditing: boolean; value: string[]; onChange: (type: string) => void }> = ({ isEditing, value, onChange }) => {
    return (
        <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">問い合わせ種別</label>
            <div className="mt-2">
                {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-md">
                        {INQUIRY_TYPES.map(type => (
                            <label key={type} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={value.includes(type)}
                                    onChange={() => onChange(type)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-sm text-slate-800 dark:text-slate-200">{type}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                     <div className="flex flex-wrap gap-2 min-h-[44px] items-center">
                        {value && value.length > 0 ? value.map(type => (
                            <span key={type} className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{type}</span>
                        )) : '-'}
                    </div>
                )}
            </div>
        </div>
    );
};


const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, onSave, onDelete, addToast, requestConfirmation, currentUser, scoreData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Lead>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isAiEmailLoading, setIsAiEmailLoading] = useState(false);

    useEffect(() => {
        if (lead) {
            setFormData({ ...lead, inquiry_types: lead.inquiry_types || [] });
            setIsEditing(false);
        }
    }, [lead]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !lead) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleInquiryTypeChange = (type: string) => {
        setFormData(prev => {
            const currentTypes = prev.inquiry_types || [];
            const newTypes = currentTypes.includes(type)
                ? currentTypes.filter(t => t !== type)
                : [...currentTypes, type];
            return { ...prev, inquiry_types: newTypes };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { id, created_at, ...submissionData } = formData;
        submissionData.updated_at = new Date().toISOString();
        await onSave(lead.id, submissionData);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleDelete = () => {
        requestConfirmation({
            title: 'リードの削除',
            message: `本当にリード「${lead.company}」を削除しますか？この操作は元に戻せません。`,
            onConfirm: async () => {
                await onDelete(lead.id);
                onClose();
            }
        });
    };

    const handleGenerateReply = async () => {
        if (!lead.email) {
            addToast('返信先のメールアドレスが登録されていません。', 'error');
            return;
        }
        if (!currentUser) {
            addToast('ログインユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsAiEmailLoading(true);
        try {
            const { subject, body } = await generateLeadReplyEmail(lead, currentUser.name);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');
            
            const timestamp = new Date().toLocaleString('ja-JP');
            const logMessage = `[${timestamp}] AI返信メールを作成しました。`;
            const updatedInfo = `${logMessage}\n${formData.infoSalesActivity || ''}`.trim();
            
            const updatedData = { infoSalesActivity: updatedInfo, status: LeadStatus.Contacted, updated_at: new Date().toISOString() };
            await onSave(lead.id, updatedData);
            setFormData(prev => ({ ...prev, ...updatedData }));
            addToast('Gmailの下書きを作成しました。', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'AIによるメール作成に失敗しました。', 'error');
        } finally {
            setIsAiEmailLoading(false);
        }
    };

    const handleMarkContacted = async () => {
        setIsSaving(true);
        try {
            const timestamp = new Date().toLocaleString('ja-JP');
            const logMessage = `[${timestamp}] ステータスを「${formData.status}」から「${LeadStatus.Contacted}」に変更しました。`;
            const updatedInfo = `${logMessage}\n${formData.infoSalesActivity || ''}`.trim();

            const updatedData = {
                status: LeadStatus.Contacted,
                infoSalesActivity: updatedInfo,
                updated_at: new Date().toISOString()
            };
            await onSave(lead.id, updatedData);
            setFormData(prev => ({ ...prev, ...updatedData }));
            addToast('ステータスを「コンタクト済」に更新しました。', 'success');
        } catch (error) {
            addToast('ステータスの更新に失敗しました。', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">リード詳細</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <Field label="会社名" name="company" value={formData.company} isEditing={isEditing} onChange={handleChange} />
                        <Field label="担当者名" name="name" value={formData.name} isEditing={isEditing} onChange={handleChange} />
                        <Field label="メールアドレス" name="email" type="email" value={formData.email} isEditing={isEditing} onChange={handleChange} />
                        <Field label="電話番号" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleChange} />
                         <div>
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">ステータス</label>
                            <div className="mt-1">
                                {isEditing ? (
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500">
                                        {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                ) : (
                                     <div className="min-h-[44px] flex items-center"><LeadStatusBadge status={lead.status} /></div>
                                )}
                            </div>
                        </div>
                        <Field label="ソース" name="source" value={formData.source} isEditing={isEditing} onChange={handleChange} />
                    </div>
                    
                    {scoreData && (
                        <DetailSection title="AI リードスコア">
                            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <LeadScoreBadge score={scoreData.score} />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 dark:text-white">スコアリング理由</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mt-1">
                                        {scoreData.rationale}
                                    </p>
                                </div>
                            </div>
                        </DetailSection>
                    )}

                    <DetailSection title="問い合わせ内容">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <InquiryTypesField isEditing={isEditing} value={formData.inquiry_types || []} onChange={handleInquiryTypeChange} />
                            <Field label="メッセージ" name="message" value={formData.message} isEditing={isEditing} onChange={handleChange} type="textarea" className="md:col-span-2" />
                        </div>
                    </DetailSection>

                    <DetailSection title="活動履歴">
                         <Field label="活動履歴" name="infoSalesActivity" value={formData.infoSalesActivity} isEditing={isEditing} onChange={handleChange} type="textarea" className="md:col-span-2" />
                    </DetailSection>

                    <DetailSection title="システム情報">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div><dt className="text-sm font-medium text-slate-500 dark:text-slate-400">作成日時</dt><dd className="mt-1 text-base text-slate-900 dark:text-white">{new Date(lead.created_at).toLocaleString('ja-JP')}</dd></div>
                            <div><dt className="text-sm font-medium text-slate-500 dark:text-slate-400">最終更新</dt><dd className="mt-1 text-base text-slate-900 dark:text-white">{lead.updated_at ? new Date(lead.updated_at).toLocaleString('ja-JP') : '-'}</dd></div>
                        </div>
                    </DetailSection>
                </div>

                <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        {isEditing ? (
                            <button onClick={handleDelete} disabled={isSaving} className="flex items-center gap-2 text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50">
                                <Trash2 className="w-4 h-4" /> 削除
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={handleGenerateReply} disabled={isAiEmailLoading || isSaving} className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold py-2 px-4 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 disabled:opacity-50">
                                    {isAiEmailLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    AI返信作成
                                </button>
                                {formData.status === LeadStatus.Untouched && (
                                    <button
                                        onClick={handleMarkContacted}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/50 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        コンタクト済にする
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        {!isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                                    <Pencil className="w-4 h-4" /> 編集
                                </button>
                                <button onClick={onClose} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">閉じる</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setIsEditing(false); setFormData(lead); }} disabled={isSaving} className="bg-slate-100 dark:bg-slate-700 font-semibold py-2 px-4 rounded-lg disabled:opacity-50">キャンセル</button>
                                <button onClick={handleSave} disabled={isSaving} className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-slate-400">
                                    {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />保存</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetailModal;