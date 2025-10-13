import React, { useState } from 'react';
import { X, Mail, CheckCircle, Copy } from '../Icons';
import { Toast } from '../../types';

interface LeadReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: {
        subject: string;
        body: string;
        to: string;
    };
    leadName: string;
    addToast: (message: string, type: Toast['type']) => void;
}

const LeadReplyModal: React.FC<LeadReplyModalProps> = ({ isOpen, onClose, email, leadName, addToast }) => {
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(email.body);
        setIsCopied(true);
        addToast('メール本文をコピーしました。', 'success');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenGmail = () => {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email.to}&su=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
        window.open(gmailUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Mail className="w-7 h-7 text-blue-500" />
                        <div>
                           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI返信メール（下書き）</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">宛先: {leadName} 様</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">件名</label>
                        <p className="mt-1 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">{email.subject}</p>
                    </div>
                    <div>
                         <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">本文</label>
                        <div className="mt-1 p-3 h-80 overflow-y-auto bg-slate-100 dark:bg-slate-700/50 rounded-md whitespace-pre-wrap">
                            {email.body}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors ${
                                isCopied
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            {isCopied ? <CheckCircle className="w-5 h-5"/> : <Copy className="w-5 h-5" />}
                            <span>{isCopied ? 'コピーしました' : '本文をコピー'}</span>
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                            閉じる
                        </button>
                         <button onClick={handleOpenGmail} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2">
                            <Mail className="w-5 h-5"/>
                            Gmailで開く
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadReplyModal;