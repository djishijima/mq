import React, { useState, useEffect } from 'react';
import { X, Loader, AlertTriangle, Mail, CheckCircle } from './Icons';

interface SalesEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    emailText: string;
    customerName: string;
    isLoading: boolean;
    error: string;
}

const SalesEmailModal: React.FC<SalesEmailModalProps> = ({ isOpen, onClose, emailText, customerName, isLoading, error }) => {
    const [editedEmail, setEditedEmail] = useState(emailText);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setEditedEmail(emailText);
    }, [emailText]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(editedEmail);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Mail className="w-7 h-7 text-blue-500" />
                        <div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI提案メール作成</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">宛先: {customerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                            <p className="mt-4 text-slate-500 dark:text-slate-400">AIがメールを作成中...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                             <AlertTriangle className="w-12 h-12 text-red-500" />
                            <p className="mt-4 font-semibold text-red-700 dark:text-red-300">生成エラー</p>
                            <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && emailText && (
                        <textarea
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            className="w-full h-96 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            aria-label="Generated Sales Email"
                        />
                    )}
                </div>

                <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleCopy}
                        disabled={!editedEmail || isLoading}
                        className={`flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors ${
                            isCopied
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-400'
                        }`}
                    >
                        {isCopied ? <CheckCircle className="w-5 h-5"/> : <Mail className="w-5 h-5" />}
                        <span>{isCopied ? 'コピーしました！' : '内容をコピー'}</span>
                    </button>
                     <button onClick={onClose} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesEmailModal;
