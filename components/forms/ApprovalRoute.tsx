import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { getUsers } from '../../services/dataService';

interface ApprovalRouteProps {
    onChange: (route: { approver1: string; approver2: string }) => void;
    isSubmitting: boolean;
}

const ApprovalRoute: React.FC<ApprovalRouteProps> = ({ onChange, isSubmitting }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [approver1, setApprover1] = useState('');
    const [approver2, setApprover2] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await getUsers();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to fetch users for approval route", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        onChange({ approver1, approver2 });
    }, [approver1, approver2, onChange]);

    const selectClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">承認ルート *</label>
            <div className="flex items-center gap-4">
                <select 
                    value={approver1} 
                    onChange={(e) => setApprover1(e.target.value)} 
                    className={selectClass} 
                    disabled={isSubmitting}
                    required
                >
                    <option value="">承認者1を選択...</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
                <span className="text-slate-400">&rarr;</span>
                <select 
                    value={approver2} 
                    onChange={(e) => setApprover2(e.target.value)} 
                    className={selectClass}
                    disabled={isSubmitting}
                >
                    <option value="">承認者2を選択 (任意)...</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
                {isLoading && <span className="text-sm text-slate-500">読み込み中...</span>}
            </div>
        </div>
    );
};

export default ApprovalRoute;
