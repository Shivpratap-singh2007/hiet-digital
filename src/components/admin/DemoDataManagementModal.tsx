import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Download, 
  Archive, 
  UserX, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { apiService } from '../../lib/supabase';
import { isProduction, getAppEnvironment } from '../../lib/envConfig';

interface DemoDataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const DemoDataManagementModal: React.FC<DemoDataManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    demoStudentsCount: number;
    demoFacultyCount: number;
    demoAttendanceCount: number;
    demoMarksCount: number;
    isDemoAccountsDisabled: boolean;
    isDemoArchived: boolean;
    dataEnvironment: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = () => {
    try {
      const s = apiService.getDemoStats();
      setStats(s);
    } catch (err: any) {
      console.error('Error fetching demo stats:', err);
    }
  };

  if (!isOpen) return null;

  const currentEnv = getAppEnvironment();

  if (isProduction()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Action Restricted in Production
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Demo data management is disabled in production to protect live institutional records.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleExportBackup = () => {
    try {
      const backupData = apiService.exportDemoBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hiet_demo_data_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: 'Demo dataset backup exported successfully as JSON.'
      });
      if (onSuccess) onSuccess('Demo dataset backup downloaded');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Export failed' });
    }
  };

  const handleDisableAccounts = async () => {
    if (!window.confirm('Are you sure you want to disable all demo accounts? They will no longer be able to log in.')) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await apiService.disableDemoAccounts();
      loadStats();
      setFeedback({
        type: 'success',
        message: `Successfully disabled ${res.disabledStudents} demo students and ${res.disabledFaculty} demo faculty members.`
      });
      if (onSuccess) onSuccess('Demo accounts disabled');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveRecords = async () => {
    if (!window.confirm('Archive current demo records? A snapshot will be preserved in archival storage.')) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await apiService.archiveDemoRecords();
      loadStats();
      setFeedback({
        type: 'success',
        message: `Archived ${res.recordsArchived} demo records at ${new Date(res.archiveTimestamp).toLocaleTimeString()}.`
      });
      if (onSuccess) onSuccess('Demo records archived');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Archival failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Demo Data Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Environment: <span className="capitalize font-semibold text-amber-600 dark:text-amber-400">{currentEnv}</span> • Safe staging before real imports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mt-4 p-3.5 rounded-xl text-sm flex items-start space-x-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : (
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Students</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.demoStudentsCount ?? 20}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Demo Records</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Faculty</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.demoFacultyCount ?? 6}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Demo Records</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Attendance</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.demoAttendanceCount ?? 50}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Mock Entries</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Marks</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {stats?.demoMarksCount ?? 30}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Sample Marks</span>
          </div>
        </div>

        {/* Status flags */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1 mb-5">
          <div className="flex items-center justify-between">
            <span>Demo Accounts Status:</span>
            <span className="font-semibold">
              {stats?.isDemoAccountsDisabled ? 'Disabled (Logins Blocked)' : 'Active (Available for testing)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Archival Status:</span>
            <span className="font-semibold">
              {stats?.isDemoArchived ? 'Snapshot Archived' : 'Not Archived'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleExportBackup}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-medium text-sm transition"
          >
            <div className="flex items-center space-x-3 text-left">
              <Download className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="block font-semibold">Export Demo Backup</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Download entire demo dataset as JSON</span>
              </div>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Download</span>
          </button>

          <button
            onClick={handleDisableAccounts}
            disabled={loading || stats?.isDemoAccountsDisabled}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition ${
              stats?.isDemoAccountsDisabled
                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
            }`}
          >
            <div className="flex items-center space-x-3 text-left">
              <UserX className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="block font-semibold">Disable Demo Accounts</span>
                <span className="text-xs text-rose-600/80 dark:text-rose-400/80">Prevent login using demo credentials</span>
              </div>
            </div>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <span className="text-xs font-semibold">
                {stats?.isDemoAccountsDisabled ? 'Already Disabled' : 'Disable'}
              </span>
            )}
          </button>

          <button
            onClick={handleArchiveRecords}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-medium text-sm transition"
          >
            <div className="flex items-center space-x-3 text-left">
              <Archive className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="block font-semibold">Archive Demo Records</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Create permanent recovery snapshot</span>
              </div>
            </div>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Archive</span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
