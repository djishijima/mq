import React from 'react';

interface HeaderProps {
  title: string;
  onNewJobClick: () => void;
  isDemoMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onNewJobClick, isDemoMode = false }) => {
  return (
    <header className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white capitalize">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="relative group">
            <button
              onClick={onNewJobClick}
              disabled={isDemoMode}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              新規案件作成
            </button>
            {isDemoMode && (
                <div className="absolute bottom-full mb-2 w-64 bg-slate-800 text-white text-center text-sm rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2 z-10">
                    デモモードでは新規案件の作成はできません。データベースに接続すると有効になります。
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800"></div>
                </div>
            )}
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-full">
          <img src="https://picsum.photos/40/40" alt="User Avatar" className="rounded-full" />
        </div>
      </div>
    </header>
  );
};

export default Header;
