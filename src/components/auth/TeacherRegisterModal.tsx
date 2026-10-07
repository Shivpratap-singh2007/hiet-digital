import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, AlertTriangle, Briefcase, ArrowRight, Lock, Mail, ShieldCheck, UserCheck, Sparkles, Building2, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { TeacherMaster } from '../../types';
import { formatAuthError, normalizeAuthEmail, isValidAuthEmail } from '../../lib/authErrors';
import { PasswordInput, PasswordRules } from './PasswordInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherRegisterModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { verifyFaculty, registerTeacher, resendVerificationEmail } = useAuth();
  const isDemoAllowed = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' || import.meta.env.DEV || !isSupabaseConfigured;
  
  // Steps: 'verify' (Form) -> 'verified' (Confirmation Card) -> 'account' (Email & Password) -> 'verification_sent'
  const [step, setStep] = useState<'verify' | 'verified' | 'account' | 'verification_sent'>('verify');
  const [fullName, setFullName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [verifiedTeacher, setVerifiedTeacher] = useState<TeacherMaster | null>(null);
  
  // Account Creation Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification cooldown & resend states
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('verify');
    setFullName('');
    setFacultyId('');
    setVerifiedTeacher(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setRegisteredEmail('');
    setCooldown(0);
    setResending(false);
    setResendStatus(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Step 1: Verification of Full Name + Faculty ID against college records
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double click
    setError('');

    const cleanName = fullName.trim();
    const cleanId = facultyId.trim();

    if (!cleanName || !cleanId) {
      setError('Please enter both your Full Name and Faculty ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyFaculty(cleanId, cleanName);
      if (res.success && res.data) {
        setVerifiedTeacher(res.data);
        const teacherEmail = normalizeAuthEmail(res.data.college_email || (res.data as any).email);
        setEmail(teacherEmail);
        setStep('verified');
      } else {
        setError(res.error || 'Faculty verification failed.');
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Account Creation via Supabase Auth & DB-verified Role
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double click
    if (!verifiedTeacher) return;
    setError('');

    const normalizedEmail = normalizeAuthEmail(email);
    if (!normalizedEmail || !isValidAuthEmail(normalizedEmail)) {
      setError('Please enter a valid college email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[TeacherRegisterModal] Submitting registration with normalized email:', {
        original: email,
        normalized: normalizedEmail,
        length: normalizedEmail.length,
        charCodes: [...normalizedEmail].map(c => c.charCodeAt(0))
      });
    }

    setLoading(true);
    try {
      // Role is strictly locked and assigned by the verified database record
      const res = await registerTeacher(verifiedTeacher, password, normalizedEmail);
      if (res.success) {
        if (res.emailVerificationRequired) {
          setRegisteredEmail(normalizedEmail);
          setStep('verification_sent');
          setCooldown(60); // 60s cooldown timer
          setResendStatus({
            message: 'A verification link has been sent to your email. Please verify before signing in.',
            isError: false
          });
        } else {
          handleReset();
          onSuccess();
        }
      } else {
        setError(res.error || 'Account creation failed. Please try again.');
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendStatus(null);
    try {
      const targetEmail = normalizeAuthEmail(registeredEmail || email);
      const res = await resendVerificationEmail(targetEmail);
      if (res.success) {
        setCooldown(60);
        setResendStatus({
          message: 'A fresh verification link has been sent. Please check your inbox and spam folder.',
          isError: false
        });
      } else {
        setResendStatus({
          message: res.error || 'Unable to send verification email. Please try again later.',
          isError: true
        });
      }
    } catch (err: any) {
      setResendStatus({
        message: formatAuthError(err),
        isError: true
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#303030] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-[#242424] bg-slate-50/80 dark:bg-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full inline-block mb-0.5">
                WELCOME TO HIET
              </span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">Faculty Sign Up</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#282828] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && step !== 'verification_sent' && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-bold">Verification Error</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: VERIFICATION FORM (Full Name + Faculty ID) */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Official College Database Verification
                </span>
                Please enter your registered <strong>Full Name</strong> and unique <strong>Faculty ID</strong> as recorded in the HIET college database.
                <div className="mt-2 text-[11px] text-amber-800/90 dark:text-amber-300/90 font-medium border-t border-amber-200/60 dark:border-amber-900/60 pt-1.5">
                  ℹ️ <em>Role (Teacher or Head of Department) is securely determined by college records. Manual role selection is not permitted.</em>
                </div>
              </div>

              {/* 1. Full Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-300 dark:border-[#3a3a3a] bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#858585] font-semibold focus:outline-none focus:ring-2 focus:ring-[#d4d4d4] shadow-2xs"
                    required
                    autoFocus
                  />
                  <UserCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
                </div>
              </div>

              {/* 2. Unique Faculty ID Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Faculty ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={facultyId}
                    onChange={e => setFacultyId(e.target.value)}
                    placeholder="Enter your faculty ID"
                    className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-300 dark:border-[#3a3a3a] bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#858585] uppercase font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#d4d4d4] shadow-2xs"
                    required
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-[#242424]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#282828] dark:hover:text-[#f5f5f5] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#091a2b] dark:bg-amber-600 dark:hover:bg-amber-700 active:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
                >
                  {loading ? 'Verifying with Database...' : (
                    <>
                      Verify Faculty
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CONFIRMATION CARD (After Successful Verification) */}
          {step === 'verified' && verifiedTeacher && (
            <div className="space-y-4 animate-fade-in">
              {/* Verification Header Banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-950 dark:text-emerald-100 text-sm">Faculty Verified</h4>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Record matched and verified against HIET College Master Database
                  </p>
                </div>
              </div>

              {/* Verified Details Card */}
              <div className="bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#303030]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#a3a3a3] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    College Master Record (Database Source of Truth)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                    Status: Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 dark:text-[#858585] text-[10px] font-bold uppercase tracking-wider block">
                      Name
                    </span>
                    <span className="font-bold text-slate-900 dark:text-[#f5f5f5] text-sm">
                      {verifiedTeacher.full_name || verifiedTeacher.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-[#858585] text-[10px] font-bold uppercase tracking-wider block">
                      Faculty ID
                    </span>
                    <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                      {verifiedTeacher.faculty_id}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-[#858585] text-[10px] font-bold uppercase tracking-wider block">
                      Department
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-[#ededed] text-xs flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500 dark:text-[#a3a3a3]" />
                      {verifiedTeacher.department}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-[#858585] text-[10px] font-bold uppercase tracking-wider block">
                      Role
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold ${
                      (verifiedTeacher.role === 'hod' || verifiedTeacher.is_hod)
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-cyan-400 border border-blue-200 dark:border-blue-800'
                    }`}>
                      {(verifiedTeacher.role === 'hod' || verifiedTeacher.is_hod) ? 'HOD' : 'Teacher'}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200 dark:border-[#303030] text-xs text-slate-500 dark:text-[#a3a3a3]">
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 dark:text-[#858585]">
                    Designation
                  </span>
                  <span className="font-medium text-slate-700 dark:text-[#ededed]">
                    {verifiedTeacher.designation}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-[#242424]">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="text-xs text-slate-500 dark:text-[#a3a3a3] hover:text-slate-800 dark:hover:text-[#f5f5f5] font-semibold"
                >
                  ← Re-verify Record
                </button>
                <button
                  type="button"
                  onClick={() => setStep('account')}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ACCOUNT CREATION (Email & Password Setup) */}
          {step === 'account' && verifiedTeacher && (
            <form onSubmit={handleCreateAccount} className="space-y-4 animate-fade-in">
              <div className="p-3 bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block font-bold uppercase">
                    Account For
                  </span>
                  <span className="font-bold text-slate-800 dark:text-[#f5f5f5]">
                    {verifiedTeacher.full_name || verifiedTeacher.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-[#a3a3a3] ml-1">
                    ({verifiedTeacher.faculty_id})
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                  (verifiedTeacher.role === 'hod' || verifiedTeacher.is_hod)
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                }`}>
                  Role: {(verifiedTeacher.role === 'hod' || verifiedTeacher.is_hod) ? 'HOD' : 'Teacher'} (Database Locked)
                </span>
              </div>

              {/* Email / College Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email / College Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name.department@hiet.ac.in"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-[#3a3a3a] bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#858585] text-xs focus:ring-2 focus:ring-[#d4d4d4] focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              {/* Password Fields */}
              <PasswordInput
                id="new-password"
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a secure password (min 6 characters)"
                autoComplete="new-password"
                required
              />

              <PasswordInput
                id="confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />

              <PasswordRules />

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                🔒 <strong>Secure Authentication:</strong> Credentials are encrypted and handled via Supabase Authentication. Passwords are never stored in plain text or in the faculty directory table.
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-[#242424]">
                <button
                  type="button"
                  onClick={() => setStep('verified')}
                  className="text-xs text-slate-500 dark:text-[#a3a3a3] hover:text-slate-800 dark:hover:text-[#f5f5f5] font-semibold"
                >
                  ← Back to Verified Details
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {loading ? 'Creating Faculty Account...' : 'Complete Account Creation'}
                </button>
              </div>
            </form>
          )}

          {step === 'verification_sent' && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800 shadow-xs">
                  <Mail className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Verify Your Faculty Email</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  A verification link has been dispatched to:
                </p>
                <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 rounded-xl font-mono font-bold text-xs text-amber-900 dark:text-amber-300 inline-block px-4">
                  {registeredEmail || email}
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  Action Required
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                  Please check your inbox (and Spam/Junk folder) and click the verification link before logging in to your faculty account.
                </p>
              </div>

              {resendStatus && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  resendStatus.isError
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {resendStatus.isError ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{resendStatus.message}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-[#242424] space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-[#a3a3a3] font-medium">
                    Didn't receive the email?
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 dark:bg-[#242424] border-slate-200 dark:border-[#3a3a3a] text-slate-700 dark:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#2e2e2e] hover:text-slate-900 dark:hover:text-white"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-amber-600' : ''}`} />
                    <span>
                      {resending
                        ? 'Sending Email...'
                        : cooldown > 0
                        ? `Resend available in ${cooldown}s`
                        : 'Resend Verification Email'}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
