import React, { useState } from 'react';
import { Loader, Save, AlertTriangle } from './Icons';

interface SupabaseCredentialsModalProps {
  onSave: (url: string, key: string) => void;
  onShowSetup: () => void;
}

const SupabaseCredentialsModal: React.FC<SupabaseCredentialsModalProps> = ({ onSave, onShowSetup }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith('https') || !key) {
      setError('有効なSupabase URLとAnon Keyを入力してください。');
      return;
    }
    setError('');
    setIsSaving(true);
    // onSave will trigger a re-render or page change, so we don't need to set isSaving back to false.
    onSave(url, key);
  };

  const inputClass = "w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex justify-center items-center z-[200] p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">データベース接続設定</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Supabaseプロジェクトの接続情報を入力してください。
          </p>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="supabaseUrl" className={labelClass}>Supabase URL</label>
            <input
              id="supabaseUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://[project-id].supabase.co"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="supabaseKey" className={labelClass}>Supabase Anon Key (public)</label>
            <input
              id="supabaseKey"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="ey..."
              required
              className={inputClass}
            />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 pt-2">
            これらの情報は <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase</a> プロジェクトの「Project Settings」 &gt; 「API」ページで確認できます。
            テーブルのセットアップがまだの場合は、<button type="button" onClick={onShowSetup} className="text-blue-600 hover:underline">セットアップガイド</button>を参照してください。
          </div>
        </div>
        <div className="flex justify-end p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            disabled={isSaving}
            className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            接続
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupabaseCredentialsModal;