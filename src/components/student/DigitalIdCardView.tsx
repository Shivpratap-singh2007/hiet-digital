import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Printer, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Maximize2, 
  Minimize2,
  Phone,
  Droplet
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
  const [logoError, setLogoError] = useState(false);

  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const studentRoll = student?.roll_no || '26CSE001';
  const studentBranch = student?.branch || 'ECE';
  const studentSemester = student?.semester || 1;
  const studentBatch = student?.academic_year || '2023 - 2027';
  const bloodGroup = 'B+';
  const emergencyMobile = student?.parent_phone || student?.phone || '+91 98160 99882';
  const validUntil = '31 July 2027';
  const libraryCardNo = `LIB-${studentRoll}`;
  const verificationToken = `HIET-ID-${studentRoll}-VERIFIED-2026`;
  const studentAvatar = student?.avatar_url || user?.avatar_url;

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
    <div className={`space-y-6 font-sans ${isFullscreen ? 'fixed inset-0 z-50 bg-[#111827]/95 backdrop-blur-md p-4 sm:p-8 flex flex-col items-center justify-center overflow-y-auto' : ''}`}>
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
            badge="HPTU Approved • Verified Identity"
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F2942] border border-[#E2E8F0] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>{isFlipped ? 'Show Front' : 'Flip to Back'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F2942] border border-[#E2E8F0] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>Gate Mode</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-[#0F2942] hover:bg-[#183B56] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
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
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Security Gate Full-Screen Inspection</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-bold border border-white/20 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      )}

      {/* 3D Flip Card Container */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="w-full max-w-sm sm:max-w-md relative [perspective:1000px]">
          {/* CARD BODY */}
          <div
            className="w-full transition-transform duration-500 relative [transform-style:preserve-3d]"
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* ================= CARD FRONT ================= */}
            <div
              className={`w-full rounded-3xl bg-[#0F2942] text-white shadow-2xl border border-[#183B56] overflow-hidden [backface-visibility:hidden] [webkit-backface-visibility:hidden] transition-opacity duration-300 ${
                isFlipped ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'
              }`}
            >
              {/* Top Accent Divider */}
              <div className="h-2 bg-[#183B56] border-b border-white/10"></div>

              {/* Header with College Crest & Institutional Details */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white p-1 border border-white/20 flex items-center justify-center shrink-0 shadow-sm">
                    {!logoError ? (
                      <img
                        src="/images/hiet_crest.png"
                        alt="HIET College Official Logo"
                        onError={() => setLogoError(true)}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-[#0F2942]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-wider uppercase text-white">
                      HIET DIGITAL CAMPUS
                    </h3>
                    <p className="text-[10px] text-slate-300 font-semibold tracking-tight">
                      Himachal Institute of Engg. & Technology, Shahpur
                    </p>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      Affiliated to HPTU Hamirpur • AICTE Approved
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/20">
                    STUDENT
                  </span>
                </div>
              </div>

              {/* Main Info Section */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex gap-4 items-center">
                  {/* Photo with Institutional Navy Frame */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-[#183B56] p-0.5 border border-white/25 shadow-md">
                      <div className="w-full h-full rounded-[14px] bg-[#111827] flex flex-col items-center justify-center overflow-hidden relative">
                        {studentAvatar ? (
                          <img
                            src={studentAvatar}
                            alt={studentName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#183B56] flex items-center justify-center text-white font-black text-xl border border-white/20 shadow-inner">
                              {studentName.charAt(0)}
                            </div>
                            <span className="text-[9px] text-slate-300 font-bold mt-1 uppercase tracking-tight">HIET {student?.branch || 'CAMPUS'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Active Verified Badge */}
                    <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-[#183B56] text-[8px] font-black text-white uppercase tracking-wider shadow-sm border border-white/30 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-white" />
                      ACTIVE
                    </span>
                  </div>

                  {/* Student Credentials */}
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                      {studentName}
                    </h4>
                    <p className="text-xs font-bold text-slate-200 font-mono tracking-wider">
                      ROLL: {studentRoll}
                    </p>
                    <p className="text-xs text-slate-300 font-medium leading-snug">
                      {studentBranch}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-white border border-white/15">
                        Sem {studentSemester}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-slate-300 border border-white/15">
                        {isHosteler ? (student?.hostel_name ? `Hostel • ${student.hostel_name}` : 'Hosteler') : 'Day Scholar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-slate-300" /> Blood Group
                    </span>
                    <span className="font-extrabold text-white text-xs">{bloodGroup}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-300" /> Emergency
                    </span>
                    <span className="font-extrabold text-white text-xs truncate block">{emergencyMobile}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Batch</span>
                    <span className="font-extrabold text-white text-xs">{studentBatch}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Valid Upto</span>
                    <span className="font-extrabold text-white text-xs">{validUntil}</span>
                  </div>
                </div>

                {/* Barcode & Verification QR Strip */}
                <div className="bg-white rounded-2xl p-3 text-[#111827] flex items-center justify-between gap-3 shadow-md border border-[#E2E8F0]">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase text-[#64748B] tracking-wider block">
                      CAMPUS BARCODE / LIBRARY CARD
                    </span>
                    {/* Simulated Code-128 Institutional Barcode */}
                    <div className="flex items-center gap-0.5 h-8 my-1">
                      {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 2, 3, 5, 2, 4, 3, 1, 5, 2, 4, 2, 6, 1, 3, 4, 2, 5, 3].map((w, idx) => (
                        <div
                          key={idx}
                          className="bg-[#111827] h-full"
                          style={{ width: `${w * 1.5}px` }}
                        ></div>
                      ))}
                    </div>
                    <span className="font-mono text-[10px] font-black tracking-widest text-[#111827] block truncate">
                      *{libraryCardNo}*
                    </span>
                  </div>

                  {/* QR Token */}
                  <div className="shrink-0 p-1.5 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs">
                    <DynamicQRCodeCanvas
                      value={verificationToken}
                      size={60}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Security Footer */}
              <div className="px-5 py-2.5 bg-[#111827]/70 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-300" /> Verified Institutional ID
                </span>
                <span className="font-mono text-slate-400">HIET/STD/2026</span>
              </div>
            </div>

            {/* ================= CARD BACK ================= */}
            <div
              className={`w-full rounded-3xl bg-[#0F2942] text-white shadow-2xl border border-[#183B56] overflow-hidden [backface-visibility:hidden] [webkit-backface-visibility:hidden] transition-opacity duration-300 ${
                isFlipped ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
              style={{
                transform: 'rotateY(180deg)'
              }}
            >
              {/* Top Accent Divider */}
              <div className="h-2 bg-[#183B56] border-b border-white/10"></div>

              {/* Back Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    ANTI-SPOOF LIVE AUTHENTICATION
                  </h4>
                  <p className="text-[10px] text-slate-300">Official Campus Security & Attendance Verification</p>
                </div>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
              </div>

              {/* Live Anti-Spoof Clock Box */}
              <div className="p-5 space-y-4">
                <div className="p-4 rounded-2xl bg-[#111827]/80 border border-white/15 text-center relative overflow-hidden">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300 text-xs font-black uppercase tracking-wider mb-1">
                    <Clock className="w-3.5 h-3.5 text-white animate-spin" />
                    <span>Live Verification Beacon</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-white tracking-wider">
                    {currentTime || 'Loading Live Clock...'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
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
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="font-bold text-white block uppercase tracking-wider text-[10px]">CAMPUS ADDRESS</span>
                    <p className="text-[9px] leading-tight text-slate-300 mt-0.5">
                      HIET, Kangra-Chamba National Highway, Shahpur (H.P.) - 176206
                    </p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="font-bold text-white block uppercase tracking-wider text-[10px]">STUDENT HELPDESK</span>
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
                    <div className="w-24 border-b border-white/30 pb-1 mb-1 font-serif italic text-white text-xs">
                      Dr Arjun Kumar
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-200 block">
                      REGISTRAR / DIRECTOR
                    </span>
                    <span className="text-[8px] text-slate-400 block">HIET Campus Shahpur</span>
                  </div>
                </div>
              </div>

              {/* Bottom Strip */}
              <div className="px-5 py-2.5 bg-[#111827]/70 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Tamper-proof Digital Identity Card</span>
                <span>Government of Himachal Pradesh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flip Card Action Button */}
        <div className="mt-4 flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-5 py-2.5 rounded-xl bg-[#0F2942] hover:bg-[#183B56] text-white text-xs font-bold transition flex items-center gap-2 border border-[#183B56] cursor-pointer shadow-sm"
          >
            <RotateCw className="w-4 h-4 text-white" />
            <span>{isFlipped ? 'Flip to Front Side' : 'Flip to Anti-Spoof Back Side'}</span>
          </button>
        </div>
      </div>

      {/* Security Verification Features Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3 print:hidden">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0F2942]" />
          <span>Smart Campus ID Features & Usage</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#111827] block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F2942]" /> Main Gate Scanner
            </span>
            <p className="text-[11px] text-[#64748B] mt-1">
              Guards can scan the dynamic QR code directly from your phone screen to verify active enrollment.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#111827] block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F2942]" /> Library Book Issue
            </span>
            <p className="text-[11px] text-[#64748B] mt-1">
              Library staff can barcode-scan your ID for instant book issue without touching physical cards.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#111827] block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F2942]" /> Anti-Spoof Protection
            </span>
            <p className="text-[11px] text-[#64748B] mt-1">
              Real-time pulsing clock and beacon prevents students from using expired screenshots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
