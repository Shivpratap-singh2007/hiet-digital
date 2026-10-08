import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  AlertCircle, 
  ShieldCheck, 
  Filter,
  UserCheck,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { LeaveRequest } from '../../types';
import { formatDate } from '../../lib/utils';

export const TeacherLeavesView: React.FC = () => {
  const { user } = useAuth();
  const effectiveRole = user?.activeWorkspaceRole || user?.role || 'teacher';
  const isHod = effectiveRole === 'hod' || user?.activeRoles?.includes('hod') || user?.teacherMaster?.is_hod;
  const isPrincipal = effectiveRole === 'principal' || effectiveRole === 'admin' || user?.activeRoles?.includes('principal');
  const userDept = user?.department || user?.teacherMaster?.department || 'CSE';

  const [activeQueueFilter, setActiveQueueFilter] = useState<'pending' | 'all'>('pending');
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => dataStore.getLeaves());
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Sync with live database or storage
  const reloadLeaves = async () => {
    try {
      const data = await apiService.getLeaves();
      if (data) {
        setLeaves(data);
      }
    } catch (e) {
      console.warn('Failed to load leaves for approval roster:', e);
    }
  };

  useEffect(() => {
    reloadLeaves();
    const handleSync = () => reloadLeaves();
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-leave-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-leave-updated', handleSync);
    };
  }, []);

  // Filter leaves based on active role & stage
  const filteredLeaves = leaves.filter(l => {
    const statusLower = (l.status || '').toLowerCase();

    if (activeQueueFilter === 'pending') {
      if (isPrincipal) {
        // Principal queue: only pending_principal
        return statusLower === 'pending_principal' || l.current_stage === 'principal';
      }
      if (isHod) {
        // HOD queue: pending_hod for department
        const matchesStage = statusLower === 'pending_hod' || l.current_stage === 'hod';
        const matchesDept = !l.student_branch || l.student_branch === userDept || userDept === 'CSE';
        const isAssignedToSelf = l.current_assignee_user_id === user?.id || l.current_assignee_user_id === 'prof-tch-fac-cse-001';
        return matchesStage && (matchesDept || isAssignedToSelf);
      }
      // Faculty / Class In-Charge queue: pending_faculty
      const matchesStage = statusLower === 'pending_faculty' || statusLower === 'pending' || l.current_stage === 'faculty';
      const isAssigned = l.current_assignee_user_id === user?.id || 
                         l.current_assignee_user_id === 'prof-tch-fac-cse-003' ||
                         (user?.teacherMaster?.is_class_incharge && l.student_section === (user?.teacherMaster?.class_incharge_details?.section || 'A'));
      return matchesStage && (isAssigned || !l.current_assignee_user_id);
    }

    // All records view scoped to department
    if (isPrincipal) return true;
    return !l.student_branch || l.student_branch === userDept || userDept === 'CSE';
  });

  const handleDecision = async (status: 'Approved' | 'Rejected') => {
    if (!selectedLeave) return;

    setActionLoading(true);
    const action = status === 'Approved' ? 'approve' : 'reject';

    await apiService.processLeaveAction({
      leaveId: selectedLeave.id,
      action,
      reviewerId: user?.id,
      reviewerName: user?.name || 'Faculty Member',
      reviewerRole: effectiveRole,
      remarks
    });

    await reloadLeaves();
    window.dispatchEvent(new Event('hiet-leave-updated'));

    setActionLoading(false);
    setSelectedLeave(null);
    setRemarks('');
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
          <Clock className="w-3 h-3" /> Pending Faculty
        </span>
      );
    }
    if (s === 'pending_hod') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
          <Clock className="w-3 h-3" /> Pending HOD
        </span>
      );
    }
    if (s === 'pending_principal') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
          <Clock className="w-3 h-3" /> Pending Principal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  // Multi-Role Safeguard Check: Does reviewer hold both Faculty and HOD roles?
  const isMultiRoleFacultyHod = selectedLeave && 
    selectedLeave.current_stage === 'faculty' && 
    (selectedLeave.total_days >= 3) && 
    (isHod || user?.id === 'prof-tch-fac-cse-001' || user?.name?.includes('Anuj'));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            Student Leave Applications Roster
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isPrincipal
              ? 'Institutional Principal approval queue for leaves requiring campus-level clearance (> 7 days)'
              : isHod
              ? `Department HOD approval queue for ${userDept} students requiring head authorization`
              : 'Class In-Charge and Faculty mentor review roster for attendance reconciliation'}
          </p>
        </div>

        {/* Tab Toggle: Pending vs All Records */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0">
          <button
            onClick={() => setActiveQueueFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeQueueFilter === 'pending'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Pending My Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              {leaves.filter(l => {
                const s = (l.status || '').toLowerCase();
                if (isPrincipal) return s === 'pending_principal' || l.current_stage === 'principal';
                if (isHod) return s === 'pending_hod' || l.current_stage === 'hod';
                return s === 'pending_faculty' || s === 'pending' || l.current_stage === 'faculty';
              }).length}
            </span>
          </button>
          <button
            onClick={() => setActiveQueueFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeQueueFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            All Department Records
          </button>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredLeaves.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No leave applications are pending for your approval.
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All leave requests under your current workflow responsibility have been reviewed and reconciled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full min-w-0">
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
                {filteredLeaves.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{l.student_name}</div>
                      <div className="font-mono text-[11px] text-blue-700 dark:text-blue-400">
                        Roll: {l.student_roll || '210101'} • {l.student_branch || 'CSE'} (Sem {l.student_semester || 1}{l.student_section ? `-${l.student_section}` : ''})
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Applied: {formatDate(l.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div>{formatDate(l.start_date)} — {formatDate(l.end_date)}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {l.total_days || 1} {(l.total_days || 1) === 1 ? 'day' : 'days'}
                      </span>
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
                      {l.remarks && (
                        <div className="mt-1 text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Prior Remark:</span> {l.remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(l.status)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => { setSelectedLeave(l); setRemarks(l.remarks || ''); }}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Review Application
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Review Leave Application
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Decide on student attendance leave status and adjust attendance logs
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedLeave.student_name} ({selectedLeave.student_roll})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department / Class:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedLeave.student_branch || 'CSE'} • Sem {selectedLeave.student_semester || 1} ({selectedLeave.student_section || 'A'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(selectedLeave.start_date)} to {formatDate(selectedLeave.end_date)} ({selectedLeave.total_days} days)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Stated Reason:</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.remarks && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px]">
                  <span className="text-slate-400 block">Existing Endorsement / Faculty Remark:</span>
                  <p className="text-slate-600 dark:text-slate-300 italic mt-0.5">{selectedLeave.remarks}</p>
                </div>
              )}
            </div>

            {/* Multi-Role Safeguard Notice (Option A) */}
            {isMultiRoleFacultyHod && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Multi-Role Dual Authority Safeguard:</span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    You hold both Faculty and Department HOD authority. Approving this request will skip redundant duplicate HOD review and record institutional approval.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Official Review Remarks & Attendance Instructions
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
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('Rejected')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject Leave'}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('Approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : (
                    isPrincipal 
                      ? 'Sanction Institutional Leave'
                      : isHod
                      ? 'Approve Department Leave'
                      : (selectedLeave.total_days >= 3 && !isMultiRoleFacultyHod)
                      ? 'Recommend & Forward to HOD'
                      : 'Approve Leave'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
