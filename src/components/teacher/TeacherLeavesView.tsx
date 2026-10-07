import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, FileText, AlertCircle, MessageSquare } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { LeaveRequest } from '../../types';
import { formatDate } from '../../lib/utils';

export const TeacherLeavesView: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => dataStore.getLeaves());
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleDecision = async (status: 'Approved' | 'Rejected') => {
    if (!selectedLeave) return;

    setActionLoading(true);
    await apiService.updateLeaveStatus(
      selectedLeave.id,
      status,
      user?.name || 'Faculty Member',
      remarks
    );

    setLeaves(prev => prev.map(l => 
      l.id === selectedLeave.id ? { ...l, status, remarks, reviewed_by_name: user?.name } : l
    ));
    setActionLoading(false);
    setSelectedLeave(null);
    setRemarks('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          Student Leave Applications Roster
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review leave justifications, inspect supporting documentation, and approve or reject with academic remarks
        </p>
      </div>

      {/* Leaves Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Reason & Document</th>
              <th className="px-4 py-3">Current Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {leaves.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{l.student_name}</div>
                  <div className="font-mono text-[11px] text-blue-700 dark:text-blue-400">
                    Roll: {l.student_roll || '210101'} • {l.student_branch || 'CSE'}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  {formatDate(l.start_date)} — {formatDate(l.end_date)}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="line-clamp-2 text-slate-600 dark:text-slate-300">{l.reason}</p>
                  {l.document_url && (
                    <a
                      href={l.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-1 hover:underline"
                    >
                      <FileText className="w-3 h-3" /> View Supporting Slip
                    </a>
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
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => { setSelectedLeave(l); setRemarks(l.remarks || ''); }}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 rounded-lg text-xs font-semibold transition"
                  >
                    Review Application
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Review Leave Application
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Decide on student attendance leave status
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLeave.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-semibold">{selectedLeave.start_date} to {selectedLeave.end_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Stated Reason:</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedLeave.reason}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Review Remarks
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Approved with duty leave credit for technical fest, or Medical verification verified."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('Rejected')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Reject Leave
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('Approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Approve Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
