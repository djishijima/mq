

import React, { useState } from 'react';
import { Loader, Save, Mail, CheckCircle } from './Icons';
import { Toast } from '../types';

interface SettingsPageProps {
    addToast: (message: string, type: Toast['type']) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ addToast }) => {
    const [settings, setSettings] = useState({
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
        senderEmail: 'noreply@example.com',
        senderName: 'MQ会計管理システム',
        encryption: 'tls',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            console.log('Saved settings:', settings);
            addToast('設定が正常に保存されました。', 'success');
        }, 1500);
    };

    const handleTestConnection = () => {
        setIsTesting(true);
        // Simulate API call
        setTimeout(() => {
            setIsTesting(false);
            console.log('Testing connection with:', settings);
            // Simulate a random success/failure
            if (Math.random() > 0.2) {
                addToast('テストメールが正常に送信されました。', 'success');
            } else {
                addToast('接続に失敗しました。設定を確認してください。', 'error');
            }
        }, 2000);
    };

    const inputClass = "w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500";
    const labelClass = "block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5";

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">通知メール設定 (SMTP)</h2>
                <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                    申請の承認・却下などの通知をメールで送信するためのSMTPサーバー設定です。
                </p>
            </div>
            <form onSubmit={handleSave}>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="host" className={labelClass}>SMTPホスト</label>
                            <input type="text" id="host" name="host" value={settings.host} onChange={handleChange} className={inputClass} placeholder="smtp.example.com" />
                        </div>
                        <div>
                            <label htmlFor="port" className={labelClass}>SMTPポート</label>
                            <input type="number" id="port" name="port" value={settings.port} onChange={handleChange} className={inputClass} placeholder="587" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="username" className={labelClass}>ユーザー名</label>
                            <input type="text" id="username" name="username" value={settings.username} onChange={handleChange} className={inputClass} placeholder="user@example.com" />
                        </div>
                        <div>
                            <label htmlFor="password" className={labelClass}>パスワード</label>
                            <input type="password" id="password" name="password" value={settings.password} onChange={handleChange} className={inputClass} placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="senderEmail" className={labelClass}>送信元メールアドレス</label>
                            <input type="email" id="senderEmail" name="senderEmail" value={settings.senderEmail} onChange={handleChange} className={inputClass} placeholder="noreply@example.com" />
                        </div>
                         <div>
                            <label htmlFor="senderName" className={labelClass}>送信元名</label>
                            <input type="text" id="senderName" name="senderName" value={settings.senderName} onChange={handleChange} className={inputClass} placeholder="MQ会計管理システム" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="encryption" className={labelClass}>暗号化</label>
                        <select id="encryption" name="encryption" value={settings.encryption} onChange={handleChange} className={inputClass}>
                            <option value="none">なし</option>
                            <option value="ssl">SSL/TLS</option>
                            <option value="tls">STARTTLS</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTesting || isSaving}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50"
                    >
                        {isTesting ? <Loader className="w-5 h-5 animate-spin"/> : <Mail className="w-5 h-5" />}
                        <span>{isTesting ? '送信中...' : '接続テスト'}</span>
                    </button>
                    <div>
                        <button
                            type="submit"
                            disabled={isSaving || isTesting}
                            className="w-32 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
                        >
                            {isSaving ? <Loader className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                            <span>{isSaving ? '保存中...' : '設定を保存'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
