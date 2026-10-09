import React, { useState } from 'react';
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
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Layers,
  AlertCircle,
  FileText,
  X,
  LucideIcon
} from 'lucide-react';
import { AiFeatureConfig, isAiPreviewMode } from '../../config/aiFeatures';
import { PageHeader } from '../../components/common/PageHeader';
import { FeatureStatusBadge } from '../../components/common/FeatureStatusBadge';
import { NavTab } from '../../components/common/Sidebar';
import { CampusAssistant } from '../../components/ai/CampusAssistant';

interface Props {
  feature: AiFeatureConfig;
  onBack?: () => void;
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

export const AiFeatureComingSoonPage: React.FC<Props> = ({
  feature,
  onBack,
  onNavigateTab
}) => {
  const [activeModal, setActiveModal] = useState<'workflow' | 'data' | null>(null);
  const isDevPreview = isAiPreviewMode();

  const IconComponent = ICON_MAP[feature.icon] || Sparkles;

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'phase_1':
        return 'Phase 1 — Academic Intelligence';
      case 'phase_2':
        return 'Phase 2 — Smart Campus Operations';
      case 'phase_3':
        return 'Phase 3 — Institutional Governance';
      default:
        return 'Phase 1';
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET AI Campus', onClick: onBack },
          { label: feature.title, active: true }
        ]}
        title={feature.title}
        description={feature.description}
        badge={getPhaseLabel(feature.phase)}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack || (() => onNavigateTab?.('ai_campus'))}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#303030] hover:border-[#0f2942] dark:hover:border-neutral-500 text-xs font-bold text-slate-700 dark:text-[#f5f5f5] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AI Campus</span>
            </button>
          </div>
        }
      />

      {/* 2. Main Status & Overview Card */}
      <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Top Badges & Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#222222]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#1f1f1f] border border-blue-100 dark:border-[#2a2a2a] text-[#0f2942] dark:text-sky-300 flex items-center justify-center shrink-0 shadow-2xs">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {feature.title}
                </h2>
                <FeatureStatusBadge status={feature.status} size="md" />
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Target Audience: <strong className="text-slate-700 dark:text-neutral-300 font-semibold">{feature.targetAudience || 'Authorized Campus Stakeholders'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-[#1c1c1c] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#2e2e2e] font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{getPhaseLabel(feature.phase)}</span>
            </span>
          </div>
        </div>

        {/* Development Status Disclaimer Banner */}
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <p className="font-bold">Development Status Notice</p>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/80">
              This AI Campus feature is currently under active engineering and security evaluation. 
              It is not yet enabled for live administrative, grading, or operational decisions on campus.
            </p>
          </div>
        </div>

        {/* Planned Capabilities Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Planned Capabilities & Features</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {feature.estimatedCapability.map((cap, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200/80 dark:border-[#262626] flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-snug">
                  {cap}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Statutory Responsible AI & Human Governance Commitment */}
        <div className="p-4 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
            <p className="font-bold text-slate-900 dark:text-white">Responsible AI & Human Oversight Policy</p>
            <p className="mt-0.5 text-slate-600 dark:text-neutral-400">
              {feature.safetyNote ||
                'AI suggestions will support authorized staff and users. Final academic, attendance, disciplinary and administrative decisions remain strictly with authorized human officials.'}
            </p>
          </div>
        </div>

      </div>

      {/* 3. Interactive Campus Assistant Console (when inspecting Campus Assistant) */}
      {feature.key === 'campus_ai_assistant' && (
        <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#181818] border-b border-slate-200 dark:border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs text-slate-800 dark:text-neutral-200">Interactive Assistant Console</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Live Verified
            </span>
          </div>
          <CampusAssistant onNavigateTab={onNavigateTab} />
        </div>
      )}

      {/* 3b. Development Mode Preview Panel (Visible ONLY in Development / Preview mode for other features) */}
      {isDevPreview && feature.key !== 'campus_ai_assistant' && (
        <div className="bg-slate-50 dark:bg-[#101010] border border-dashed border-blue-300 dark:border-blue-900/60 rounded-2xl p-5 sm:p-6 space-y-4 transition">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100 dark:border-[#202020]">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                Development Preview Only
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                Navigation & Layout Validation
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">
              AI processing is not enabled yet
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            This preview panel allows developers and stakeholders to inspect workflow contracts,
            required database dependencies, and architectural bounds without invoking live inference.
          </p>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveModal('workflow')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-300 dark:border-[#333333] hover:border-[#0f2942] dark:hover:border-blue-400 text-xs font-bold text-[#0f2942] dark:text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Route className="w-3.5 h-3.5" />
              <span>View Planned Workflow</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('data')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-300 dark:border-[#333333] hover:border-[#0f2942] dark:hover:border-blue-400 text-xs font-bold text-[#0f2942] dark:text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Data Requirements</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Planned Workflow Modal */}
      {activeModal === 'workflow' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#222222] flex items-center justify-between bg-slate-50/70 dark:bg-[#161616]">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-[#0f2942] dark:text-sky-300" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Planned Execution Workflow
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202020] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {(feature.plannedWorkflow || [
                'User initiates authorized prompt or triggers scheduled workflow',
                'System validates role permissions and retrieves context from database',
                'AI inference engine generates bounded response with citations',
                'Human official reviews and accepts or overrides recommendations'
              ]).map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#121212] border-t border-slate-100 dark:border-[#222222] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] dark:bg-blue-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Data Requirements Modal */}
      {activeModal === 'data' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#222222] flex items-center justify-between bg-slate-50/70 dark:bg-[#161616]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0f2942] dark:text-sky-300" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Data Governance & Requirements
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202020] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-sky-200">
                <p className="font-bold">Schema Dependencies:</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(feature.dependsOn || ['supabase_auth', 'role_guards']).map((dep, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1a1a1a] text-[11px] font-mono border border-blue-200 dark:border-blue-900"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                  Data Privacy Requirements:
                </p>
                {(feature.dataRequirements || [
                  'Authenticated role session token',
                  'Row-Level Security (RLS) enforcement',
                  'Zero transmission of raw unencrypted credentials'
                ]).map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-neutral-400">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#121212] border-t border-slate-100 dark:border-[#222222] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] dark:bg-blue-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
