import React, { useState } from 'react';
import {
  User,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Bell,
  LogOut,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MapPin,
  Building2,
  BookOpen,
  Calendar,
  BarChart3,
  ChevronRight,
  Copy,
  Check,
  GraduationCap,
  FileText,
  GitBranch,
  CreditCard,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from './PageHeader';
import { DynamicQRCodeCanvas } from '../common/DynamicQRCodeCanvas';
import { PasswordInput, PasswordRules } from '../auth/PasswordInput';

interface Props {
  initialTab?: 'profile' | 'security' | 'notifications';
}

export const SettingsView: React.FC<Props> = ({ initialTab = 'profile' }) => {
  const { user, role, logout, changePassword } = useAuth();
  const isStudent = role === 'student' || user?.role === 'student';

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>(() => {
    if (isStudent && initialTab === 'security') {
      return 'profile';
    }
    return initialTab === ('appearance' as any) ? 'profile' : initialTab;
  });

  // Modals state
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notifications state
  const [notifAttendance, setNotifAttendance] = useState(true);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [notifNotices, setNotifNotices] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  // Dynamic user data extraction
  const student = user?.studentMaster;
  const teacher = user?.teacherMaster;

  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const rawId = student?.roll_no || teacher?.faculty_id || user?.id?.slice(0, 8) || '2026-002';
  
  // Format Institutional ID to match "HIET-CSE-2026-002"
  const rawStudentDept = student?.department || user?.department;
  const department = isStudent
    ? (rawStudentDept === 'ECE' ? 'B.Tech' : (rawStudentDept || 'B.Tech'))
    : (teacher?.department || user?.department || 'CSE');
  const branch = student?.branch || teacher?.department || 'ECE';
  const semester = student?.semester ? `Semester ${student.semester}` : 'Semester 1';

  const displayId = rawId.startsWith('HIET')
    ? rawId
    : `HIET-${branch}-2026-${rawId.replace(/[^0-9]/g, '').slice(-3) || '002'}`;

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
      case 'faculty':
        return 'Faculty Member';
      case 'student':
        return 'Student';
      case 'security_guard':
      case 'technical_staff':
        return 'Security Staff';
      default:
        return 'Student';
    }
  };

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(displayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudent) {
      setPasswordMsg({
        type: 'error',
        text: 'Access Denied: Student passwords are professionally managed by College IT Administration.'
      });
      return;
    }
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
    <div className="space-y-6 font-sans animate-fade-in max-w-5xl mx-auto px-1 sm:px-2">
      {/* 1. Header with Breadcrumbs & Responsive Sign Out Button */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'Account & Settings', active: true }
        ]}
        title="Settings & Institutional Profile"
        description={
          isStudent
            ? "Institutional identity verification, enrollment records, and alerts"
            : "Institutional identity verification, security credentials, and alerts"
        }
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ebf3fb] dark:bg-blue-950/70 text-[#1565c0] dark:text-sky-300 border border-[#cfe2f3] dark:border-blue-800 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-[#1565c0] dark:text-sky-400" />
            <span>{getRoleDisplay()}</span>
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400 transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Sign Out of Session"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        }
      />

      {/* 2. Redesigned Horizontal Settings Tabs */}
      <div className="bg-white dark:bg-[#141414] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0f2942] dark:text-sky-300 border-b-2 border-blue-600 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium'
          }`}
        >
          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${activeTab === 'profile' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-sky-400' : 'text-slate-400'}`}>
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span>My Institutional Profile</span>
        </button>

        {!isStudent && (
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0f2942] dark:text-sky-300 border-b-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium'
            }`}
          >
            <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Security & Password</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0f2942] dark:text-sky-300 border-b-2 border-blue-600 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium'
          }`}
        >
          <Bell className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Notifications</span>
        </button>
      </div>

      {/* 3. My Institutional Profile Tab (Reference UI Redesign) */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* DIGITAL STUDENT ID CARD (Main Focus) */}
          <div className="relative bg-gradient-to-br from-[#0c233c] via-[#0f2942] to-[#081726] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/60 overflow-hidden">
            {/* Campus Silhouette Background Overlay */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-3/5 bg-[url('/images/hiet_campus.jpg')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-overlay"
              aria-hidden="true" 
            />

            {/* Card Header: Institution, Location & Digital Pass Badge */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-extrabold tracking-wider text-white uppercase">
                  HIET GROUP OF <span className="text-sky-400 font-extrabold">INSTITUTIONS</span>
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Vidyanagar, Shahpur, Kangra (H.P.)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>DIGITAL PASS</span>
              </button>
            </div>

            {/* Student Identity: Avatar, White Name, Role, ID & Verified Badge */}
            <div className="mt-5 flex items-center gap-4 relative z-10">
              {/* Initials-based Avatar */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-md border border-white/20 select-none">
                {studentName.charAt(0).toUpperCase()}
              </div>

              {/* Identity Details */}
              <div className="min-w-0 flex-1">
                {/* Critical Text Requirement: Student Full Name is purely WHITE */}
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white truncate drop-shadow-xs">
                  {studentName}
                </h2>

                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-200 bg-blue-900/70 border border-blue-400/30 px-2 py-0.5 rounded-md">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{getRoleDisplay()}</span>
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-sky-200 font-medium">
                    <span>ID: {displayId}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="hover:text-white transition cursor-pointer p-0.5 text-sky-300"
                      title="Copy Institutional ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information: Structured 2-Column Grid */}
            <div className="mt-5 bg-slate-900/60 backdrop-blur-xs rounded-xl p-3.5 sm:p-4 border border-slate-700/60 grid grid-cols-2 gap-3.5 sm:gap-4 relative z-10">
              {/* Department */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/50 text-sky-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    DEPARTMENT
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">
                    {department}
                  </span>
                </div>
              </div>

              {/* Branch */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/50 text-sky-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    BRANCH
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">
                    {branch}
                  </span>
                </div>
              </div>

              {/* Semester */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/50 text-sky-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    SEMESTER
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">
                    {semester}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/50 text-sky-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    STATUS
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 block truncate mt-0.5">
                    Active / Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer: Cryptographic Record & View QR */}
            <div className="mt-5 pt-3.5 border-t border-slate-700/60 flex items-center justify-between text-xs relative z-10">
              <button
                type="button"
                onClick={() => setShowCryptoModal(true)}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition font-medium cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Institutional Cryptographic Record</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-1.5 text-sky-300 hover:text-sky-200 transition font-bold cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-sky-400 shrink-0" />
                <span>View QR</span>
                <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
              </button>
            </div>
          </div>

          {/* IDENTITY DETAILS SECTION (Clean White Card) */}
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3.5">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Identity Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verified enrollment & institutional records (Immutable)
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified</span>
              </div>
            </div>

            {/* Information Rows */}
            <div className="space-y-2.5 pt-1 text-xs">
              {/* 1. Full Legal Name */}
              <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block leading-tight">
                      Full Legal Name
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                      {studentName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Institutional Role */}
              <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block leading-tight">
                      Institutional Role
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                      {getRoleDisplay()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Institutional ID with Copy Button */}
              <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block leading-tight">
                      Institutional ID
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white block truncate mt-0.5">
                      {displayId}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                  title="Copy Institutional ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* 4. Department */}
              <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block leading-tight">
                      Department
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                      {department}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Branch */}
              <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block leading-tight">
                      Branch
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                      {branch}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory Immutable Notice */}
            <div className="p-3 bg-slate-50 dark:bg-[#181818] rounded-xl border border-slate-200 dark:border-[#303030] text-[11px] text-slate-500 dark:text-[#a3a3a3] flex items-start gap-2 mt-3">
              <AlertCircle className="w-4 h-4 text-slate-400 dark:text-[#858585] shrink-0 mt-0.5" />
              <span>
                To request modifications to verified name, department, or enrollment credentials, contact the Office of the Registrar or Dean Academics with valid documentary proof.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Security & Password Tab (Staff / Administration Only - Prohibited for Student Accounts) */}
      {!isStudent && activeTab === 'security' && (
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#0f2942] dark:text-[#f5f5f5]">Security & Authentication Credentials</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
              Update your password. Use at least 6 characters with a combination of letters and numbers.
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
              className="px-5 py-2.5 bg-[#0f2942] dark:bg-blue-600 hover:bg-[#0a1c2e] dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}

      {/* 5. Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-xl space-y-6">
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
              className="px-5 py-2.5 bg-[#0f2942] dark:bg-blue-600 hover:bg-[#0a1c2e] dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              Save Preferences
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: Digital QR Code Pass Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 my-auto animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official Digital Student Pass</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">HIET Institutional Cryptographic Identity</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <DynamicQRCodeCanvas 
                value={`https://hiet.ac.in/verify/id/${encodeURIComponent(displayId)}`} 
                size={200} 
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{studentName}</p>
              <p className="font-mono text-xs font-semibold text-blue-600 dark:text-sky-400">{displayId}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Department of {department} • Academic Session 2023 - 2027
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Institutional Cryptographic Record Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 my-auto animate-scale-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Institutional Cryptographic Record</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Tamper-Evident Institutional Enrollment Certificate</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCryptoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200/80 dark:border-slate-700/60 font-mono text-[11px]">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">SHA-256 DIGITAL FINGERPRINT</p>
                <p className="text-slate-900 dark:text-slate-100 break-all select-all font-semibold">
                  sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Issuing Authority</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">Registrar, HIET</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block truncate">Valid & Bound</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                This identity record is verified against the Himachal Pradesh Technical University (HPTU) academic master roster and cryptographically validated for campus gate access, exam hall entrance, and hostel residency.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCryptoModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Logout Confirmation Dialog */}
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
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-[#3a3a3a] text-slate-700 dark:text-[#f5f5f5] text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#282828] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
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
