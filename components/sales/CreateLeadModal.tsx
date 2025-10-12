import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../../types';
import { Loader, X, Save } from '../Icons';
import { INQUIRY_TYPES } from '../../constants';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose, onAddLead }) => {
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    status: LeadStatus.Untouched,
    source: '',
    message: '',
    inquiry_types: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.name) {
      setError('会社名と担当者名は必須です。');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
        await onAddLead(formData);
        onClose();
    } catch (err) {
        setError('リードの追加に失敗しました。');
    } finally {
        setIsSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">新規リード作成</h2>
                <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="company" className={labelClass}>会社名 *</label>
                        <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className={inputClass} required />
                    </div>
                    <div>
                        <label htmlFor="name" className={labelClass}>担当者名 *</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className={labelClass}>メールアドレス</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                    </div>
                     <div>
                        <label htmlFor="phone" className={labelClass}>電話番号</label>
                        <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className={labelClass}>ステータス</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                            {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="source" className={labelClass}>ソース</label>
                        <input type="text" id="source" name="source" value={formData.source} onChange={handleChange} className={inputClass} placeholder="例: Webサイト, 紹介" />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>問い合わせ種別</label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-md">
                        {INQUIRY_TYPES.map(type => (
                            <label key={type} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.inquiry_types.includes(type)}
                                    onChange={() => handleInquiryTypeChange(type)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-sm">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>
                 <div>
                    <label htmlFor="message" className={labelClass}>問い合わせ内容</label>
                    <textarea id="message" name="message" value={formData.message} onChange={handleChange} className={inputClass} rows={4} />
                </div>
            </div>

            <div className="flex justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onClose} disabled={isSaving} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">キャンセル</button>
                <button type="submit" disabled={isSaving} className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400">
                    {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />保存</>}
                </button>
            </div>
        </form>
    </div>
  );
};

export default CreateLeadModal;