import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Filter, 
  Search, 
  FileText, 
  X, 
  RefreshCw, 
  Check, 
  Building, 
  User, 
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../lib/supabase';
import { dataStore } from '../../lib/mockData';
import { AttendanceBatch } from '../../types';
import { formatIndiaDateTime } from '../../lib/utils';

interface Props {
  roleMode: 'hod' | 'principal' | 'md';
  department?: string;
  onNavigateTab?: (tab: any) => void;
}

export const AttendanceApprovalsView: React.FC<Props> = ({ roleMode, department, onNavigateTab }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [batches, setBatches] = useState<AttendanceBatch[]>(() => dataStore.getAttendanceBatches());
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchForRoster, setSelectedBatchForRoster] = useState<AttendanceBatch | null>(null);

  // Reject Modal state
  const [rejectingBatch, setRejectingBatch] = useState<AttendanceBatch | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load and subscribe to real-time batch updates
  const loadBatches = async () => {
    try {
      const data = await apiService.getAttendanceBatches();
      setBatches(data);
    } catch (e) {
      console.warn('Attendance approvals sync fallback:', e);
      setBatches(dataStore.getAttendanceBatches());
    }
  };

  useEffect(() => {
    loadBatches();
    const handleSync = () => loadBatches();
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-attendance-batch-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-attendance-batch-updated', handleSync);
    };
  }, []);

  // Filter batches according to role and department
  const filteredBatches = batches.filter(b => {
    // 1. Role-based department scoping for HOD
    if (roleMode === 'hod') {
      const hodDept = department || user?.department || user?.teacherMaster?.department || 'CSE';
      if (b.department !== hodDept && hodDept !== 'ALL') return false;
    }

    // 2. Queue filter
    if (activeTab === 'pending') {
      if (roleMode === 'hod') {
        return b.status === 'Pending HOD Approval';
      }
      if (roleMode === 'principal') {
        return b.status === 'Pending Principal Approval';
      }
      if (roleMode === 'md') {
        return b.status === 'Pending MD Approval';
      }
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = b.subject_name.toLowerCase().includes(q);
      const matchBatchId = b.id.toLowerCase().includes(q);
      const matchFac = b.faculty_name.toLowerCase().includes(q);
      const matchBranch = b.branch.toLowerCase().includes(q);
      if (!matchSub && !matchBatchId && !matchFac && !matchBranch) return false;
    }

    return true;
  });

  const pendingCountForRole = batches.filter(b => {
    if (roleMode === 'hod') {
      const hodDept = department || user?.department || user?.teacherMaster?.department || 'CSE';
      return b.status === 'Pending HOD Approval' && (b.department === hodDept || hodDept === 'ALL');
    }
    if (roleMode === 'principal') {
      return b.status === 'Pending Principal Approval';
    }
    if (roleMode === 'md') {
      return b.status === 'Pending MD Approval';
    }
    return false;
  }).length;

  // Handle Approve Action
  const handleApprove = async (batch: AttendanceBatch) => {
    const confirmMsg = roleMode === 'md'
      ? `Confirm Final Institutional Approval for ${batch.subject_name} (${batch.lecture_date})? This will archive official attendance records.`
      : `Approve attendance batch for ${batch.subject_name} and forward to next approval stage?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    const actorRole = roleMode === 'hod' ? 'hod' : roleMode === 'principal' ? 'principal' : 'md';
    const actorName = user?.name || (roleMode === 'hod' ? 'Head of Department' : roleMode === 'principal' ? 'Principal' : 'Managing Director');

    const result = await apiService.processAttendanceWorkflowAction({
      batchId: batch.id,
      action: 'approve',
      actorId: user?.id,
      actorName,
      actorRole,
      comments: `Approved by ${roleMode.toUpperCase()}`
    });

    setActionLoading(false);

    if (result.success) {
      toast.success(
        roleMode === 'md' ? 'Final Approval Granted' : 'Attendance Batch Approved',
        `Batch ${batch.id} has been successfully updated.`
      );
      if (selectedBatchForRoster?.id === batch.id) {
        setSelectedBatchForRoster(null);
      }
      await loadBatches();
    } else {
      toast.error('Approval Failed', result.error || 'Server error processing approval.');
    }
  };

  // Handle Reject Action (Mandatory Reason Required)
  const handleConfirmReject = async () => {
    if (!rejectingBatch) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection Reason Required', 'Please provide a clear reason for returning the attendance batch to the faculty member.');
      return;
    }

    setActionLoading(true);
    const actorRole = roleMode === 'hod' ? 'hod' : roleMode === 'principal' ? 'principal' : 'md';
    const actorName = user?.name || (roleMode === 'hod' ? 'Head of Department' : roleMode === 'principal' ? 'Principal' : 'Managing Director');

    const result = await apiService.processAttendanceWorkflowAction({
      batchId: rejectingBatch.id,
      action: 'reject',
      actorId: user?.id,
      actorName,
      actorRole,
      rejectionReason: rejectionReason.trim(),
      comments: `Returned for correction by ${roleMode.toUpperCase()}`
    });

    setActionLoading(false);
    setRejectingBatch(null);
    setRejectionReason('');

    if (result.success) {
      toast.warning(
        'Batch Returned for Correction',
        `Attendance submission ${rejectingBatch.id} has been returned to faculty ${rejectingBatch.faculty_name} with your comments.`
      );
      if (selectedBatchForRoster?.id === rejectingBatch.id) {
        setSelectedBatchForRoster(null);
      }
      await loadBatches();
    } else {
      toast.error('Rejection Failed', result.error || 'Server error processing rejection.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Final Approved':
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'Pending HOD Approval':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'Pending Principal Approval':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'Pending MD Approval':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'Returned for Correction':
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  const getRoleHeaderInfo = () => {
    if (roleMode === 'hod') {
      return {
        title: 'Department Attendance Approval Directorate',
        subtitle: `Stage 2 Review • Department of ${department || user?.department || 'CSE'}`,
        badge: 'HOD Executive Review',
        pendingStageName: 'Pending HOD Approval'
      };
    }
    if (roleMode === 'principal') {
      return {
        title: 'Institutional Attendance Review Directorate',
        subtitle: 'Stage 3 Review • Office of the Principal',
        badge: 'Principal Command Authority',
        pendingStageName: 'Pending Principal Approval'
      };
    }
    return {
      title: 'Managing Director Attendance Approval Directorate',
      subtitle: 'Stage 4 Final Sign-off • Executive Board Official Archival',
      badge: 'MD Final Approval',
      pendingStageName: 'Pending MD Approval'
    };
  };

  const info = getRoleHeaderInfo();

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0f2942]/10 dark:bg-blue-950/50 text-[#0f2942] dark:text-blue-300 border border-[#0f2942]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0f2942] dark:text-blue-400" />
            <span>{info.badge}</span>
            <span>•</span>
            <span>Faculty → HOD → Principal → MD</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {info.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            {info.subtitle}
          </p>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="text-xs font-bold text-slate-700 dark:text-neutral-300 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 transition shrink-0 cursor-pointer"
          >
            ← Back to Overview
          </button>
        )}
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Awaiting Your Action
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {pendingCountForRole}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Batches in Queue</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires official sign-off or return for correction</p>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Batches Registered
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {batches.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Recorded Classes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Institutional records across all departments</p>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Final Approved & Archived
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {batches.filter(b => b.status === 'Final Approved' || b.status === 'Approved').length}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Official Records</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Complete statutory compliance</p>
        </div>
      </div>

      {/* 3. Controls & Filter Strip */}
      <div className="p-3.5 bg-slate-50 dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tab switch: Pending vs All */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#0f2942] text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Action Required ({pendingCountForRole})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0f2942] text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All Records ({batches.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search subject, batch ID, or faculty..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* 4. Batches Roster Cards */}
      {filteredBatches.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 text-xs text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="font-extrabold text-sm text-slate-700 dark:text-neutral-200">
            No attendance batches pending review
          </p>
          <p className="text-slate-400">
            {activeTab === 'pending'
              ? 'Your review queue is completely clear. Newly submitted attendance batches will appear here.'
              : 'No records match the current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredBatches.map(batch => {
            const isAwaitingAction = 
              (roleMode === 'hod' && batch.status === 'Pending HOD Approval') ||
              (roleMode === 'principal' && batch.status === 'Pending Principal Approval') ||
              (roleMode === 'md' && batch.status === 'Pending MD Approval');

            return (
              <div
                key={batch.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border transition shadow-2xs space-y-3.5 ${
                  isAwaitingAction
                    ? 'border-blue-400/80 dark:border-blue-800 ring-2 ring-blue-500/10'
                    : 'border-slate-200 dark:border-neutral-800'
                }`}
              >
                {/* Top Info Strip */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                        {batch.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(batch.status)}`}>
                        {batch.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        Dept: {batch.department}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {batch.subject_name} ({batch.subject_code || 'CS-601'}) • {batch.branch} Sem {batch.semester} (Sec {batch.section})
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Conducted on <strong className="text-slate-800 dark:text-neutral-200">{batch.lecture_date}</strong> • Faculty: <strong className="text-slate-800 dark:text-neutral-200">{batch.faculty_name}</strong> • Submitted: {formatIndiaDateTime(batch.submitted_at)}
                    </p>
                  </div>

                  {/* Headcount Stat Pills */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <div className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-xl text-center min-w-[56px]">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Total</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-white">{batch.total_students}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center min-w-[56px]">
                      <span className="text-[9px] uppercase font-bold text-emerald-700 block">Present</span>
                      <span className="text-sm font-extrabold text-emerald-600">{batch.present_count}</span>
                    </div>
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-center min-w-[56px]">
                      <span className="text-[9px] uppercase font-bold text-rose-700 block">Absent</span>
                      <span className="text-sm font-extrabold text-rose-600">{batch.absent_count}</span>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center min-w-[56px]">
                      <span className="text-[9px] uppercase font-bold text-amber-700 block">Leave</span>
                      <span className="text-sm font-extrabold text-amber-600">{batch.leave_count}</span>
                    </div>
                  </div>
                </div>

                {/* 4-Stage Approval Progress Tracker */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                      1. Faculty Submitted
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Complete
                    </span>
                  </div>

                  <div className={`p-2 rounded-xl border ${
                    batch.status === 'Pending HOD Approval'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                      : ['Pending Principal Approval', 'Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800'
                      : batch.rejected_by_role === 'hod'
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800'
                      : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 text-slate-400'
                  }`}>
                    <span className="text-[10px] uppercase font-bold block">
                      2. HOD Review
                    </span>
                    <span className="text-[11px] font-extrabold flex items-center justify-center gap-1 mt-0.5">
                      {batch.status === 'Pending HOD Approval'
                        ? 'Pending Action'
                        : ['Pending Principal Approval', 'Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                        ? 'Approved'
                        : batch.rejected_by_role === 'hod'
                        ? 'Returned'
                        : 'Waiting'}
                    </span>
                  </div>

                  <div className={`p-2 rounded-xl border ${
                    batch.status === 'Pending Principal Approval'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                      : ['Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800'
                      : batch.rejected_by_role === 'principal'
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800'
                      : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 text-slate-400'
                  }`}>
                    <span className="text-[10px] uppercase font-bold block">
                      3. Principal Review
                    </span>
                    <span className="text-[11px] font-extrabold flex items-center justify-center gap-1 mt-0.5">
                      {batch.status === 'Pending Principal Approval'
                        ? 'Pending Action'
                        : ['Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                        ? 'Approved'
                        : batch.rejected_by_role === 'principal'
                        ? 'Returned'
                        : 'Waiting'}
                    </span>
                  </div>

                  <div className={`p-2 rounded-xl border ${
                    batch.status === 'Pending MD Approval'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : ['Approved', 'Final Approved'].includes(batch.status)
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800'
                      : batch.rejected_by_role === 'md'
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800'
                      : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 text-slate-400'
                  }`}>
                    <span className="text-[10px] uppercase font-bold block">
                      4. MD Final Sign-off
                    </span>
                    <span className="text-[11px] font-extrabold flex items-center justify-center gap-1 mt-0.5">
                      {batch.status === 'Pending MD Approval'
                        ? 'Pending Action'
                        : ['Approved', 'Final Approved'].includes(batch.status)
                        ? 'Final Approved'
                        : batch.rejected_by_role === 'md'
                        ? 'Returned'
                        : 'Waiting'}
                    </span>
                  </div>
                </div>

                {/* Rejection comment if returned */}
                {batch.rejection_reason && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
                    <strong className="block">Returned for Correction:</strong>
                    <p className="text-[11px] leading-relaxed italic">
                      &quot;{batch.rejection_reason}&quot;
                    </p>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setSelectedBatchForRoster(batch)}
                    className="text-xs font-bold text-slate-700 dark:text-neutral-300 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Review Detailed Student Roster ({batch.records.length} students)</span>
                  </button>

                  {/* Action buttons if awaiting review by this role */}
                  {isAwaitingAction && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          setRejectingBatch(batch);
                          setRejectionReason('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject / Return</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleApprove(batch)}
                        className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          roleMode === 'md'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-[#0f2942] hover:bg-[#163a5d]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{roleMode === 'md' ? 'Final Approve' : 'Approve & Forward'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. REJECT MODAL (MANDATORY REASON) */}
      {rejectingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <h3 className="text-sm font-extrabold">Return Attendance for Correction</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingBatch(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl space-y-1">
                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                  {rejectingBatch.id}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {rejectingBatch.subject_name} • {rejectingBatch.branch} Sem {rejectingBatch.semester} ({rejectingBatch.lecture_date})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Faculty: {rejectingBatch.faculty_name}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block mb-1">
                  Mandatory Rejection Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Specify the exact discrepancies or corrections required (e.g., student Ananya has an approved medical duty leave; please update from Absent to Leave before resubmitting)..."
                  rows={4}
                  className="w-full text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl p-2.5 focus:outline-none dark:text-white"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                This reason will be logged in the permanent audit trail and dispatched immediately to faculty <strong>{rejectingBatch.faculty_name}</strong> to allow correction and resubmission.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-neutral-800 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingBatch(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Return to Faculty</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DETAILED STUDENT ROSTER MODAL */}
      {selectedBatchForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#0f2942] text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/20">
                    {selectedBatchForRoster.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(selectedBatchForRoster.status)}`}>
                    {selectedBatchForRoster.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold mt-1">
                  {selectedBatchForRoster.subject_name} ({selectedBatchForRoster.lecture_date})
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedBatchForRoster.branch} Sem {selectedBatchForRoster.semester} Sec {selectedBatchForRoster.section} • Faculty: {selectedBatchForRoster.faculty_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatchForRoster(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Headcounts */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{selectedBatchForRoster.total_students}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                  <span className="text-[10px] uppercase font-bold block">Present</span>
                  <span className="text-base font-extrabold">{selectedBatchForRoster.present_count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700">
                  <span className="text-[10px] uppercase font-bold block">Absent</span>
                  <span className="text-base font-extrabold">{selectedBatchForRoster.absent_count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700">
                  <span className="text-[10px] uppercase font-bold block">Leave</span>
                  <span className="text-base font-extrabold">{selectedBatchForRoster.leave_count}</span>
                </div>
              </div>

              {/* Student Roster Table */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                  Student-wise Attendance Verification
                </h4>
                <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-800 font-bold border-b border-slate-200 dark:border-neutral-700">
                      <tr>
                        <th className="p-2.5">Roll No</th>
                        <th className="p-2.5">Student Full Name</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {selectedBatchForRoster.records.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-mono font-bold text-blue-700 dark:text-blue-400">
                            {r.student_roll}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white break-words">
                            {r.student_name}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              r.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : r.status === 'Absent'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-500">
                            {r.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* History trail */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                  Workflow History Log
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 dark:border-neutral-700 pl-3 ml-2">
                  {selectedBatchForRoster.history.map((h, i) => (
                    <div key={h.id || i} className="text-xs space-y-0.5 relative">
                      <div className="w-2 h-2 rounded-full bg-blue-600 absolute -left-[17px] top-1" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900 dark:text-white uppercase font-bold text-[11px]">
                          {h.action} by {h.actor_role} ({h.actor_name})
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {formatIndiaDateTime(h.created_at)}
                        </span>
                      </div>
                      {h.comments && (
                        <p className="text-[11px] text-slate-600 dark:text-neutral-400 italic">
                          &quot;{h.comments}&quot;
                        </p>
                      )}
                      {h.rejection_reason && (
                        <p className="text-[11px] text-rose-600 font-medium">
                          Reason: {h.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 dark:bg-neutral-800 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBatchForRoster(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Close View
              </button>

              {/* Direct Approve/Reject buttons from within the roster review modal */}
              {((roleMode === 'hod' && selectedBatchForRoster.status === 'Pending HOD Approval') ||
                (roleMode === 'principal' && selectedBatchForRoster.status === 'Pending Principal Approval') ||
                (roleMode === 'md' && selectedBatchForRoster.status === 'Pending MD Approval')) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingBatch(selectedBatchForRoster);
                      setRejectionReason('');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 hover:bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedBatchForRoster)}
                    className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5d] text-white text-xs font-bold cursor-pointer"
                  >
                    {roleMode === 'md' ? 'Final Approve' : 'Approve & Forward'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
