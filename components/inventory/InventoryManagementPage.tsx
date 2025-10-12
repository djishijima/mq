
import React from 'react';
import { InventoryItem } from '../../types';

interface InventoryManagementPageProps {
  inventoryItems: InventoryItem[];
}

const InventoryManagementPage: React.FC<InventoryManagementPageProps> = ({ inventoryItems }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">在庫管理</h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
          資材や製品の在庫状況を管理します。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-6 py-3">品目コード</th>
              <th scope="col" className="px-6 py-3">品目名</th>
              <th scope="col" className="px-6 py-3">カテゴリ</th>
              <th scope="col" className="px-6 py-3 text-right">在庫数量</th>
              <th scope="col" className="px-6 py-3">単位</th>
              <th scope="col" className="px-6 py-3 text-right">単価</th>
              <th scope="col" className="px-6 py-3 text-right">在庫金額</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => (
              <tr key={item.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                <td className="px-6 py-4 font-mono text-sm">{item.id}</td>
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                <td className="px-6 py-4">{item.category}</td>
                <td className="px-6 py-4 text-right">{item.quantity.toLocaleString()}</td>
                <td className="px-6 py-4">{item.unit}</td>
                <td className="px-6 py-4 text-right">¥{item.unitPrice.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-semibold">¥{(item.quantity * item.unitPrice).toLocaleString()}</td>
              </tr>
            ))}
            {inventoryItems.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <p>在庫データがありません。</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManagementPage;
