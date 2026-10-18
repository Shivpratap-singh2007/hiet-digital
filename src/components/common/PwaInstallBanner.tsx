// =============================================================================
// HIET DIGITAL CAMPUS — PWA INSTALLATION BANNER & IOS GUIDE MODAL
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// =============================================================================

import React from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIos,
    isBannerDismissed,
    showIosModal,
    setShowIosModal,
    installApp,
    dismissBanner
  } = usePwa();

  // If already running as installed standalone app or banner dismissed, don't show floating bar
  if (isInstalled || isBannerDismissed) {
    return (
      <>
        {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
      </>
    );
  }

  // Show if installable (Android/Desktop) or on iOS Safari
  if (!isInstallable && !isIos) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Banner */}
      <aside
        aria-label="Install HIET Campus App"
        className="fixed bottom-18 lg:bottom-6 right-3 left-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border border-slate-300 dark:border-[#2e2e2e] shadow-xl rounded-2xl p-4 transition-all animate-slide-up"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Logo & Info */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0f2942] p-1.5 flex items-center justify-center shrink-0 shadow-xs border border-white/10">
              <img
                src="/images/hiet_crest.png"
                alt="HIET Crest"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight">
                  Install HIET Campus App
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                Add to your phone for instant gate passes, attendance alerts & offline access.
              </p>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss app install banner"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Row */}
        <div className="mt-3.5 flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100 dark:border-[#222222]">
          <button
            type="button"
            onClick={dismissBanner}
            className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-neutral-300 rounded-lg transition"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={installApp}
            className="px-3.5 py-1.5 bg-[#0f2942] hover:bg-[#163859] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIos ? 'How to Install on iPhone' : 'Install on Phone'}</span>
          </button>
        </div>
      </aside>

      {/* iOS Instructions Modal */}
      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </>
  );
};

// Modal for iPhone & iPad Safari Users
export const IosInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#2c2c2c] rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0f2942] text-white flex items-center justify-center p-1">
              <img src="/images/hiet_crest.png" alt="HIET" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Install on iPhone / iPad
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                Apple Safari Home Screen Setup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3 text-xs text-slate-700 dark:text-neutral-300">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2e2e2e]">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <span className="font-bold">Tap Share Button</span> in Safari’s bottom toolbar.
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-sky-300 font-semibold mt-1">
                <Share className="w-3.5 h-3.5" />
                <span>Share icon (square with arrow)</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2e2e2e]">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div>
              Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>.
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-300 font-semibold mt-1">
                <PlusSquare className="w-3.5 h-3.5" />
                <span>Add to Home Screen</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2e2e2e]">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              Tap <span className="font-bold">"Add"</span> in the top right corner. The HIET icon will appear directly on your phone's home screen!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-[#0f2942] text-white text-xs font-bold rounded-xl hover:bg-[#163859] transition shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
