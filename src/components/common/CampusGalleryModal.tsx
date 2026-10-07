import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { CampusGalleryView } from './CampusGalleryView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CampusGalleryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-hidden">
      <div className="w-full max-w-6xl max-h-[94vh] bg-white dark:bg-[#080d1e] border border-slate-200 dark:border-blue-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <h2 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="truncate max-w-[160px] xs:max-w-[260px] sm:max-w-none">HIET Campus Gallery</span>
              <span className="hidden xs:inline text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 uppercase shrink-0">
                Official Media
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <CampusGalleryView />
        </div>
      </div>
    </div>
  );
};
