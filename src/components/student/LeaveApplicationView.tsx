import React, { useState } from 'react';
import { Clock, Plus, CheckCircle2, XCircle, AlertCircle, FileText, Calendar, Upload } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { LeaveRequest } from '../../types';
import { formatDate } from '../../lib/utils';

export const LeaveApplicationView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || 'std-210101';
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() =>
    dataStore.getLeaves().filter(l => l.student_id === studentId)
  );

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    setSubmitting(true);
    const newLeave = await apiService.submitLeaveRequest({
      student_id: studentId,
      student_name: user?.name,
      student_roll: user?.studentMaster?.roll_no,
      student_branch: user?.studentMaster?.branch,
      student_semester: user?.studentMaster?.semester,
      start_date: startDate,
      end_date: endDate,
      reason,
      document_url: docUrl || 'https://example.com/docs/medical_leave_supporting.pdf'
    });

    setLeaves(prev => [newLeave, ...prev]);
    setSubmitting(false);
    setShowApplyModal(false);
    setStartDate('');
    setEndDate('');
    setReason('');
    setDocUrl('');
  };

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
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
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
            {leaves.filter(l => l.status === 'Approved').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Attendance adjusted as excused</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">Under Review</span>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {leaves.filter(l => l.status === 'Pending').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Awaiting faculty/HOD decision</p>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Leave Request Log & Tracking
          </h3>
        </div>

        {/* Mobile View: Cards list (< sm) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700/50 p-3 space-y-2.5">
          {leaves.map(l => (
            <div key={l.id} className="p-3.5 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 w-full">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Applied {formatDate(l.created_at)}</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                    {formatDate(l.start_date)} — {formatDate(l.end_date)}
                  </h4>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                  l.status === 'Approved'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : l.status === 'Pending'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                }`}>
                  {l.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                  {l.status === 'Pending' && <Clock className="w-3 h-3" />}
                  {l.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                  {l.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="line-clamp-2">{l.reason}</p>
                {l.document_url && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                    <FileText className="w-3 h-3" /> Supporting Doc Attached
                  </span>
                )}
              </div>

              {l.remarks ? (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Remark:</span> {l.remarks}
                  {l.reviewed_by_name && <span className="text-slate-400"> ({l.reviewed_by_name})</span>}
                </div>
              ) : (
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-400 italic">
                  Pending faculty mentor review
                </div>
              )}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {leaves.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 text-slate-500">{formatDate(l.created_at)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(l.start_date)} — {formatDate(l.end_date)}
                  </td>
                  <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-2">{l.reason}</p>
                    {l.document_url && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                        <FileText className="w-3 h-3" /> Supporting Doc Attached
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      l.status === 'Approved'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : l.status === 'Pending'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    }`}>
                      {l.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                      {l.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {l.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {l.remarks ? (
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{l.remarks}</p>
                        {l.reviewed_by_name && (
                          <span className="text-[10px] text-slate-400">— {l.reviewed_by_name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending mentor review</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
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
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg"
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
