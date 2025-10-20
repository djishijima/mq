import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Lead, LeadStatus, SortConfig, Toast, ConfirmationDialogProps, User, LeadScore } from '../../types';
import { generateLeadReplyEmail, analyzeLeadData, scoreLead } from '../../services/geminiService';
import { formatDate } from '../../utils';

import { Loader, Pencil, Trash2, Mail, Eye, CheckCircle, Lightbulb, List, KanbanSquare, PieChart } from '../Icons';
import EmptyState from '../ui/EmptyState';
import SortableHeader from '../ui/SortableHeader';
import LeadScoreBadge from '../ui/LeadScoreBadge';
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu';
import LeadDetailModal from './LeadDetailModal';
import LeadKanbanView from './LeadKanbanView';
import LeadStatusBadge from './LeadStatusBadge';


interface LeadManagementPageProps {
  leads: Lead[];
  searchTerm: string;
  onRefresh: () => void;
  onUpdateLead: (leadId: string, updatedData: Partial<Lead>) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  addToast: (message: string, type: Toast['type']) => void;
  requestConfirmation: (dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => void;
  currentUser: User | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-md shadow-lg">
        <p className="label text-sm text-slate-600 dark:text-slate-400">{`${label}`}</p>
        <p className="intro text-slate-900 dark:text-white font-semibold">{`件数 : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const LeadManagementPage: React.FC<LeadManagementPageProps> = ({ leads, searchTerm, onRefresh, onUpdateLead, onDeleteLead, addToast, requestConfirmation, currentUser }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'score', direction: 'descending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [editingStatusLeadId, setEditingStatusLeadId] = useState<string | null>(null);
    const [isReplyingTo, setIsReplyingTo] = useState<string | null>(null);
    const [isMarkingContacted, setIsMarkingContacted] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(true);

    const [leadScores, setLeadScores] = useState<Record<string, LeadScore>>({});
    const [isScoring, setIsScoring] = useState<Record<string, boolean>>({});
    const scoringInProgress = useRef<Record<string, boolean>>({});

    useEffect(() => {
        const scoreLeads = async () => {
            const leadsToScore = leads.filter(lead => !leadScores[lead.id] && !scoringInProgress.current[lead.id]);
            if (leadsToScore.length === 0) return;

            const newScoringInProgress: Record<string, boolean> = {};
            leadsToScore.forEach(lead => {
                scoringInProgress.current[lead.id] = true;
                newScoringInProgress[lead.id] = true;
            });
            setIsScoring(prev => ({ ...prev, ...newScoringInProgress }));

            const scorePromises = leadsToScore.map(lead =>
                scoreLead(lead)
                    .then(score => ({ leadId: lead.id, score }))
                    .catch(err => {
                        console.error(`Failed to score lead ${lead.id}:`, err);
                        return {
                            leadId: lead.id,
                            score: { score: 0, rationale: 'スコアリングに失敗しました。' }
                        };
                    })
            );

            const results = await Promise.all(scorePromises);

            const newScores: Record<string, LeadScore> = {};
            results.forEach(({ leadId, score }) => {
                newScores[leadId] = score;
                delete scoringInProgress.current[leadId];
            });

            setLeadScores(prev => ({ ...prev, ...newScores }));
            setIsScoring(prev => {
                const updatedState = { ...prev };
                results.forEach(({ leadId }) => delete updatedState[leadId]);
                return updatedState;
            });
        };
        scoreLeads();
    }, [leads, leadScores]);


    useEffect(() => {
      if (leads && leads.length > 0) {
        setIsAnalysisLoading(true);
        analyzeLeadData(leads)
          .then(setAiAnalysis)
          .catch((err) => {
            console.error(err);
            setAiAnalysis("AIによる分析中にエラーが発生しました。");
          })
          .finally(() => setIsAnalysisLoading(false));
      } else {
        setAiAnalysis('分析対象のリードデータがありません。');
        setIsAnalysisLoading(false);
      }
    }, [leads]);

    const chartData = useMemo(() => {
        const statusCounts = leads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {} as Record<LeadStatus, number>);

        return Object.values(LeadStatus).map(status => ({
          name: status,
          件数: statusCounts[status] || 0,
        }));
    }, [leads]);

    const handleRowClick = (lead: Lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLead(null);
    };

    const handleSaveLead = async (leadId: string, updatedData: Partial<Lead>) => {
        await onUpdateLead(leadId, updatedData);
        if (selectedLead && selectedLead.id === leadId) {
            setSelectedLead(prev => prev ? { ...prev, ...updatedData } as Lead : null);
        }
    };
    
    const handleDeleteClick = (e: React.MouseEvent, lead: Lead) => {
        e.stopPropagation();
        requestConfirmation({
            title: 'リードの削除',
            message: `本当にリード「${lead.company} / ${lead.name}」を削除しますか？この操作は元に戻せません。`,
            onConfirm: async () => {
                await onDeleteLead(lead.id);
                if (selectedLead && selectedLead.id === lead.id) {
                    handleCloseModal();
                }
            }
        });
    };
    
    const handleGenerateReply = async (e: React.MouseEvent, lead: Lead) => {
        e.stopPropagation();
        if (!lead.email) {
            addToast('返信先のメールアドレスが登録されていません。', 'error');
            return;
        }
        if (!currentUser) {
            addToast('ログインユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsReplyingTo(lead.id);
        try {
            const { subject, body } = await generateLeadReplyEmail(lead, currentUser.name);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');
            
            const timestamp = new Date().toLocaleString('ja-JP');
            const logMessage = `[${timestamp}] AI返信メールを作成しました。`;
            const updatedInfo = `${logMessage}\n${lead.infoSalesActivity || ''}`.trim();
            
            await onUpdateLead(lead.id, { 
                infoSalesActivity: updatedInfo, 
                status: LeadStatus.Contacted,
                updated_at: new Date().toISOString(),
            });
            addToast('Gmailの下書きを作成しました。', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'AIによるメール作成に失敗しました。', 'error');
        } finally {
            setIsReplyingTo(null);
        }
    };

    const handleMarkContacted = async (e: React.MouseEvent, lead: Lead) => {
        e.stopPropagation();
        setIsMarkingContacted(lead.id);
        try {
            const timestamp = new Date().toLocaleString('ja-JP');
            const logMessage = `[${timestamp}] ステータスを「${lead.status}」から「${LeadStatus.Contacted}」に変更しました。`;
            const updatedInfo = `${logMessage}\n${lead.infoSalesActivity || ''}`.trim();

            await onUpdateLead(lead.id, {
                status: LeadStatus.Contacted,
                infoSalesActivity: updatedInfo,
                updated_at: new Date().toISOString(),
            });
            addToast('ステータスを「コンタクト済」に更新しました。', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'ステータスの更新に失敗しました。', 'error');
        } finally {
            setIsMarkingContacted(null);
        }
    };

    const filteredLeads = useMemo(() => {
        if (!searchTerm) return leads;
        const lower = searchTerm.toLowerCase();
        return leads.filter(l => 
            l.name.toLowerCase().includes(lower) ||
            l.company.toLowerCase().includes(lower) ||
            l.status.toLowerCase().includes(lower) ||
            (l.source && l.source.toLowerCase().includes(lower))
        );
    }, [leads, searchTerm]);

    const sortedLeads = useMemo(() => {
        let sortableItems = [...filteredLeads];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'score') {
                    const scoreA = leadScores[a.id]?.score ?? -1;
                    const scoreB = leadScores[b.id]?.score ?? -1;
                    if (scoreA < scoreB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (scoreA > scoreB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                
                let aVal: any = a[sortConfig.key as keyof Lead];
                let bVal: any = b[sortConfig.key as keyof Lead];

                if (sortConfig.key === 'inquiry_types') {
                    aVal = a.inquiry_types ? a.inquiry_types.join(', ') : (a.inquiry_type || '');
                    bVal = b.inquiry_types ? b.inquiry_types.join(', ') : (b.inquiry_type || '');
                }
                
                if (sortConfig.key === 'updated_at') {
                    aVal = a.updated_at || a.created_at;
                    bVal = b.updated_at || b.created_at;
                }

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                
                if (String(aVal).toLowerCase() < String(bVal).toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (String(aVal).toLowerCase() > String(bVal).toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredLeads, sortConfig, leadScores]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-slate-500" />
                        ステータス別リード数
                    </h3>
                    <div className="mt-4 h-64 text-slate-600 dark:text-slate-400">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} />
                                <XAxis type="number" allowDecimals={false} stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
                                <YAxis type="category" dataKey="name" width={80} stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'currentColor', fillOpacity: 0.1 }}
                                />
                                <Bar dataKey="件数" fill="#3b82f6" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900/70 p-6 rounded-2xl shadow-sm flex items-start gap-4">
                     <div className="bg-blue-200 dark:bg-blue-900/50 p-3 rounded-full flex-shrink-0">
                        <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AIからの分析コメント</h3>
                        <div className="mt-2 text-slate-600 dark:text-slate-300 min-h-[48px]">
                            {isAnalysisLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader className="w-5 h-5 animate-spin" />
                                    <span>リードデータを分析中...</span>
                                </div>
                            ) : (
                                <p className="text-base">{aiAnalysis}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                        <List className="w-4 h-4" /> リスト
                    </button>
                    <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                        <KanbanSquare className="w-4 h-4" /> カンバン
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <SortableHeader sortKey="score" label="スコア" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="company" label="会社名 / 担当者" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="status" label="ステータス" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="inquiry_types" label="問い合わせ種別" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="updated_at" label="最終更新" sortConfig={sortConfig} requestSort={requestSort} />
                                    <th scope="col" className="px-6 py-3 font-medium text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLeads.map((lead) => (
                                    <tr 
                                      key={lead.id} 
                                      className="group bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer odd:bg-slate-50 dark:odd:bg-slate-800/50"
                                      onClick={() => handleRowClick(lead)}
                                    >
                                        <td className="px-6 py-4">
                                            {isScoring[lead.id] ? <Loader className="w-6 h-6 animate-spin" /> : <LeadScoreBadge score={leadScores[lead.id]?.score ?? 0} />}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                {lead.company} <span className="font-normal text-slate-500">/ {lead.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            {editingStatusLeadId === lead.id ? (
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value as LeadStatus;
                                                        onUpdateLead(lead.id, { status: newStatus, updated_at: new Date().toISOString() });
                                                        setEditingStatusLeadId(null);
                                                    }}
                                                    onBlur={() => setEditingStatusLeadId(null)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                    className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingStatusLeadId(lead.id) }}
                                                    className="w-full text-left relative group/status p-1 flex items-center gap-2"
                                                >
                                                    <LeadStatusBadge status={lead.status} />
                                                    <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/status:opacity-100 transition-opacity" />
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {lead.inquiry_types && lead.inquiry_types.length > 0
                                                ? <div className="flex flex-wrap gap-1">{lead.inquiry_types.slice(0, 2).map(type => <span key={type} className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600">{type}</span>)}</div>
                                                : (lead.inquiry_type || '-')
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(lead.updated_at || lead.created_at)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100" onClick={e => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuItem onClick={() => handleRowClick(lead)}>
                                                        <Eye className="w-4 h-4" /> 詳細表示
                                                    </DropdownMenuItem>
                                                     {lead.status === LeadStatus.Untouched && (
                                                        <DropdownMenuItem onClick={(e) => handleMarkContacted(e, lead)}>
                                                            {isMarkingContacted === lead.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} コンタクト済にする
                                                        </DropdownMenuItem>
                                                     )}
                                                    <DropdownMenuItem onClick={(e) => handleGenerateReply(e, lead)}>
                                                        {isReplyingTo === lead.id ? <Loader className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} AIで返信作成
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleDeleteClick(e, lead)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                                                        <Trash2 className="w-4 h-4" /> 削除
                                                    </DropdownMenuItem>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                 {sortedLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState 
                                                icon={Lightbulb}
                                                title={searchTerm ? '検索結果がありません' : 'リードがありません'}
                                                message={searchTerm ? '検索条件を変更してください。' : '「新規作成」から最初のリードを登録してください。'}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <LeadKanbanView leads={filteredLeads} onUpdateLead={onUpdateLead} onCardClick={handleRowClick} />
            )}
            <LeadDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                lead={selectedLead}
                onSave={handleSaveLead}
                onDelete={onDeleteLead}
                addToast={addToast}
                requestConfirmation={requestConfirmation}
                currentUser={currentUser}
                scoreData={selectedLead ? leadScores[selectedLead.id] : undefined}
            />
        </>
    );
};
export default LeadManagementPage;