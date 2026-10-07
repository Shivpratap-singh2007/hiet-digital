import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  Lock, 
  User, 
  AlertCircle, 
  RefreshCw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatAuthError } from '../../lib/authErrors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenStudentRegister: () => void;
  onOpenTeacherRegister: () => void;
  initialRole?: string;
}

export const LoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenStudentRegister,
  onOpenTeacherRegister
}) => {
  const { login, resendVerificationEmail } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Email verification cooldown & resend states
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIdentifier('');
      setPassword('');
      setResendStatus(null);
      setShowForgotPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your University Roll No, Faculty ID, or College Email.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setError('');
    setResendStatus(null);
    setLoading(true);

    try {
      const res = await login(cleanId, password);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    const cleanId = identifier.trim();
    if (!cleanId) {
      setResendStatus({
        message: 'Please enter your roll number, faculty ID, or email above first.',
        isError: true
      });
      return;
    }
    setResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerificationEmail(cleanId);
      if (res.success) {
        setCooldown(60);
        setResendStatus({
          message: 'A fresh verification email has been dispatched. Please check your inbox.',
          isError: false
        });
      } else {
        setResendStatus({
          message: res.error || 'Failed to resend verification email.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-auto max-h-[94vh] flex flex-col font-sans">
        
        {/* Institutional Header Banner */}
        <div className="pt-6 pb-4 px-6 border-b border-slate-100 flex flex-col items-center text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Official HIET Crest */}
          <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 flex items-center justify-center shadow-2xs mb-2.5">
            {!logoError ? (
              <img
                src="/images/hiet_crest.png"
                alt="HIET Crest"
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-[#0f2942] flex items-center justify-center text-white font-extrabold text-base">
                H
              </div>
            )}
          </div>

          {/* Official Institution Name & Address */}
          <h2 className="font-extrabold text-[#0f2942] text-base tracking-tight leading-tight">
            HIET GROUP OF INSTITUTIONS
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Vidyanagar, Shahpur, Distt. Kangra (H.P.)
          </p>

          <div className="w-12 h-0.5 bg-slate-200 mt-3 mb-2 rounded-full" />

          {/* Sign In Header */}
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Sign In
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Access your verified HIET Digital Campus account
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {(error.toLowerCase().includes('not yet activated') ||
                error.toLowerCase().includes('not been activated yet') ||
                error.toLowerCase().includes('sign up below')) && (
                <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 font-medium">Account not activated?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStudentRegister();
                    }}
                    className="px-3 py-1.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Activate Account →</span>
                  </button>
                </div>
              )}
              {(error.toLowerCase().includes('not yet verified') ||
                error.toLowerCase().includes('email not confirmed') ||
                error.toLowerCase().includes('verification link') ||
                error.toLowerCase().includes('verification')) && (
                <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700">Need a fresh verification link?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="px-3 py-1.5 bg-white hover:bg-rose-100/80 border border-rose-300 text-rose-800 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    <span>
                      {resending
                        ? 'Sending...'
                        : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : 'Resend Verification Email'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {resendStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              resendStatus.isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {resendStatus.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{resendStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Roll / Enrollment No / Faculty ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. 210106, FAC001, or name@hiet.ac.in"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:border-[#0f2942] focus:ring-1 focus:ring-[#0f2942] focus:outline-hidden"
                  autoFocus
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:border-[#0f2942] focus:ring-1 focus:ring-[#0f2942] focus:outline-hidden"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Primary Navy Button: LOGIN */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-extrabold tracking-wider uppercase rounded-xl shadow-xs transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>LOGIN</span>
                </>
              )}
            </button>
          </form>

          {/* Under the login button: Forgot Password? */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-slate-500 hover:text-[#0f2942] font-semibold hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Links for Students & Faculty */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-center">
            <div>
              <span className="text-slate-500">New Student? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudentRegister();
                }}
                className="font-bold text-[#0f2942] hover:underline"
              >
                Verify & Sign Up
              </button>
            </div>

            <div>
              <span className="text-slate-500">Faculty member? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTeacherRegister();
                }}
                className="font-bold text-[#0f2942] hover:underline"
              >
                Faculty verification / sign-in flow
              </button>
            </div>
          </div>

          {/* Forgot Password Note */}
          {showForgotPassword && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs animate-fade-in text-slate-700 text-left">
              <div className="font-bold text-slate-900">Forgot Password Assistance</div>
              <p className="text-[11px] leading-relaxed">
                Please contact your department HOD or the college administrative records desk with your roll number or faculty ID to receive a temporary reset password.
              </p>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-[11px] font-bold text-[#0f2942] hover:underline mt-1 block"
              >
                Dismiss
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
