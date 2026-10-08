import React from 'react';
import {
  Sparkles,
  ChartNoAxesCombined,
  Route,
  Bot,
  MapPin,
  Bluetooth,
  SearchCheck,
  UsersRound,
  Recycle,
  ShieldCheck,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import {
  AiFeatureConfig,
  getAiFeaturesForRole,
  AI_FEATURES
} from '../../config/aiFeatures';
import { PageHeader } from '../../components/common/PageHeader';
import { FeatureStatusBadge } from '../../components/common/FeatureStatusBadge';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from '../../components/common/Sidebar';

interface Props {
  onSelectFeature?: (feature: AiFeatureConfig) => void;
  onNavigateTab?: (tab: NavTab) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  ChartNoAxesCombined,
  Sparkles,
  Route,
  Bot,
  MapPin,
  Bluetooth,
  SearchCheck,
  UsersRound,
  Recycle
};

export const AiCampusOverviewPage: React.FC<Props> = ({
  onSelectFeature,
  onNavigateTab
}) => {
  const { role } = useAuth();

  // Filter features permitted for user's role
  const permittedFeatures = role ? getAiFeaturesForRole(role) : AI_FEATURES;

  const phase1Features = permittedFeatures.filter(f => f.phase === 'phase_1');
  const phase2Features = permittedFeatures.filter(f => f.phase === 'phase_2');

  const renderFeatureCard = (feature: AiFeatureConfig) => {
    const IconComponent = ICON_MAP[feature.icon] || Sparkles;

    return (
      <div
        key={feature.key}
        className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-[#0f2942]/40 dark:hover:border-neutral-500 transition-all flex flex-col justify-between group"
      >
        <div className="space-y-4">
          {/* Header Row: Icon, Phase Badge, Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-[#1f1f1f] border border-blue-100 dark:border-[#2a2a2a] text-[#0f2942] dark:text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1f1f1f] text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-[#2e2e2e]">
                {feature.phase === 'phase_1' ? 'Phase 1' : 'Phase 2'}
              </span>
              <FeatureStatusBadge status={feature.status} />
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-[#0f2942] dark:group-hover:text-sky-300 transition-colors">
              {feature.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {feature.description}
            </p>
          </div>

          {/* Target Audience */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#202020] text-[11px] text-slate-600 dark:text-neutral-400">
            <span className="text-slate-400 dark:text-neutral-500 font-medium">Audience: </span>
            <span className="font-semibold text-slate-700 dark:text-neutral-300">
              {feature.targetAudience || 'Campus Stakeholders'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#202020]">
          <button
            type="button"
            onClick={() => {
              if (onSelectFeature) {
                onSelectFeature(feature);
              } else if (onNavigateTab) {
                // Map to tab if available or update URL
                window.history.pushState(null, '', feature.route);
                onNavigateTab(`ai_${feature.key}` as any);
              }
            }}
            className="w-full py-2 px-3.5 bg-slate-50 hover:bg-[#0f2942] dark:bg-[#1c1c1c] dark:hover:bg-blue-600 text-[#0f2942] hover:text-white dark:text-neutral-200 dark:hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#2e2e2e] hover:border-transparent cursor-pointer shadow-2xs"
          >
            <span>Open Preview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'Institutional Governance' },
          { label: 'HIET AI Campus', active: true }
        ]}
        title="HIET AI Campus"
        description="AI-assisted academic, campus operations and student-support capabilities planned for the HIET Digital Campus platform."
        badge="Roadmap & Capabilities"
      />

      {/* 2. Responsible AI Commitment Banner */}
      <div className="p-4 sm:p-5 bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#0f2942] dark:text-sky-300 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 text-xs text-blue-950 dark:text-sky-200 leading-relaxed">
            <p className="font-extrabold text-sm text-[#0f2942] dark:text-white">
              Responsible AI & Human-in-the-Loop Commitment
            </p>
            <p className="text-slate-600 dark:text-neutral-300 mt-0.5">
              AI features will assist students and staff with insights, summaries and routing suggestions. 
              Final academic, attendance, disciplinary and administrative decisions remain strictly with authorized human officials.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Phase 1 — Academic Intelligence */}
      {phase1Features.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#252525] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Phase 1 — Academic Intelligence
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
              {phase1Features.length} {phase1Features.length === 1 ? 'Capability' : 'Capabilities'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {phase1Features.map(renderFeatureCard)}
          </div>
        </div>
      )}

      {/* 4. Phase 2 — Smart Campus Operations */}
      {phase2Features.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#252525] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Phase 2 — Smart Campus Operations
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
              {phase2Features.length} {phase2Features.length === 1 ? 'Capability' : 'Capabilities'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phase2Features.map(renderFeatureCard)}
          </div>
        </div>
      )}
    </div>
  );
};
