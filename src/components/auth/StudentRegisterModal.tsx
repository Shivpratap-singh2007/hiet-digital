import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, AlertTriangle, GraduationCap, ArrowRight, Lock, Phone, ShieldCheck, Mail, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { StudentMaster } from '../../types';
import { formatAuthError, normalizeAuthEmail, isValidAuthEmail } from '../../lib/authErrors';
import { PasswordInput, PasswordRules } from './PasswordInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentRegisterModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { verifyStudentRollNo, registerStudent, resendVerificationEmail } = useAuth();
  const isDemoAllowed = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' || import.meta.env.DEV || !isSupabaseConfigured;
  const [step, setStep] = useState<'verify' | 'confirm' | 'verification_sent'>('verify');
  const [rollNo, setRollNo] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<StudentMaster | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

  const handleClose = () => {
    setError('');
    setLoading(false);
    setResending(false);
    setResendStatus(null);
    onClose();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double click
    setError('');
    const cleanRoll = rollNo.trim().toUpperCase();
    if (!cleanRoll) {
      setError('Please enter your official HIET Roll Number.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyStudentRollNo(cleanRoll);
      if (res.success && res.data) {
        setVerifiedStudent(res.data);
        const studentEmail = normalizeAuthEmail(res.data.college_email || (res.data as any).email);
        setEmail(studentEmail);
        setPhone(res.data.phone || '');
        setStep('confirm');
      } else {
        setError(res.error || 'Student record not found. Please contact college administration.');
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double click
    if (!verifiedStudent) return;
    setError('');

    const normalizedEmail = normalizeAuthEmail(email);
    if (!normalizedEmail || !isValidAuthEmail(normalizedEmail)) {
      setError('Please enter a valid email address (e.g. aditya.cse002@hiet.ac.in or your personal Gmail).');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[StudentRegisterModal] Submitting registration with normalized email:', {
        original: email,
        normalized: normalizedEmail,
        length: normalizedEmail.length,
        charCodes: [...normalizedEmail].map(c => c.charCodeAt(0))
      });
    }

    setLoading(true);
    const updatedStudent: StudentMaster = {
      ...verifiedStudent,
      college_email: normalizedEmail,
      phone: phone.trim() || verifiedStudent.phone
    };

    try {
      const res = await registerStudent(updatedStudent, password, normalizedEmail);
      if (res.success) {
        if (res.emailVerificationRequired) {
          setRegisteredEmail(normalizedEmail);
          setStep('verification_sent');
          setCooldown(60); // 60s cooldown for resend
          setResendStatus({
            message: 'A verification link has been sent to your email. Please verify before signing in.',
            isError: false
          });
        } else {
          onSuccess();
          handleClose();
        }
      } else {
        setError(res.error || 'Registration failed. Please try again.');
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
            <div className="w-10 h-10 rounded-2xl bg-[#0f2942] dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-[#f5f5f5] text-base">Student Registration</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] font-medium">HIET Master Database Verification</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#262626] transition"
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
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] rounded-2xl text-xs text-slate-800 dark:text-[#d4d4d4] leading-relaxed">
                <span className="font-bold block mb-1 text-[#0f2942] dark:text-[#f5f5f5]">Enrolled Student Verification</span>
                Registration is restricted to enrolled students. Enter your university roll number to lookup your master academic record.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#d4d4d4] mb-1.5">
                  University Roll Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    placeholder="Enter University Roll Number"
                    className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-300 dark:border-[#3a3a3a] bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f5f5f5] uppercase font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0f2942] dark:focus:ring-[#d4d4d4] shadow-2xs"
                    required
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#091a2b] dark:bg-blue-600 dark:hover:bg-blue-700 active:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
                >
                  {loading ? 'Verifying...' : (
                    <>
                      <span>Verify Roll Number</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Student record verified in HIET Master Database!</span>
              </div>

              {/* Verified Identity Read-Only Summary as strictly required */}
              <div className="bg-slate-50 dark:bg-[#1f1f1f] rounded-2xl p-4 border border-slate-200 dark:border-[#303030] space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#303030]">
                  <span className="font-extrabold text-slate-900 dark:text-[#f5f5f5] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-white" />
                    Verified College Master Identity (Locked)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-[#282828] text-blue-800 dark:text-white font-mono font-extrabold text-[10px]">
                    {verifiedStudent?.roll_no}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Student Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{verifiedStudent?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Date of Birth</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{verifiedStudent?.dob}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Father's Name</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{verifiedStudent?.father_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Mother's Name</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{verifiedStudent?.mother_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Department & Branch</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{verifiedStudent?.department} • {verifiedStudent?.branch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Semester & Section</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">Sem {verifiedStudent?.semester} (Sec {verifiedStudent?.section})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-slate-400 text-[10px] block">College Email</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{verifiedStudent?.college_email}</span>
                </div>
              </div>

              {/* Step 3: Account Creation Credentials */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email / Gmail Address (Login ID)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com or college email"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-[#3a3a3a] bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f5f5f5] text-xs focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#d4d4d4] focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    You can use your personal Gmail or official HIET email address.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PasswordInput
                    id="new-password"
                    label="Create Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    required
                  />

                  <PasswordInput
                    id="confirm-password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <PasswordRules />

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 94180 XXXXX"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  ← Back to Roll No
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {loading ? 'Creating Account...' : 'Complete Account Creation'}
                </button>
              </div>
            </form>
          )}

          {step === 'verification_sent' && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-50 dark:bg-[#282828] text-blue-600 dark:text-white rounded-2xl flex items-center justify-center mx-auto border border-blue-100 dark:border-[#3a3a3a] shadow-xs">
                  <Mail className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-[#f5f5f5]">Verify Your Email Address</h4>
                <p className="text-xs text-slate-500 dark:text-[#a3a3a3] max-w-sm mx-auto leading-relaxed">
                  A verification link has been dispatched to:
                </p>
                <div className="p-2.5 bg-blue-50/70 dark:bg-[#1f1f1f] border border-blue-200/80 dark:border-[#303030] rounded-xl font-mono font-bold text-xs text-blue-900 dark:text-[#f5f5f5] inline-block px-4">
                  {registeredEmail || email}
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  Action Required
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                  Please check your inbox (and Spam/Junk folder) and click the verification link before logging in.
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

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Didn't receive the email?
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-blue-600' : ''}`} />
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
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
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
