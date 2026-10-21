// =============================================================================
// HIET DIGITAL CAMPUS — INSTITUTIONAL SPLASH SCREEN
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Displays official branding and loading status with fail-safe timeout handling
// =============================================================================

import React, { useState, useEffect } from 'react';
import { RefreshCw, LogIn } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
  onRetry?: () => void;
  onContinueToLogin?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = 'Initializing Digital Campus...',
  onRetry,
  onContinueToLogin
}) => {
  const [showSlowNetworkNotice, setShowSlowNetworkNotice] = useState(false);

  // If initialization takes longer than 5 seconds due to poor network,
  // offer the user clear interactive fallback options rather than infinite waiting.
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowNetworkNotice(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#f8fafc] text-slate-800 z-[9999] px-6 select-none animate-fadeIn"
    >
      <div className="flex flex-col items-center text-center max-w-sm w-full mx-auto">
        {/* Official HIET Emblem Card — Clean White Rounded Container (No Black Square) */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center justify-center p-3.5 transition-transform duration-300 transform hover:scale-105">
            <img
              src="/images/hiet_crest.png"
              alt="HIET College Official Logo"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          {/* Animated institutional beacon */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
          </span>
        </div>

        {/* Institutional Titles */}
        <div className="mb-6">
          <h1 className="text-base sm:text-lg font-extrabold text-[#0f2942] tracking-tight mb-1">
            HIET GROUP OF INSTITUTIONS
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-tight">
            Digital Campus Portal • Shahpur (H.P.)
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3.5 relative">
          <div className="h-full bg-[#0f2942] rounded-full animate-indeterminate" />
        </div>

        {/* Dynamic Status Message */}
        <p className="text-xs font-medium text-slate-600 tracking-wide">
          {message}
        </p>

        {/* Fail-safe interactive recovery if network is slow/stalled (> 5s) */}
        {showSlowNetworkNotice && (
          <div className="mt-8 pt-6 border-t border-slate-200 w-full flex flex-col items-center gap-2.5 animate-fadeIn">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-1.5 font-medium text-center">
              Network is responding slowly. You can retry or proceed directly.
            </p>
            <div className="flex items-center gap-2 w-full mt-1">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
              {onContinueToLogin && (
                <button
                  type="button"
                  onClick={onContinueToLogin}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#0f2942] text-xs font-semibold text-white hover:bg-[#163a5d] shadow-2xs transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes indeterminate {
          0% { transform: translateX(-100%); width: 40%; }
          50% { transform: translateX(50%); width: 60%; }
          100% { transform: translateX(250%); width: 40%; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-indeterminate {
          animation: indeterminate 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};
