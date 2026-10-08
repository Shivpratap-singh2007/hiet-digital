import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  X, 
  ChevronRight, 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService, calculateLeaveDays } from '../../lib/supabase';
import { LeaveRequest, LeaveRequestHistory } from '../../types';
import { formatDate, formatIndiaDateTime } from '../../lib/utils';

export const LeaveApplicationView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || user?.id || 'std-cse-2026-001';
  
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() =>
    dataStore.getLeaves().filter(l => l.student_id === studentId || l.submitted_by_user_id === user?.id)
  );

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTimelineLeave, setSelectedTimelineLeave] = useState<LeaveRequest | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live Refresh listener
  const fetchLeaves = async () => {
    try {
      const data = await apiService.getLeaves(studentId);
      if (data) {
        setLeaves(data);
      }
    } catch (e) {
      console.warn('Failed to load student leaves:', e);
    }
  };

  useEffect(() => {
    fetchLeaves();
    const handleSync = () => fetchLeaves();
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-leave-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-leave-updated', handleSync);
    };
  }, [studentId]);

  // Load history when timeline modal is opened
  useEffect(() => {
    if (selectedTimelineLeave) {
      setLoadingHistory(true);
      apiService.getLeaveHistory(selectedTimelineLeave.id).then(hist => {
        setLeaveHistory(hist);
        setLoadingHistory(false);
      }).catch(() => setLoadingHistory(false));
    }
  }, [selectedTimelineLeave]);

  const durationDays = startDate && endDate ? calculateLeaveDays(startDate, endDate) : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    setSubmitting(true);
    const newLeave = await apiService.submitLeaveRequest({
      student_id: studentId,
      student_name: user?.name || user?.studentMaster?.name,
      student_roll: user?.studentMaster?.roll_no,
      student_branch: user?.studentMaster?.branch || user?.department,
      student_semester: user?.studentMaster?.semester,
      student_section: user?.studentMaster?.section || 'A',
      start_date: startDate,
      end_date: endDate,
      reason,
      document_url: docUrl || 'https://example.com/docs/medical_leave_supporting.pdf',
      submitted_by_user_id: user?.id
    });

    setLeaves(prev => [newLeave, ...prev.filter(l => l.id !== newLeave.id)]);
    setSubmitting(false);
    setShowApplyModal(false);
    setStartDate('');
    setEndDate('');
    setReason('');
    setDocUrl('');
    window.dispatchEvent(new Event('hiet-leave-updated'));
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    }
    if (s === 'pending_faculty') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
          <Clock className="w-3 h-3" /> Pending Faculty Approval
        </span>
      );
    }
    if (s === 'pending_hod') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
          <Clock className="w-3 h-3" /> Pending HOD Approval
        </span>
      );
    }
    if (s === 'pending_principal') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
          <Clock className="w-3 h-3" /> Pending Principal Approval
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
        <Clock className="w-3 h-3" /> Under Review
      </span>
    );
  };

  const isApproved = (s: string) => s.toLowerCase() === 'approved';
  const isPending = (s: string) => s.toLowerCase().startsWith('pending');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-700 dark:text-blue-400 animate-spin-slow icon-glow-cyan" />
            Online Student Leave Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Apply for medical, duty, or personal leaves with faculty review and attendance reconciliation
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Apply For Leave
        </button>
      </div>

      {/* Leave Application Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Total Applications</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {leaves.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Recorded this semester</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Approved Leaves</span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {leaves.filter(l => isApproved(l.status)).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Attendance adjusted as excused</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">Under Review</span>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {leaves.filter(l => isPending(l.status)).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Awaiting faculty / HOD / Principal decision</p>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Leave Request Log & Tracking
          </h3>
          <span className="text-[11px] text-slate-400">
            Click any entry to view complete workflow timeline
          </span>
        </div>

        {/* Mobile View: Cards list (< sm) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700/50 p-3 space-y-2.5">
          {leaves.map(l => (
            <div 
              key={l.id} 
              onClick={() => setSelectedTimelineLeave(l)}
              className="p-3.5 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 w-full cursor-pointer hover:bg-slate-100/80 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Applied On: {formatIndiaDateTime(l.submitted_at ?? l.created_at)}</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                    {formatDate(l.start_date)} — {formatDate(l.end_date)} ({l.total_days || 1} {l.total_days === 1 ? 'day' : 'days'})
                  </h4>
                </div>
                {getStatusBadge(l.status)}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="line-clamp-2">{l.reason}</p>
                {l.document_url && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                    <FileText className="w-3 h-3" /> Supporting Doc Attached
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">
                  {l.remarks ? `Remark: ${l.remarks}` : `Stage: ${l.current_stage || 'Review'}`}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-[10px] shrink-0 flex items-center gap-0.5">
                  View Timeline <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet & Desktop View: Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto w-full min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Applied On</th>
                <th className="px-4 py-3">Leave Duration</th>
                <th className="px-4 py-3">Reason / Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Review Remarks</th>
                <th className="px-4 py-3 text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {leaves.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                    {formatIndiaDateTime(l.submitted_at ?? l.created_at)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    <div>{formatDate(l.start_date)} — {formatDate(l.end_date)}</div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {l.total_days || 1} {(l.total_days || 1) === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-2">{l.reason}</p>
                    {l.document_url && (
                      <a 
                        href={l.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-1 hover:underline"
                      >
                        <FileText className="w-3 h-3" /> Supporting Doc Attached
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(l.status)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs">
                    {l.remarks || l.approval_remarks ? (
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{l.remarks || l.approval_remarks}</p>
                        {l.reviewed_by_name && (
                          <span className="text-[10px] text-slate-400">— {l.reviewed_by_name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        {l.current_assignee_name ? `Assigned to ${l.current_assignee_name}` : 'Pending review'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedTimelineLeave(l)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Track Stepper
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Workflow Stepper Timeline Modal */}
      {selectedTimelineLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Leave Approval Workflow Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDate(selectedTimelineLeave.start_date)} — {formatDate(selectedTimelineLeave.end_date)} ({selectedTimelineLeave.total_days} days)
                </p>
              </div>
              <button
                onClick={() => setSelectedTimelineLeave(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Status Pill */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Current Resolution</span>
              {getStatusBadge(selectedTimelineLeave.status)}
            </div>

            {/* Audit Timestamps: Applied On, Last Updated, Final Decision */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Applied On</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatIndiaDateTime(selectedTimelineLeave.submitted_at ?? selectedTimelineLeave.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Updated</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatIndiaDateTime(selectedTimelineLeave.updated_at || selectedTimelineLeave.submitted_at || selectedTimelineLeave.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Decision</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedTimelineLeave.final_decision_at || selectedTimelineLeave.approved_at 
                    ? formatIndiaDateTime(selectedTimelineLeave.final_decision_at || selectedTimelineLeave.approved_at) 
                    : 'Pending'}
                </span>
              </div>
            </div>

            {/* Stepper Steps */}
            <div className="space-y-3 py-2">
              {/* Step 1: Submission */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Student Submission</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Application registered by {selectedTimelineLeave.student_name} on {formatIndiaDateTime(selectedTimelineLeave.submitted_at ?? selectedTimelineLeave.created_at)}
                  </p>
                </div>
              </div>

              {/* Step 2: Faculty Review */}
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                  selectedTimelineLeave.status !== 'pending_faculty'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700 animate-pulse'
                }`}>
                  {selectedTimelineLeave.status !== 'pending_faculty' ? '✓' : '2'}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Class In-Charge / Faculty Review</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedTimelineLeave.status === 'pending_faculty' 
                      ? 'Currently pending mentor / Class In-Charge review'
                      : 'Faculty evaluation completed'}
                  </p>
                </div>
              </div>

              {/* Step 3: HOD Review (Only if duration >= 3 days) */}
              {(selectedTimelineLeave.total_days >= 3) && (
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                    selectedTimelineLeave.status === 'pending_faculty'
                      ? 'bg-slate-100 text-slate-400'
                      : selectedTimelineLeave.status === 'pending_hod'
                      ? 'bg-indigo-100 text-indigo-700 animate-pulse'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {['approved', 'pending_principal'].includes(selectedTimelineLeave.status.toLowerCase()) ? '✓' : '3'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Department HOD Sanction</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedTimelineLeave.status === 'pending_hod'
                        ? 'Under review with Head of Department'
                        : selectedTimelineLeave.status === 'pending_faculty'
                        ? 'Pending prerequisite faculty recommendation'
                        : 'Department HOD decision recorded'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Principal Review (Only if duration >= 7 days) */}
              {(selectedTimelineLeave.total_days >= 7) && (
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                    selectedTimelineLeave.status === 'pending_principal'
                      ? 'bg-purple-100 text-purple-700 animate-pulse'
                      : isApproved(selectedTimelineLeave.status)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isApproved(selectedTimelineLeave.status) ? '✓' : '4'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Principal Institutional Approval</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedTimelineLeave.status === 'pending_principal'
                        ? 'Final institutional approval awaiting Principal review'
                        : 'Principal review completed'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* History Logs */}
            {leaveHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Audit History Events
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1.5 text-[11px]">
                  {leaveHistory.map((h, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {h.action_key.replace(/_/g, ' ')}
                        </span>
                        {h.remarks && <p className="text-[10px] text-slate-500 mt-0.5">{h.remarks}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatIndiaDateTime(h.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTimelineLeave(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Submit Leave Application
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your mentor & HOD will receive digital notification to review your request.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Dynamic Duration Indicator */}
              {startDate && endDate && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="font-bold text-blue-900 dark:text-blue-200">
                        Leave Duration: {durationDays} {durationDays === 1 ? 'day' : 'days'}
                      </span>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                        {durationDays <= 2 
                          ? 'Routes to Class In-Charge / Faculty mentor.'
                          : durationDays <= 6
                          ? 'Requires Class In-Charge recommendation followed by HOD approval.'
                          : 'Extended leave (> 7 days) requires Class In-Charge → HOD → Principal sanction.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Absence
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="State the purpose of leave (e.g. Medical illness, family emergency, competition duty)..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Supporting Document URL / Medical Certificate
                </label>
                <input
                  type="url"
                  value={docUrl}
                  onChange={e => setDocUrl(e.target.value)}
                  placeholder="https://... (Medical slip or event invite link)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
