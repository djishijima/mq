
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { Job, JobStatus, InvoiceStatus } from '../types';
import StatCard from './StatCard';
import { DollarSign, TrendingUp, Package, Briefcase, CheckCircle } from './Icons';
import { FIXED_COSTS } from '../constants';

interface DashboardProps {
  jobs: Job[];
}

const chartData = [
    { name: '1月', margin: 220000 },
    { name: '2月', margin: 180000 },
    { name: '3月', margin: 310000 },
    { name: '4月', margin: 280000 },
    { name: '5月', margin: 390000 },
    { name: '6月', margin: 350000 },
    { name: '7月', margin: 445000 },
];

const Dashboard: React.FC<DashboardProps> = ({ jobs }) => {
  const completedJobsPaid = jobs.filter(j => j.invoiceStatus === InvoiceStatus.Paid);

  const totalP = completedJobsPaid.reduce((sum, job) => sum + job.price, 0);
  const totalV = completedJobsPaid.reduce((sum, job) => sum + job.variableCost, 0);
  const totalM = totalP - totalV;
  const totalF = FIXED_COSTS.monthly.labor + FIXED_COSTS.monthly.other;
  const totalG = totalM - totalF;
  
  const bep = totalP > 0 ? totalF / (totalM / totalP) : 0;
  const revenueChartData = [{ name: '実績', P: totalP, V: totalV, M: totalM, F: totalF, G: totalG }];

  const jobsInProgress = jobs.filter(job => job.status === JobStatus.InProgress).length;
  const completedJobsCount = completedJobsPaid.length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="総売上高 (P)" value={`¥${totalP.toLocaleString()}`} icon={<DollarSign className="w-6 h-6 text-green-600 dark:text-green-400"/>} />
        <StatCard title="総限界利益 (M)" value={`¥${totalM.toLocaleString()}`} icon={<TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400"/>} />
        <StatCard title="経常利益 (G)" value={`¥${totalG.toLocaleString()}`} icon={<DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400"/>} />
        <StatCard title="総固定費 (F)" value={`¥${totalF.toLocaleString()}`} icon={<Package className="w-6 h-6 text-orange-600 dark:text-orange-400"/>} />
        <StatCard title="進行中の案件" value={jobsInProgress.toString()} icon={<Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>} />
        <StatCard title="完了した案件 (入金済)" value={completedJobsCount.toString()} icon={<CheckCircle className="w-6 h-6 text-pink-600 dark:text-pink-400"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">月次 限界利益レポート</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.3)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 14 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={(value) => `¥${Number(value).toLocaleString()}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.8)', borderColor: '#334155', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#f1f5f9' }} formatter={(value: number) => [`¥${value.toLocaleString()}`, "限界利益"]} />
              <Legend wrapperStyle={{paddingTop: '20px'}}/>
              <Bar dataKey="margin" fill="#3b82f6" radius={[4, 4, 0, 0]} name="限界利益"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">収益構造分析</h2>
          <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">限界利益率</p>
                <p className="text-2xl font-bold">{(totalP > 0 ? (totalM / totalP) * 100 : 0).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">損益分岐点</p>
                <p className="text-2xl font-bold">¥{Math.round(bep/1000)}k</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revenueChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 14 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 14 }} tickFormatter={(value) => `¥${Number(value/1000).toLocaleString()}k`} />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="V" stackId="a" fill="#f97316" name="変動費 (V)" />
                <Bar dataKey="M" stackId="a" fill="#3b82f6" name="限界利益 (M)" />
                <Line type="monotone" dataKey="F" stroke="#ef4444" strokeWidth={3} name="固定費 (F)" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;