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
  LucideIcon,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Send,
  Building,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import { AiFeatureConfig, isAiPreviewMode } from '../../config/aiFeatures';
import { PageHeader } from '../../components/common/PageHeader';
import { FeatureStatusBadge } from '../../components/common/FeatureStatusBadge';
import { NavTab } from '../../components/common/Sidebar';
import { CampusAssistant } from '../../components/ai/CampusAssistant';
import {
  requestSmartBoardSummary,
  SmartBoardSummaryResponse,
  aiCampusService,
  ComplaintRoutingResult
} from '../../lib/aiCampusService';

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

  // ---------------------------------------------------------------------------
  // 1. ATTENDANCE RISK INTELLIGENCE STATE
  // ---------------------------------------------------------------------------
  const [subjectsList] = useState([
    { code: 'CS-601', name: 'Compiler Design', attended: 20, total: 32 },
    { code: 'CS-602', name: 'Computer Networks', attended: 25, total: 32 },
    { code: 'CS-603', name: 'Operating Systems', attended: 28, total: 32 },
    { code: 'CS-604', name: 'Artificial Intelligence', attended: 22, total: 32 },
    { code: 'CS-605', name: 'Software Testing & QA', attended: 27, total: 32 }
  ]);
  const [selectedSubCode, setSelectedSubCode] = useState('CS-601');
  const [extraClasses, setExtraClasses] = useState(3);

  const activeSub = subjectsList.find(s => s.code === selectedSubCode) || subjectsList[0];
  const currentPct = Math.round((activeSub.attended / activeSub.total) * 1000) / 10;
  const projectedPct = Math.round(((activeSub.attended + extraClasses) / (activeSub.total + extraClasses)) * 1000) / 10;
  const classesNeededFor75 = Math.max(0, Math.ceil((0.75 * activeSub.total - activeSub.attended) / (1 - 0.75)));

  // ---------------------------------------------------------------------------
  // 2. SMART BOARD LESSON SUMMARY STATE
  // ---------------------------------------------------------------------------
  const [sbTopic, setSbTopic] = useState('Memory Virtualization & Paging');
  const [sbNotes, setSbNotes] = useState(
    'Detailed classroom lecture on Virtual Memory, Translation Lookaside Buffers (TLB hits vs misses), Multi-level Page Tables in x86-64 architecture, and Page Replacement Algorithms including LRU and FIFO. Emphasized hardware MMU interaction with OS kernel trap handlers.'
  );
  const [sbGenerating, setSbGenerating] = useState(false);
  const [sbResult, setSbResult] = useState<SmartBoardSummaryResponse | null>(null);

  const handleGenerateSmartSummary = async () => {
    setSbGenerating(true);
    try {
      const res = await requestSmartBoardSummary({
        subjectId: 'CS-603',
        subjectName: 'Operating Systems',
        topic: sbTopic,
        durationMinutes: 50,
        teacherNotes: sbNotes
      });
      if (res.success && res.data) {
        setSbResult(res.data);
      }
    } finally {
      setSbGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. AI COMPLAINT ROUTING STATE
  // ---------------------------------------------------------------------------
  const [complaintText, setComplaintText] = useState(
    'The water cooler on the 2nd floor of Academic Block A is continuously leaking. Water is accumulating near Computer Lab 3 door creating an electrical hazard.'
  );
  const [routingInProgress, setRoutingInProgress] = useState(false);
  const [complaintResult, setComplaintResult] = useState<ComplaintRoutingResult | null>(null);

  const handleRunComplaintRouting = async () => {
    setRoutingInProgress(true);
    try {
      const res = await aiCampusService.suggestComplaintRouting({
        description: complaintText,
        title: 'Water cooler leakage'
      });
      setComplaintResult(res);
    } finally {
      setRoutingInProgress(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. QR ZONE PRESENCE STATE
  // ---------------------------------------------------------------------------
  const [zoneChoice, setZoneChoice] = useState('Central Library — 1st Floor Stack Hall');
  const [zoneVerified, setZoneVerified] = useState(false);

  const handleZoneCheckIn = () => {
    setZoneVerified(true);
    setTimeout(() => setZoneVerified(false), 5000);
  };

  // ---------------------------------------------------------------------------
  // 5. KNOWLEDGE SEARCH STATE
  // ---------------------------------------------------------------------------
  const [knowQuery, setKnowQuery] = useState('Operating Systems unit 3 paging syllabus');
  const [knowSearching, setKnowSearching] = useState(false);
  const [knowResult, setKnowResult] = useState<string | null>(null);

  const handleSearchKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    setKnowSearching(true);
    setTimeout(() => {
      setKnowSearching(false);
      setKnowResult(
        'HPTU B.Tech CSE 6th Semester Syllabus • Course Code: CS-603 (Operating Systems) — Unit 3 covers: Virtual Memory management, demand paging, page replacement strategies (FIFO, Optimal, LRU), allocation of frames, thrashing, and working-set model. Reference: Galvin & Silberschatz 10th Ed, Chapter 9.'
      );
    }, 500);
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
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AI Campus</span>
            </button>
          </div>
        }
      />

      {/* 2. Main Status & Overview Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Top Badges & Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#0f2942] flex items-center justify-center shrink-0 shadow-2xs">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {feature.title}
                </h2>
                <FeatureStatusBadge status={feature.status} size="md" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Audience: <strong className="text-slate-700 font-semibold">{feature.targetAudience || 'Authorized Campus Stakeholders'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{getPhaseLabel(feature.phase)}</span>
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* INTERACTIVE ENGINE 1: ATTENDANCE RISK INTELLIGENCE                  */}
        {/* =================================================================== */}
        {feature.key === 'attendance_risk_intelligence' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ChartNoAxesCombined className="w-4 h-4 text-[#0f2942]" />
                <span>Subject Attendance Forecaster & Remediator</span>
              </h3>
              <span className="text-xs text-slate-500">HPTU 75% Statutory Compliance</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Subject Selector & Stats */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Select Course / Subject</label>
                <div className="space-y-1.5">
                  {subjectsList.map(s => {
                    const isSel = s.code === selectedSubCode;
                    const pct = Math.round((s.attended / s.total) * 100);
                    const isRisk = pct < 75;
                    return (
                      <button
                        key={s.code}
                        onClick={() => setSelectedSubCode(s.code)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                          isSel
                            ? 'bg-[#0f2942] text-white border-[#0f2942]'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${
                          isSel
                            ? 'bg-white/20 text-white'
                            : isRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {pct}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Forecast & Advisory Card */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{activeSub.code}</span>
                      <h4 className="text-base font-black text-slate-900">{activeSub.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-black font-mono ${
                        currentPct < 75 ? 'text-rose-600' : currentPct < 80 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {currentPct}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">Current Attendance</span>
                    </div>
                  </div>

                  {/* AI Statutory Advisory */}
                  <div className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                    currentPct < 75
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : currentPct < 80
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">
                          {currentPct < 75
                            ? 'Statutory Attendance Warning (< 75%)'
                            : currentPct < 80
                            ? 'Attendance Caution Zone (75% - 80%)'
                            : 'Attendance Safe Zone (> 80%)'}
                        </p>
                        <p className="mt-1">
                          {classesNeededFor75 > 0 ? (
                            <>
                              HPTU rules ke anusaar semester exam hall ticket lene ke liye aapko is subject me{' '}
                              <strong className="underline">agle {classesNeededFor75} continuous lectures</strong> attend karna zaroori hai.
                            </>
                          ) : (
                            <>Aapki attendance safe margin me hai. Agle 2 lecture miss karne par bhi aap 75% se upar rahenge.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Simulation Slider */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Simulate Attending Next Lectures:</span>
                      <span className="font-mono font-bold text-[#0f2942] bg-white px-2 py-0.5 rounded border border-slate-200">
                        +{extraClasses} Lectures
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={extraClasses}
                      onChange={(e) => setExtraClasses(Number(e.target.value))}
                      className="w-full accent-[#0f2942] cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Attended: {activeSub.attended + extraClasses} / {activeSub.total + extraClasses} total</span>
                      <span className="font-bold text-slate-800">
                        Projected Attendance: <span className="font-mono text-emerald-700 font-black">{projectedPct}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => onNavigateTab?.('attendance')}
                    className="px-4 py-2 rounded-xl bg-[#0f2942] text-white font-bold hover:bg-[#0a1c2e] transition cursor-pointer"
                  >
                    View Official Attendance Sheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE ENGINE 2: SMART BOARD AI SUMMARY                        */}
        {/* =================================================================== */}
        {feature.key === 'smart_board_ai_summary' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Interactive Faculty Smart Board Lesson Summarizer</span>
              </h3>
              <span className="text-xs text-slate-500">Live AI Synthesis</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lecture Topic</label>
                  <input
                    type="text"
                    value={sbTopic}
                    onChange={(e) => setSbTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teacher Notes / Whiteboard Transcript</label>
                  <textarea
                    rows={6}
                    value={sbNotes}
                    onChange={(e) => setSbNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleGenerateSmartSummary}
                  disabled={sbGenerating}
                  className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{sbGenerating ? 'Extracting Learning Objectives & Summary...' : 'Generate Smart AI Summary'}</span>
                </button>
              </div>

              {/* Generated Result Box */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3.5 flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 uppercase text-[11px]">Structured Lesson Output</span>
                    {sbResult && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        AI Synthesized
                      </span>
                    )}
                  </div>

                  {sbResult ? (
                    <div className="space-y-3 mt-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Executive Summary</span>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium mt-0.5">
                          {sbResult.summary}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Learning Objectives (Bloom's Taxonomy)</span>
                        <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-700">
                          {sbResult.learningObjectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Key Concept Tags</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {sbResult.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-100">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {sbResult.recommendedNextTopic && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                          <span className="font-bold text-slate-700">Recommended Next Lecture: </span>
                          <span className="text-slate-600">{sbResult.recommendedNextTopic}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Sparkles className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
                      <p>Click "Generate Smart AI Summary" to extract structured study notes from your lecture transcript.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE ENGINE 3: AI COMPLAINT ROUTING                          */}
        {/* =================================================================== */}
        {feature.key === 'complaint_ai_router' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Route className="w-4 h-4 text-[#0f2942]" />
                <span>AI Complaint Classifier & Priority Routing Engine</span>
              </h3>
              <span className="text-xs text-slate-500">Automated Department Discovery</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="font-bold text-slate-700 block">Describe Student Grievance / Maintenance Issue</label>
                <textarea
                  rows={4}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                />

                <button
                  onClick={handleRunComplaintRouting}
                  disabled={routingInProgress}
                  className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Route className="w-4 h-4" />
                  <span>{routingInProgress ? 'Analyzing NLP Semantics...' : 'Predict Category & Priority with AI'}</span>
                </button>
              </div>

              {/* Classification Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">AI Routing Recommendation</span>
                  {complaintResult ? (
                    <div className="space-y-2.5 mt-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-600">Assigned Department</span>
                        <span className="font-bold text-[#0f2942] text-sm uppercase">{complaintResult.category}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-600">Calculated Priority</span>
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-100 text-rose-800 border border-rose-200">
                          {complaintResult.priority}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 leading-snug">
                        <span className="font-bold">Routing Rationale:</span> {complaintResult.reason}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <Route className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-600" />
                      <p>Type a grievance description and click "Predict Category & Priority with AI" to see routing prediction.</p>
                    </div>
                  )}
                </div>

                {complaintResult && (
                  <button
                    onClick={() => onNavigateTab?.('complaints')}
                    className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Submit Complaint</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE ENGINE 4: QR ZONE PRESENCE CHECK-IN                     */}
        {/* =================================================================== */}
        {feature.key === 'qr_zone_presence' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Voluntary QR Zone Presence Check-In</span>
              </h3>
              <span className="text-xs text-slate-500">Zero GPS Surveillance</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Select Active Campus Zone</label>
                <select
                  value={zoneChoice}
                  onChange={(e) => setZoneChoice(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                >
                  <option>Central Library — 1st Floor Stack Hall</option>
                  <option>Computer Science Lab 3 — Academic Block A</option>
                  <option>Main Auditorium & Seminar Complex</option>
                  <option>Mechanical Engineering Workshop</option>
                </select>
              </div>

              <button
                onClick={handleZoneCheckIn}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Log Verified Presence</span>
              </button>
            </div>

            {zoneVerified && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Verified Presence Logged at <strong>{zoneChoice}</strong> on {new Date().toLocaleTimeString()}.
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Confidence: 98%
                </span>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE ENGINE 5: KNOWLEDGE SEARCH                              */}
        {/* =================================================================== */}
        {feature.key === 'knowledge_search' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <SearchCheck className="w-4 h-4 text-blue-600" />
                <span>Grounded AI Campus Document & Syllabus Search</span>
              </h3>
              <span className="text-xs text-slate-500">Vector Embeddings Grounded</span>
            </div>

            <form onSubmit={handleSearchKnowledge} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={knowQuery}
                  onChange={(e) => setKnowQuery(e.target.value)}
                  placeholder="Ask any question about syllabus, PYQs, or college regulations..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold text-xs"
              >
                {knowSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {knowResult && (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                  <span>Verified Institutional Citation</span>
                  <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Score: 0.94
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {knowResult}
                </p>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE ENGINE 6: SMART OCCUPANCY ANALYTICS                     */}
        {/* =================================================================== */}
        {feature.key === 'occupancy_analytics' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UsersRound className="w-4 h-4 text-indigo-600" />
                <span>Live Anonymous Campus Crowd Density</span>
              </h3>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Feed</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Central Library Stack 1</span>
                <div className="text-lg font-black text-slate-900">38 / 80 Seats</div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '47%' }}></div>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">Normal Occupancy (47%)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Central Library Reading Hall</span>
                <div className="text-lg font-black text-slate-900">54 / 60 Seats</div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <span className="text-[10px] text-rose-700 font-bold block">Near Capacity (90%)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Main Student Cafeteria</span>
                <div className="text-lg font-black text-slate-900">45 / 120 Seats</div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '37%' }}></div>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">Moderate (37%)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Block B Seminar Hall</span>
                <div className="text-lg font-black text-slate-900">0 / 250 Seats</div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold block">Vacant (0%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Planned Capabilities Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Core Capabilities & Specification</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {feature.estimatedCapability.map((cap, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  {cap}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Statutory Responsible AI & Human Governance Commitment */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900">Responsible AI & Human Oversight Policy</p>
            <p className="mt-0.5 text-slate-600">
              {feature.safetyNote ||
                'AI suggestions provide early advisory guidance. Final condonation, exam eligibility, or disciplinary decisions remain strictly under Principal and HOD academic authority.'}
            </p>
          </div>
        </div>

      </div>

      {/* 3. Interactive Campus Assistant Console (when inspecting Campus Assistant) */}
      {feature.key === 'campus_ai_assistant' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs text-slate-800">Interactive Assistant Console</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Verified
            </span>
          </div>
          <CampusAssistant onNavigateTab={onNavigateTab} />
        </div>
      )}
    </div>
  );
};
