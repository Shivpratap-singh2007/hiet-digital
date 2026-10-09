// =============================================================================
// HIET DIGITAL CAMPUS — ROLE-AWARE CAMPUS AI ASSISTANT MODAL
// Himachal Institute of Engineering & Technology, Shahpur
// Strict UI/UX preservation with interactive conversation & role isolation
// =============================================================================

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from '../common/Sidebar';
import { CampusAssistant } from './CampusAssistant';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const CampusAiAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { role, activeWorkspaceRole } = useAuth();
  const effectiveRole = (activeWorkspaceRole || role || 'student').toLowerCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-[#222222] rounded-3xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1e1e1e] flex items-center justify-between bg-slate-50/70 dark:bg-[#141414] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0f2942] dark:bg-[#202020] text-amber-400 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  HIET Campus Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0f2942] dark:bg-[#1a2533] dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {effectiveRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-tight">
                Role-Aware Academic & Campus Intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202020] transition cursor-pointer"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Active Campus Assistant */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <CampusAssistant onNavigateTab={onNavigateTab} onClose={onClose} />
        </div>

      </div>
    </div>
  );
};
