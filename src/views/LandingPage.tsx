import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  AlertCircle, 
  LogIn, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAuthError } from '../lib/authErrors';

interface Props {
  onOpenLogin?: () => void;
  onOpenStudentRegister: () => void;
  onOpenTeacherRegister: () => void;
  onOpenGallery?: () => void;
}

export const LandingPage: React.FC<Props> = ({
  onOpenStudentRegister,
  onOpenTeacherRegister
}) => {
  const { login, resendVerificationEmail } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // About & Contact Modals
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Email verification cooldown & resend states
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
      if (!res.success) {
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-[#0f2942] selection:text-white">
      
      {/* 1. PUBLIC INSTITUTIONAL HEADER (Section 4) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: HIET Logo & Institution Name */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
              {!logoError ? (
                <img
                  src="/images/hiet_crest.png"
                  alt="HIET Crest"
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-[#0f2942] flex items-center justify-center text-white font-extrabold text-sm">
                  H
                </div>
              )}
            </div>
            <div>
              <span className="font-extrabold text-[#0f2942] text-sm sm:text-base tracking-tight block leading-tight">
                HIET GROUP OF INSTITUTIONS
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Vidyanagar, Shahpur, Distt. Kangra (H.P.)
              </span>
            </div>
          </div>

          {/* Right: Clean, un-overloaded header controls */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setShowAbout(true)}
              className="text-slate-600 hover:text-[#0f2942] font-semibold px-2 py-1 transition"
            >
              About
            </button>
            <button
              onClick={() => setShowContact(true)}
              className="text-slate-600 hover:text-[#0f2942] font-semibold px-2 py-1 transition"
            >
              Contact
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('login-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold rounded-xl shadow-xs transition"
            >
              Sign In
            </button>
          </div>

        </div>
      </header>

      {/* 2. CENTERED INSTITUTIONAL LOGIN SCREEN (Section 3 - CGC Reference) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div id="login-card" className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-auto">
          
          {/* Top Institutional Branding */}
          <div className="pt-8 pb-5 px-6 sm:px-8 border-b border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-2xs mb-3">
              <img
                src="/images/hiet_crest.png"
                alt="HIET Crest"
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className="font-extrabold text-[#0f2942] text-base sm:text-lg tracking-tight leading-snug">
              HIET GROUP OF INSTITUTIONS
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Vidyanagar, Shahpur, Distt. Kangra (H.P.)
            </p>

            <div className="w-12 h-0.5 bg-slate-200 mt-4 mb-3 rounded-full" />

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sign In
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your verified HIET Digital Campus account
            </p>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-4">
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
                      onClick={onOpenStudentRegister}
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
                          : 'Resend Email'}
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full py-2.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-extrabold tracking-wider uppercase rounded-xl shadow-xs transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-1"
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

            {/* For Students & Faculty verification/sign-up flows */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-center">
              <div>
                <span className="text-slate-500">New Student? </span>
                <button
                  type="button"
                  onClick={onOpenStudentRegister}
                  className="font-bold text-[#0f2942] hover:underline"
                >
                  Verify & Sign Up
                </button>
              </div>

              <div>
                <span className="text-slate-500">Faculty member? </span>
                <button
                  type="button"
                  onClick={onOpenTeacherRegister}
                  className="font-bold text-[#0f2942] hover:underline"
                >
                  Faculty verification / sign-in flow
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Himachal Institute of Engineering & Technology (HIET). All rights reserved.</span>
          <span className="font-semibold text-slate-700">Affiliated to HPTU Hamirpur • Approved by AICTE</span>
        </div>
      </footer>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 text-xs text-slate-600 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">About HIET Digital Campus</h3>
              <button onClick={() => setShowAbout(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="leading-relaxed">
              Himachal Institute of Engineering & Technology (HIET), located at Vidyanagar, Shahpur, Distt. Kangra (H.P.), is an AICTE-approved premier technical institution affiliated with Himachal Pradesh Technical University (HPTU), Hamirpur.
            </p>
            <p className="leading-relaxed">
              HIET Digital Campus provides centralized academic governance, verified attendance tracking, syllabus management, digital gate pass, and comprehensive ERP services for students and faculty.
            </p>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-2 bg-[#0f2942] text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 text-xs text-slate-600 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Contact Campus Administration</h3>
              <button onClick={() => setShowContact(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#0f2942] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Campus Address:</strong>
                  <span>Vidyanagar, Shahpur, Distt. Kangra, Himachal Pradesh – 176206</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#0f2942] shrink-0" />
                <div>
                  <strong className="text-slate-900 block">Helpdesk Phone:</strong>
                  <span>+91 1892 238191 / +91 94180 11001</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#0f2942] shrink-0" />
                <div>
                  <strong className="text-slate-900 block">Official Email:</strong>
                  <span>info@hiet.ac.in • principal@hiet.ac.in</span>
                </div>
              </div>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowContact(false)}
                className="px-4 py-2 bg-[#0f2942] text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 text-xs text-slate-600 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reset Password</h3>
              <button onClick={() => setShowForgotPassword(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="leading-relaxed">
              To reset your institutional account password, please contact your department HOD or the college administrative help desk with your University Roll Number / Faculty ID.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">IT Cell & Student Records Desk</div>
              <div>Administrative Block, Ground Floor</div>
              <div>Email: itcell@hiet.ac.in</div>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="px-4 py-2 bg-[#0f2942] text-white rounded-xl font-bold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
