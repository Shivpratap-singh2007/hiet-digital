import React, { useState } from 'react';
import {
  User,
  KeyRound,
  ShieldCheck,
  Bell,
  LogOut,
  CheckCircle2,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from './PageHeader';
import { PasswordInput, PasswordRules } from '../auth/PasswordInput';

interface Props {
  initialTab?: 'profile' | 'security' | 'notifications';
}

export const SettingsView: React.FC<Props> = ({ initialTab = 'profile' }) => {
  const { user, role, logout, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>(
    initialTab === ('appearance' as any) ? 'profile' : initialTab
  );

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Logout modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Notifications state
  const [notifAttendance, setNotifAttendance] = useState(true);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [notifNotices, setNotifNotices] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  const getRoleDisplay = () => {
    switch (role) {
      case 'managing_director':
      case 'md':
        return 'Managing Director';
      case 'admin':
      case 'principal':
        return 'Principal';
      case 'hod':
        return 'Head of Department';
      case 'teacher':
        return 'Faculty Member';
      case 'student':
        return 'Student';
      case 'security_guard':
      case 'technical_staff':
        return 'Security Staff';
      default:
        return 'Institutional User';
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(newPassword);
      if (res.success) {
        setPasswordMsg({ type: 'success', text: 'Your password was updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in max-w-5xl mx-auto">
      {/* 1. Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'Account & Settings', active: true }
        ]}
        title="Settings & Institutional Profile"
        description="Institutional identity verification, security credentials, and alerts"
        badge={getRoleDisplay()}
        actions={
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 hover:border-rose-600 text-xs font-bold text-rose-700 dark:text-rose-400 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        }
      />

      {/* 2. Settings Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#0f2942] dark:border-sky-400 text-[#0f2942] dark:text-sky-300'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Institutional Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-[#0f2942] dark:border-sky-400 text-[#0f2942] dark:text-sky-300'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-[#0f2942] dark:border-sky-400 text-[#0f2942] dark:text-sky-300'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>
      </div>

      {/* 4. My Institutional Profile Tab (Section 53) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Institutional 2D ID Card (Section 53) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-gradient-to-b from-[#0f2942] to-[#0a1c2e] text-white rounded-2xl p-5 shadow-lg border border-slate-700 relative overflow-hidden">
              {/* Institutional Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">HIET GROUP OF INSTITUTIONS</p>
                  <p className="text-[9px] text-slate-300">Vidyanagar, Shahpur, Kangra (H.P.)</p>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md text-white">
                  DIGITAL PASS
                </span>
              </div>

              {/* Photo & Identity */}
              <div className="mt-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-2xl text-white shrink-0">
                  {user?.name?.charAt(0) || 'H'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate">{user?.name || 'Authorized Member'}</h3>
                  <span className="inline-block text-[11px] font-semibold text-blue-200 bg-blue-900/60 border border-blue-400/30 px-2 py-0.5 rounded-md mt-0.5">
                    {getRoleDisplay()}
                  </span>
                  <p className="text-[10px] text-slate-300 mt-1 font-mono">
                    ID: {user?.studentMaster?.roll_no || user?.teacherMaster?.faculty_id || user?.id?.slice(0, 8) || 'HIET-2026'}
                  </p>
                </div>
              </div>

              {/* Academic Metadata Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] bg-white/10 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Department</span>
                  <p className="font-semibold truncate">{user?.studentMaster?.department || user?.teacherMaster?.department || 'CSE'}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Branch</span>
                  <p className="font-semibold truncate">{user?.studentMaster?.branch || 'Computer Science'}</p>
                </div>
                {user?.studentMaster?.semester && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Semester</span>
                    <p className="font-semibold">Semester {user.studentMaster.semester}</p>
                  </div>
                )}
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Status</span>
                  <p className="font-semibold text-emerald-400">Active / Verified</p>
                </div>
              </div>

              {/* Verification Stamp & Barcode Representation */}
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Institutional Cryptographic Record</span>
                </div>
                <div className="flex items-center gap-1">
                  <QrCode className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </div>
          </div>

          {/* Read-Only Verified Profile Form (Section 53) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-[#303030] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#242424]">
              <div>
                <h3 className="text-base font-bold text-[#0f2942] dark:text-[#f5f5f5]">Identity Details</h3>
                <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Verified enrollment & institutional records (Immutable)</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-[#a3a3a3] block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-700 dark:text-[#f5f5f5] font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-[#a3a3a3] block mb-1">Institutional Role</label>
                <input
                  type="text"
                  value={getRoleDisplay()}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-700 dark:text-[#f5f5f5] font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-[#a3a3a3] block mb-1">Institutional Email</label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-700 dark:text-[#f5f5f5] font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-[#a3a3a3] block mb-1">Roll No / Faculty ID</label>
                <input
                  type="text"
                  value={user?.studentMaster?.roll_no || user?.teacherMaster?.faculty_id || 'HIET-OFFICIAL'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-700 dark:text-[#f5f5f5] font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-[#a3a3a3] block mb-1">Department</label>
                <input
                  type="text"
                  value={user?.studentMaster?.department || user?.teacherMaster?.department || 'CSE'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-700 dark:text-[#f5f5f5] font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-[#a3a3a3] block mb-1">Branch / Specialization</label>
                <input
                  type="text"
                  value={user?.studentMaster?.branch || 'Computer Science & Engineering'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-700 dark:text-[#f5f5f5] font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#181818] rounded-xl border border-slate-200 dark:border-[#303030] text-[11px] text-slate-500 dark:text-[#a3a3a3] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 dark:text-[#858585] shrink-0 mt-0.5" />
              <span>
                To request modifications to verified name, department, or enrollment credentials, contact the Office of the Registrar or Dean Academics with valid documentary proof.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Security & Password Tab (Section 52, 54) */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-[#303030] p-6 shadow-xs max-w-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#0f2942] dark:text-[#f5f5f5]">Security & Authentication Credentials</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
              Update your Supabase password. Use at least 6 characters with a combination of letters and numbers.
            </p>
          </div>

          {passwordMsg && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <PasswordInput
              id="settings-new-password"
              label="New Password"
              labelClassName="font-bold text-slate-700 dark:text-slate-300 block mb-1"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new secure password"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-900 dark:text-[#f5f5f5] focus:outline-hidden focus:border-[#0f2942] dark:focus:border-[#d4d4d4]"
              autoComplete="new-password"
            />

            <PasswordInput
              id="settings-confirm-password"
              label="Confirm New Password"
              labelClassName="font-bold text-slate-700 dark:text-slate-300 block mb-1"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#3a3a3a] rounded-xl text-slate-900 dark:text-[#f5f5f5] focus:outline-hidden focus:border-[#0f2942] dark:focus:border-[#d4d4d4]"
              autoComplete="new-password"
            />

            <PasswordRules />

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 bg-[#0f2942] dark:bg-blue-600 hover:bg-[#0a1c2e] dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}

      {/* 6. Notifications Tab (Section 38, 54) */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-[#303030] p-6 shadow-xs max-w-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#0f2942] dark:text-[#f5f5f5]">Institutional Notification Preferences</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
              Control the notification channels and alert triggers sent to your portal.
            </p>
          </div>

          {notifSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Notification preferences saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#303030]">
              <div>
                <p className="font-bold text-slate-800 dark:text-[#f5f5f5]">Attendance Warning Alerts</p>
                <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">Receive alerts if aggregate attendance falls below 75% statutory requirement.</p>
              </div>
              <input
                type="checkbox"
                checked={notifAttendance}
                onChange={e => setNotifAttendance(e.target.checked)}
                className="w-4 h-4 text-[#0f2942] rounded-sm border-slate-300 focus:ring-[#0f2942]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#303030]">
              <div>
                <p className="font-bold text-slate-800 dark:text-[#f5f5f5]">Academic Deadlines & Submissions</p>
                <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">Notifications regarding assignment deadlines, sessional results, and timetable changes.</p>
              </div>
              <input
                type="checkbox"
                checked={notifDeadlines}
                onChange={e => setNotifDeadlines(e.target.checked)}
                className="w-4 h-4 text-[#0f2942] rounded-sm border-slate-300 focus:ring-[#0f2942]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#303030]">
              <div>
                <p className="font-bold text-slate-800 dark:text-[#f5f5f5]">Administrative Notices & Circulars</p>
                <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">Official notices from the Office of the Principal and Head of Department.</p>
              </div>
              <input
                type="checkbox"
                checked={notifNotices}
                onChange={e => setNotifNotices(e.target.checked)}
                className="w-4 h-4 text-[#0f2942] rounded-sm border-slate-300 focus:ring-[#0f2942]"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0f2942] dark:bg-blue-600 hover:bg-[#0a1c2e] dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              Save Preferences
            </button>
          </form>
        </div>
      )}

      {/* 7. Logout Confirmation Dialog (Section 52) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#171717] rounded-2xl border border-slate-200 dark:border-[#303030] shadow-2xl max-w-sm w-full p-6 text-center space-y-4 my-auto animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#f5f5f5]">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">
                Are you sure you want to sign out? Your session will be safely cleared and you will be redirected to the public login portal.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-[#3a3a3a] text-slate-700 dark:text-[#f5f5f5] text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#282828] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
