// =============================================================================
// HIET DIGITAL CAMPUS — ROLE-AWARE CAMPUS AI ASSISTANT MODAL
// Himachal Institute of Engineering & Technology, Shahpur
// "Coming Soon" Mode: Clean, professional dialog with planned capabilities
// =============================================================================

import React from 'react';
import {
  Sparkles,
  X,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Compass,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FeatureStatusBadge } from '../common/FeatureStatusBadge';
import { NavTab } from '../common/Sidebar';

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
  const { user, role } = useAuth();
  const effectiveRole = (role || 'student').toLowerCase();

  if (!isOpen) return null;

  const handleOpenAiCampus = () => {
    onClose();
    if (onNavigateTab) {
      window.history.pushState(null, '', '/app/ai');
      onNavigateTab('ai_campus');
    }
  };

  const plannedCapabilities = [
    {
      icon: CalendarCheck,
      text: 'Answer your authorized attendance questions and forecast 75% thresholds'
    },
    {
      icon: CalendarDays,
      text: 'Show timetable schedules, upcoming classes, and assignment deadlines'
    },
    {
      icon: Compass,
      text: 'Help navigate campus services, leave submissions, and gate passes'
    },
    {
      icon: BookOpen,
      text: 'Provide role-aware academic information, syllabus notes, and college guidelines'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-[#222222] rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1e1e1e] flex items-center justify-between bg-slate-50/70 dark:bg-[#141414]">
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
                AI Campus Phase 1 • In Development
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Main Hero Notification */}
          <div className="text-center space-y-2 py-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#1c1c1c] border border-blue-100 dark:border-[#2e2e2e] text-[#0f2942] dark:text-sky-300 flex items-center justify-center mx-auto shadow-2xs">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                HIET Campus Assistant is Coming Soon
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
              The institutional AI Assistant is currently undergoing secure role-isolation, 
              grounding audits, and security testing before operational release.
            </p>
            <div className="pt-1">
              <FeatureStatusBadge status="coming_soon" size="md" />
            </div>
          </div>

          {/* Planned Capabilities */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-[#161616] p-4 rounded-2xl border border-slate-200/80 dark:border-[#242424]">
            <p className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>Planned Capabilities</span>
            </p>
            <div className="space-y-2 pt-1">
              {plannedCapabilities.map((cap, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{cap.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Role Privacy Note */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-900 dark:text-sky-200 leading-relaxed font-medium">
              <strong>Strict Privacy Guard:</strong> The assistant will strictly access only information permitted for your authorized role (<strong>{effectiveRole}</strong>). It will never permit peer tracking or arbitrary database modifications.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 dark:bg-[#141414] border-t border-slate-100 dark:border-[#1e1e1e] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleOpenAiCampus}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0f2942] hover:bg-[#0a1c2e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Explore AI Campus Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-[#1c1c1c] border border-slate-300 dark:border-[#2e2e2e] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
