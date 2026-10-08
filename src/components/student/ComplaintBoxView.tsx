import React, { useState } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Send, 
  Paperclip,
  Building, 
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  Flame,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { aiCampusService, ComplaintRoutingResult } from '../../lib/aiCampusService';
import { Complaint } from '../../types';
import { formatDate } from '../../lib/utils';

export const ComplaintBoxView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || 'std-210101';
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    dataStore.getComplaints().filter(c => c.student_id === studentId)
  );

  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<Complaint['category']>('Infrastructure');
  const [priority, setPriority] = useState<Complaint['priority']>('Medium');
  const [isAnonymous, setIsAnonymous] = useState(true); // Default true for student protection
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  // AI Routing Suggestion State
  const [suggestingRouting, setSuggestingRouting] = useState(false);
  const [routingSuggestion, setRoutingSuggestion] = useState<ComplaintRoutingResult | null>(null);
  const [suggestionConfirmed, setSuggestionConfirmed] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  const categories: Complaint['category'][] = [
    'Academic', 
    'Hostel', 
    'Infrastructure', 
    'Mess/Canteen', 
    'Library', 
    'Accounts/Fee', 
    'Anti-Ragging', 
    'Faculty/Staff',
    'Other'
  ];

  const handleSuggestWithAi = async () => {
    if (description.trim().length < 20) {
      setSuggestionError('Please provide at least 20 characters in the description for accurate AI categorization.');
      return;
    }
    setSuggestingRouting(true);
    setSuggestionError('');
    try {
      const res = await aiCampusService.suggestComplaintRouting({
        description: description.trim(),
        title: title.trim() || undefined
      });
      setRoutingSuggestion(res);
    } catch (err: any) {
      setSuggestionError(err.message || 'Could not fetch AI routing suggestion.');
    } finally {
      setSuggestingRouting(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!routingSuggestion) return;
    const catMap: Record<string, Complaint['category']> = {
      academic: 'Academic',
      classroom: 'Infrastructure',
      lab: 'Infrastructure',
      infrastructure: 'Infrastructure',
      hostel: 'Hostel',
      it: 'Other',
      other: 'Other'
    };
    const mappedCategory = catMap[routingSuggestion.category.toLowerCase()] || 'Infrastructure';
    setCategory(mappedCategory);

    const prioMap: Record<string, Complaint['priority']> = {
      low: 'Low',
      normal: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };
    const mappedPriority = prioMap[routingSuggestion.priority.toLowerCase()] || 'Medium';
    setPriority(mappedPriority);

    setSuggestionConfirmed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    const branch = user?.studentMaster?.branch || 'CSE';
    const semester = user?.studentMaster?.semester || 6;
    const section = user?.studentMaster?.section || 'A';

    const newComp = await apiService.submitComplaint({
      student_id: studentId,
      student_name: isAnonymous ? 'Anonymous Student' : user?.name,
      student_roll: isAnonymous ? undefined : user?.studentMaster?.roll_no,
      student_branch: branch,
      student_semester: semester,
      student_section: section,
      is_anonymous: isAnonymous,
      category,
      priority,
      title,
      description,
      attachment_url: attachmentUrl || undefined,
      ai_suggested_category: routingSuggestion?.category,
      ai_suggested_assignee_role: routingSuggestion?.assigneeRole,
      ai_suggested_priority: routingSuggestion?.priority,
      ai_confidence: routingSuggestion?.confidence,
      ai_routing_reason: routingSuggestion?.reason,
      ai_suggestion_confirmed: suggestionConfirmed,
      ai_suggestion_reviewed_by: user?.id
    });

    setComplaints(prev => [newComp, ...prev]);
    setSubmitting(false);
    setShowModal(false);
    setTitle('');
    setDescription('');
    setAttachmentUrl('');
    setRoutingSuggestion(null);
    setSuggestionConfirmed(false);
    setSuggestionError('');
  };

  const handleEscalateToMD = async (complaintId: string) => {
    setEscalatingId(complaintId);
    await apiService.escalateComplaintToMD(
      complaintId,
      'No resolution/action provided by department within the required timeframe. Escalated directly to the College Managing Director (MD).'
    );

    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'Escalated to MD',
          escalated_to_md: true,
          escalation_reason: 'No resolution/action provided within SLA. Escalated directly to College MD.',
          escalated_at: new Date().toISOString()
        };
      }
      return c;
    }));
    setEscalatingId(null);
  };

  const getPriorityBadge = (p: Complaint['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (s: Complaint['status']) => {
    switch (s) {
      case 'Escalated to MD':
        return 'bg-red-600 text-white animate-pulse font-bold shadow-sm shadow-red-500/40';
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 dark:text-rose-400 animate-icon-wiggle icon-glow-rose shrink-0" />
              <span>Student Confidential Grievance Box</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0">
              <ShieldCheck className="w-3 h-3 text-purple-500" />
              100% Anonymous Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Apni shikayat bina naam bataye submit karein. Agar 48 hours me action na liya jaye, to shikayat seedhe <strong>College ke MD (Managing Director)</strong> ke paas escalate ho jaati hai!
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Lodge Anonymous Grievance
        </button>
      </div>

      {/* MD Escalation Guarantee Highlight Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-rose-950 text-white rounded-2xl p-4 border border-purple-800/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              Direct MD (Managing Director) Escalation Protocol
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-mono font-extrabold uppercase">Auto-SLA Active</span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Kisi bhi pending complaint par action na hone par auto-escalation trigger hoti hai. MD Desk is reviewing tickets daily.
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-amber-300 font-semibold shrink-0">
          ⚡ 100% Identity Protected • No Victimization Guarantee
        </div>
      </div>

      {/* Grievance Log Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {complaints.map(comp => (
          <div
            key={comp.id}
            className={`bg-white dark:bg-slate-800 border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
              comp.escalated_to_md 
                ? 'border-red-400 dark:border-red-600/80 ring-2 ring-red-500/20 shadow-red-500/10' 
                : 'border-slate-200 dark:border-slate-700/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {comp.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(comp.priority)}`}>
                    {comp.priority} Priority
                  </span>
                  {comp.is_anonymous && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Anonymous
                    </span>
                  )}
                  {comp.ai_suggested_category && comp.ai_suggestion_confirmed && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> AI Routed
                    </span>
                  )}
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(comp.status)}`}>
                  {comp.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {comp.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {comp.description}
              </p>

              {/* MD Escalation Alert Card if Escalated */}
              {comp.escalated_to_md && (
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-slate-900 border border-red-300 dark:border-red-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-600 animate-bounce" />
                      ESCALATED TO COLLEGE MD (MANAGING DIRECTOR)
                    </span>
                    <span className="text-[10px] font-mono text-red-600 font-bold">Level 1 Escalation</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {comp.escalation_reason || 'Department response delayed beyond SLA limit. Case transferred to MD Executive Office.'}
                  </p>
                  {comp.md_notes && (
                    <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-900 text-[11px] text-red-800 dark:text-red-200">
                      <strong>MD Desk Remarks:</strong> {comp.md_notes}
                    </div>
                  )}
                </div>
              )}

              {/* Administrative Resolution Box */}
              {comp.admin_response && !comp.escalated_to_md && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Action Taken:
                    </span>
                    {comp.assigned_to_name && (
                      <span className="text-[10px] text-slate-400">Assigned: {comp.assigned_to_name}</span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                    {comp.admin_response}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Lodge Date: {formatDate(comp.created_at)}</span>
                <span>•</span>
                <span>Ticket #{comp.id.slice(-6).toUpperCase()}</span>
              </div>

              {/* Action not taken? Escalate to MD button */}
              {comp.status !== 'Resolved' && comp.status !== 'Closed' && !comp.escalated_to_md && (
                <button
                  type="button"
                  onClick={() => handleEscalateToMD(comp.id)}
                  disabled={escalatingId === comp.id}
                  className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg text-[11px] font-bold border border-red-200 dark:border-red-800 transition flex items-center gap-1 self-start sm:self-auto"
                  title="If no action taken within 48 hours, click to escalate to MD"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{escalatingId === comp.id ? 'Escalating...' : 'Action Nahi Hua? Escalate to MD'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lodge Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
              File a College Complaint
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              All grievances are monitored by the HIET Student Welfare Directorate.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Urgency / Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Immediate attention)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Broken bench in Room 204 or Mess water cooler issue"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Detailed Description
                  </label>
                  {description.trim().length >= 20 && !routingSuggestion && (
                    <button
                      type="button"
                      onClick={handleSuggestWithAi}
                      disabled={suggestingRouting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 transition disabled:opacity-50"
                      title="AI suggests grievance category, priority and staff routing"
                    >
                      <Sparkles className={`w-3 h-3 ${suggestingRouting ? 'animate-spin' : ''}`} />
                      <span>{suggestingRouting ? 'Analyzing...' : 'Suggest with AI'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide complete description with specific location or course details..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              {suggestionError && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>{suggestionError}</span>
                </div>
              )}

              {/* AI Suggested Routing Card (Section 7) */}
              {routingSuggestion && (
                <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-900/60 text-xs space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      AI Suggested Routing
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                      {routingSuggestion.confidence}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-700">
                      <span className="text-slate-500 block text-[10px]">Category</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{routingSuggestion.category}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-700">
                      <span className="text-slate-500 block text-[10px]">Initial Assignee</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{routingSuggestion.assigneeRole.replace('_', ' ')}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-700">
                      <span className="text-slate-500 block text-[10px]">Priority</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{routingSuggestion.priority}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-indigo-100 dark:border-slate-700">
                    <strong>Reason:</strong> {routingSuggestion.reason}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-indigo-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setRoutingSuggestion(null);
                        setSuggestionConfirmed(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400"
                    >
                      Edit Manually
                    </button>
                    <button
                      type="button"
                      onClick={handleApplySuggestion}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{suggestionConfirmed ? 'Suggestion Applied' : 'Use Suggestion'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Anonymous Submission Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isAnonymous 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Anonymous Mode (Shikayat me Naam / Roll No Na Aaye)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAnonymous 
                          ? 'Aapki pehchaan 100% confidential rahegi. Kisi teacher ya staff ko naam nahi dikhega.' 
                          : 'Aapka verified naam aur roll number report me include hoga.'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* MD Auto Escalation Guarantee Note */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-start gap-2">
                <span className="text-sm">🏛️</span>
                <p className="text-[11px] text-purple-900 dark:text-purple-200 leading-relaxed">
                  <strong>MD Auto-Escalation Guarantee:</strong> Agar is complaint par department ya warden dwara <strong>48 ghante</strong> ke andar koi action nahi liya jata, to hamara automated engine is complaint ko seedhe <strong>College Managing Director (MD Desk)</strong> ko bhej dega!
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg"
                >
                  {submitting ? 'Submitting...' : 'Register Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
