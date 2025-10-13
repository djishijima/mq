import React from 'react';
import { User } from '../types';
import { LogOut } from './Icons';
import { supabase } from '../services/supabaseClient';

interface UserMenuProps {
    currentUser: User | null;
    onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ currentUser, onLogout }) => {
    if (!currentUser) return null;

    return (
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{currentUser.role === 'admin' ? '管理者' : '一般ユーザー'}</p>
            </div>
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-3 mt-2 rounded-lg text-left text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                <span>ログアウト</span>
            </button>
        </div>
    );
};

export default UserMenu;