import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  X,
  Share2,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Notice } from '../../types';
import { dataStore } from '../../lib/mockData';
import { formatDate } from '../../lib/utils';

interface Props {
  onOpenNoticesTab?: () => void;
  className?: string;
  compact?: boolean;
}

export const NoticeBoard3D: React.FC<Props> = ({
  onOpenNoticesTab,
  className = '',
  compact = false
}) => {
  const [notices] = useState<Notice[]>(() => dataStore.getNotices());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // 3D Tilt State
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  // Auto-scroll through notices every 6 seconds
  useEffect(() => {
    if (isPaused || notices.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % notices.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, notices.length]);

  const activeNotice = notices[currentIndex] || notices[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rY = ((x - centerX) / centerX) * 4; // subtle 4 deg tilt
    const rX = ((centerY - y) / centerY) * 4;

    setRotX(rX);
    setRotY(rY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18
    });
  };

  const handleMouseLeave = () => {
    setRotX(0);
    setRotY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  const nextNotice = () => {
    setCurrentIndex(prev => (prev + 1) % notices.length);
  };

  const prevNotice = () => {
    setCurrentIndex(prev => (prev - 1 + notices.length) % notices.length);
  };

  if (!activeNotice) return null;

  const getPriorityTheme = (priority: Notice['priority']) => {
    switch (priority) {
      case 'Urgent':
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          glow: 'border-slate-300',
          dot: 'bg-blue-600',
          label: 'CRITICAL CIRCULAR'
        };
      case 'Important':
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          glow: 'border-slate-200',
          dot: 'bg-slate-400',
          label: 'IMPORTANT NOTICE'
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          glow: 'border-slate-200',
          dot: 'bg-slate-400',
          label: 'COLLEGE CIRCULAR'
        };
    }
  };

  const theme = getPriorityTheme(activeNotice.priority);

  return (
    <>
      {/* Mobile Phone Mode: Ultra-Compact High-Priority Notice Ticker (< sm) */}
      <div className="sm:hidden w-full mb-3">
        <div 
          onClick={() => setSelectedNotice(activeNotice)}
          className={`w-full rounded-2xl p-2.5 bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.99] transition`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs relative">
              <Bell className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className={`relative inline-flex rounded-full h-2 w-2 border border-white ${theme.dot}`} />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-semibold uppercase border ${theme.badge}`}>
                  {theme.label}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">[{currentIndex + 1}/{notices.length}]</span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {activeNotice.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextNotice();
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 bg-slate-100"
              title="Next notice"
              aria-label="Next notice"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-semibold text-blue-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              Open
            </span>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet: Full 3D Perspective Floating Notice Billboard */}
      <div 
        className={`hidden sm:block w-full max-w-full overflow-hidden ${className}`}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative rounded-2xl p-3 sm:p-4 bg-white border border-slate-200 shadow-xs overflow-hidden max-w-full`}
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4 relative z-10">
            
            {/* Left: Beacon + Official Tag */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="relative group shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-200 transition-all">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-white ${theme.dot}`} />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="font-heading font-bold text-xs sm:text-sm tracking-tight text-slate-900 uppercase flex items-center gap-1 sm:gap-1.5">
                    <span>HIET NOTICE</span>
                    <span className="hidden sm:inline">BOARD</span>
                  </span>
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-semibold uppercase border ${theme.badge}`}>
                    {theme.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">
                  <span className="font-mono">[{currentIndex + 1} of {notices.length}]</span>
                  <span>•</span>
                  <span>Audience: <strong>{activeNotice.audience}</strong></span>
                  <span>•</span>
                  <span>{formatDate(activeNotice.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Middle: Notice Headline */}
            <div 
              onClick={() => setSelectedNotice(activeNotice)}
              className="flex-1 min-w-0 cursor-pointer group bg-slate-50 hover:bg-blue-50/60 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all"
            >
              <p className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-blue-600 transition truncate">
                {activeNotice.title}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-1 mt-0.5 font-normal">
                {activeNotice.content}
              </p>
            </div>

            {/* Right: Controls & Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="flex items-center gap-1">
                <button
                  onClick={prevNotice}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title="Previous notice"
                  aria-label="Previous notice"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPaused(p => !p)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
                  aria-label={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-slate-600" />}
                </button>
                <button
                  onClick={nextNotice}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title="Next notice"
                  aria-label="Next notice"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setSelectedNotice(activeNotice)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <span>Read Circular</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Expanded Full Circular Modal Dialog */}
      {selectedNotice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5 relative overflow-hidden"
          >
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-indigo-600" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-600 border border-blue-200">
                    HIET Circular • {selectedNotice.id.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getPriorityTheme(selectedNotice.priority).badge}`}>
                    {selectedNotice.priority}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-snug">
                  {selectedNotice.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Content */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal">
              {selectedNotice.content}
            </div>

            {/* Metadata Footer: Issuer, Date, Stamp */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Issued By: {selectedNotice.created_by_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Published: {formatDate(selectedNotice.created_at)}</span>
                  <span>•</span>
                  <span>Target: <strong>{selectedNotice.audience}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Official Seal Verified</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${selectedNotice.title}\n\n${selectedNotice.content}`);
                  alert('Circular link & text copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Circular</span>
              </button>

              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
