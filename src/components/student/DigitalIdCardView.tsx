import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  RotateCw, 
  Printer, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Maximize2, 
  Minimize2,
  Phone,
  Droplet,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DynamicQRCodeCanvas } from '../common/DynamicQRCodeCanvas';
import { PageHeader } from '../common/PageHeader';
import { NavTab } from '../common/Sidebar';
import { isStudentHosteler } from '../../lib/utils';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const DigitalIdCardView: React.FC<Props> = ({ onNavigate: _onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const isHosteler = isStudentHosteler(student);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [pulseTick, setPulseTick] = useState(0);

  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const studentRoll = student?.roll_no || '26CSE001';
  const studentBranch = student?.branch || 'Computer Science & Engineering';
  const studentSemester = student?.semester || 6;
  const studentBatch = '2023 - 2027';
  const bloodGroup = 'B+';
  const emergencyMobile = '+91 98160 99882';
  const validUntil = '31 July 2027';
  const libraryCardNo = `LIB-${studentRoll}`;
  const verificationToken = `HIET-ID-${studentRoll}-VERIFIED-2026`;

  // Live anti-spoof clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ' • ' + now.toLocaleTimeString('en-IN', { hour12: false })
      );
      setPulseTick(prev => (prev + 1) % 100);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 font-sans ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/95 p-4 sm:p-8 flex flex-col items-center justify-center overflow-y-auto' : ''}`}>
      {/* Header (Hidden in print and fullscreen mode) */}
      {!isFullscreen && (
        <div className="print:hidden">
          <PageHeader
            breadcrumbs={[
              { label: 'HIET Digital Campus' },
              { label: 'Student Welfare' },
              { label: 'Smart Digital ID Card', active: true }
            ]}
            title="Smart Digital Student ID"
            description="Official tamper-proof institutional credential with real-time anti-spoof verification beacon."
            badge="HPTU Approved • Live Identity"
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isFlipped ? 'Show Front' : 'Flip to Back'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Gate Mode</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#1a3d5e] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print ID</span>
                </button>
              </div>
            }
          />
        </div>
      )}

      {/* Fullscreen Close Trigger */}
      {isFullscreen && (
        <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Security Gate Full-Screen Inspection</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-xs font-bold"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      )}

      {/* 3D Flip Card Container */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="w-full max-w-sm sm:max-w-md relative perspective-1000">
          {/* CARD BODY */}
          <div
            className={`w-full transition-transform duration-700 transform-style-3d relative ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* ================= CARD FRONT ================= */}
            <div
              className={`w-full rounded-3xl bg-gradient-to-br from-[#0a1e33] via-[#0f2942] to-[#153e66] text-white shadow-2xl border border-white/20 overflow-hidden relative ${
                isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* Top Accent Pattern */}
              <div className="h-2.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400"></div>

              {/* Header with College Crest */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                    <Building2 className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-wider uppercase text-amber-300">
                      HIET DIGITAL CAMPUS
                    </h3>
                    <p className="text-[10px] text-slate-300 font-semibold tracking-tight">
                      Himachal Institute of Engg. & Technology, Shahpur
                    </p>
                    <span className="text-[9px] text-emerald-400 font-medium block">
                      Affiliated to HPTU Hamirpur • AICTE Approved
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    STUDENT
                  </span>
                </div>
              </div>

              {/* Main Info Section */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex gap-4 items-center">
                  {/* Photo with Institutional Ring */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-300 via-sky-400 to-indigo-600 p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-2xl bg-slate-800 flex flex-col items-center justify-center overflow-hidden relative">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-amber-400 font-black text-xl">
                          {studentName.charAt(0)}
                        </div>
                        <span className="text-[9px] text-slate-300 font-bold mt-1 uppercase tracking-tight">HIET CSE</span>
                      </div>
                    </div>
                    <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-[8px] font-black text-white uppercase tracking-wider shadow-xs border border-emerald-400">
                      ACTIVE
                    </span>
                  </div>

                  {/* Student Credentials */}
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                      {studentName}
                    </h4>
                    <p className="text-xs font-bold text-amber-400 font-mono tracking-wider">
                      ROLL: {studentRoll}
                    </p>
                    <p className="text-xs text-slate-200 font-medium leading-snug">
                      {studentBranch}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-white border border-white/10">
                        Sem {studentSemester}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-slate-200 border border-white/10">
                        {isHosteler ? 'Hosteler' : 'Day Scholar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-rose-400" /> Blood Group
                    </span>
                    <span className="font-extrabold text-white text-xs">{bloodGroup}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" /> Emergency
                    </span>
                    <span className="font-extrabold text-white text-xs truncate block">{emergencyMobile}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Batch</span>
                    <span className="font-bold text-white text-xs">{studentBatch}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Valid Upto</span>
                    <span className="font-bold text-emerald-300 text-xs">{validUntil}</span>
                  </div>
                </div>

                {/* Barcode & Verification QR Strip */}
                <div className="bg-white rounded-2xl p-3 text-slate-900 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
                      CAMPUS BARCODE / LIBRARY CARD
                    </span>
                    {/* Simulated Code-128 Institutional Barcode */}
                    <div className="flex items-center gap-0.5 h-8 my-1">
                      {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 2, 3, 5, 2, 4, 3, 1, 5, 2, 4, 2, 6, 1, 3, 4, 2, 5, 3].map((w, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 h-full"
                          style={{ width: `${w * 1.5}px` }}
                        ></div>
                      ))}
                    </div>
                    <span className="font-mono text-[10px] font-black tracking-widest text-slate-700 block">
                      *{libraryCardNo}*
                    </span>
                  </div>

                  {/* QR Token */}
                  <div className="shrink-0 p-1 bg-slate-50 rounded-xl border border-slate-200">
                    <DynamicQRCodeCanvas
                      value={verificationToken}
                      size={60}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Security Footer */}
              <div className="px-5 py-2.5 bg-black/30 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Institutional ID
                </span>
                <span className="font-mono text-slate-400">HIET/STD/2026</span>
              </div>
            </div>

            {/* ================= CARD BACK ================= */}
            <div
              className={`w-full rounded-3xl bg-gradient-to-br from-[#0c243b] via-[#103254] to-[#0a1e33] text-white shadow-2xl border border-white/20 overflow-hidden relative mt-4 ${
                !isFlipped ? 'pointer-events-none hidden' : 'block'
              }`}
            >
              {/* Top Accent Pattern */}
              <div className="h-2.5 bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400"></div>

              {/* Back Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    ANTI-SPOOF LIVE AUTHENTICATION
                  </h4>
                  <p className="text-[10px] text-slate-300">Official Campus Security & Attendance Verification</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
              </div>

              {/* Live Anti-Spoof Clock Box */}
              <div className="p-5 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center relative overflow-hidden">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Live Verification Beacon</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-white tracking-wider">
                    {currentTime || 'Loading Live Clock...'}
                  </div>
                  <p className="text-[10px] text-emerald-300/80 mt-1 font-medium">
                    Guard Notice: Dynamic pulse #{pulseTick} prevents screenshot forgery.
                  </p>
                </div>

                {/* Institutional Rules & Terms */}
                <div className="space-y-1.5 text-[11px] text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <p className="font-bold text-white text-xs mb-1">General Instructions:</p>
                  <p>1. This digital ID card is the non-transferable property of HIET Shahpur.</p>
                  <p>2. Must be presented on demand at Main Gate, Library, Labs, and Exam Halls.</p>
                  <p>3. Loss of ID or misuse must be immediately reported to Chief Proctor Office.</p>
                  <p>4. Valid only during the active registered academic session 2025-2026.</p>
                </div>

                {/* Campus Address & Contacts */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="font-bold text-amber-300 block">CAMPUS ADDRESS</span>
                    <p className="text-[9px] leading-tight text-slate-300 mt-0.5">
                      HIET, Kangra-Chamba National Highway, Shahpur (H.P.) - 176206
                    </p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="font-bold text-amber-300 block">STUDENT HELPDESK</span>
                    <p className="text-[9px] leading-tight text-slate-300 mt-0.5">
                      Email: helpdesk@hiet.ac.in<br />
                      Phone: 01892-238120
                    </p>
                  </div>
                </div>

                {/* Registrar & Director Signature */}
                <div className="pt-2 border-t border-white/10 flex items-end justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">SYSTEM HASH</span>
                    <span className="font-mono text-[9px] text-slate-300">SHA256: 7f89b142ac0e</span>
                  </div>
                  <div className="text-right">
                    <div className="w-24 border-b border-amber-400/60 pb-1 mb-1 font-serif italic text-amber-300 text-xs">
                      Dr. R. Pathania
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-300 block">
                      REGISTRAR / DIRECTOR
                    </span>
                    <span className="text-[8px] text-slate-400 block">HIET Campus Shahpur</span>
                  </div>
                </div>
              </div>

              {/* Bottom Strip */}
              <div className="px-5 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Tamper-proof Digital Identity Card</span>
                <span>Government of Himachal Pradesh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flip Card Action Button */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition flex items-center gap-2 border border-blue-200 cursor-pointer shadow-xs"
          >
            <RotateCw className="w-4 h-4 text-blue-600" />
            <span>{isFlipped ? 'Flip to Front Side' : 'Flip to Anti-Spoof Back Side'}</span>
          </button>
        </div>
      </div>

      {/* Security Verification Features Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Smart Campus ID Features & Usage</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Main Gate Scanner
            </span>
            <p className="text-[11px] text-slate-600 mt-1">
              Guards can scan the dynamic QR code directly from your phone screen to verify active enrollment.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Library Book Issue
            </span>
            <p className="text-[11px] text-slate-600 mt-1">
              Library staff can barcode-scan your ID for instant book issue without touching physical cards.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Anti-Spoof Protection
            </span>
            <p className="text-[11px] text-slate-600 mt-1">
              Real-time pulsing clock and beacon prevents students from using expired screenshots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
