import React, { useState, useRef } from 'react';
import { School, ShieldCheck, QrCode, Phone, MapPin, Sparkles, RefreshCw } from 'lucide-react';
import { Profile } from '../../types';

interface Props {
  profile: Profile;
}

export const HoloIDCard3D: React.FC<Props> = ({ profile }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const student = profile.studentMaster;
  const teacher = profile.teacherMaster;
  const isTeacher = profile.role === 'teacher' || profile.role === 'hod';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -16;
    const rotateY = ((x - centerX) / centerX) * 16;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.4
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-full px-2 py-1">
      {/* 3D Scene Perspective Box - Fits completely inside 320px - 412px mobile viewports */}
      <div
        className="w-full max-w-[320px] h-[202px] sm:h-[215px] cursor-pointer mx-auto select-none"
        style={{ perspective: '1200px' }}
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={cardRef}
          className="relative w-full h-full rounded-2xl shadow-xl transition-transform duration-300"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y + (isFlipped ? 180 : 0)}deg) scale3d(1.01, 1.01, 1.01)`
          }}
        >
          {/* FRONT SIDE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between text-white overflow-hidden select-none border border-amber-400/40 shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)'
            }}
          >
            {/* Holographic Specular Sheen Layer */}
            <div
              className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-200"
              style={{
                opacity: glare.opacity,
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4), transparent 45%), linear-gradient(115deg, transparent 20%, rgba(255,215,0,0.2) 40%, rgba(0,255,255,0.2) 60%, transparent 80%)`
              }}
            />

            {/* Top Bar with Official HIET Crest */}
            <div className="flex items-center justify-between z-10 gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/95 p-0.5 flex items-center justify-center font-bold shadow-md ring-1 ring-white/50 shrink-0">
                  <img src="/images/hiet_crest.png" alt="HIET Crest" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-300 truncate">
                    Himachal Institute
                  </h4>
                  <span className="text-[8px] sm:text-[9px] text-blue-200 block tracking-tight truncate">
                    Engineering & Technology • HPTU
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[8px] sm:text-[9px] font-bold shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                <span>3D SMART ID</span>
              </div>
            </div>

            {/* Middle Section: Avatar + Details */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 z-10 my-0.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-blue-950 font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300/80">
                  {profile.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <ShieldCheck className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-extrabold text-xs sm:text-sm text-white truncate tracking-tight">
                  {profile.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-semibold text-amber-300 truncate mt-0.5">
                  {isTeacher
                    ? `${teacher?.designation || 'Faculty'} • ${teacher?.department || 'CSE'}`
                    : `${student?.course || 'B.Tech'} ${student?.branch || 'CSE'} (Sem ${student?.semester || 6})`
                  }
                </p>
                <div className="inline-flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] text-blue-200 mt-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur max-w-full truncate">
                  <span>ID:</span>
                  <span className="font-bold text-white">
                    {isTeacher ? teacher?.faculty_id || 'FAC-CSE-02' : student?.roll_no || '210101'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Bar with Gold Chip & Digital Gate Pass QR */}
            <div className="flex items-center justify-between pt-1 border-t border-white/15 z-10 text-[8px] sm:text-[9px]">
              <div className="flex items-center gap-1.5 min-w-0">
                {/* 3D Smart Sim Chip */}
                <div className="w-6 h-4 sm:w-7 sm:h-4.5 rounded bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200 shadow-2xs flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-2 border border-amber-800/40 rounded-2xs" />
                </div>
                <span className="text-slate-300 font-mono text-[8px] sm:text-[9px] truncate">SMART PASS</span>
              </div>

              <div className="flex items-center gap-1 bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                <span className="font-mono text-white text-[8px] sm:text-[9px]">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between text-white overflow-hidden select-none border border-slate-700 shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)'
            }}
          >
            {/* Magnetic Black Stripe */}
            <div className="w-full h-6 sm:h-7 bg-slate-950 -mx-3.5 -mt-3.5 sm:-mx-4 sm:-mt-4 border-b border-slate-700 flex items-center justify-end px-3.5 sm:px-4">
              <span className="font-mono text-[7px] sm:text-[8px] text-slate-500">HIET-AUTHPASS-V2 // RFID</span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] my-1">
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-slate-400 block text-[8px]">Blood Group:</span>
                <span className="font-bold text-amber-400">B +ve</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-slate-400 block text-[8px]">Emergency:</span>
                <span className="font-bold text-white truncate block">+91 1892-237200</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10 col-span-2">
                <span className="text-slate-400 block text-[8px]">Campus Address:</span>
                <span className="text-slate-200 text-[8px] sm:text-[9px] truncate block">Shahpur, Kangra, HP - 176206</span>
              </div>
            </div>

            {/* Bottom Signature & Notice */}
            <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[7px] sm:text-[8px] text-slate-400">
              <span>Valid till: June 2027</span>
              <span className="font-serif italic font-bold text-slate-200">Director Signature</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
        <RefreshCw className="w-3 h-3 text-amber-500 shrink-0" />
        <span>Tap card to flip • 3D Motion active</span>
      </div>
    </div>
  );
};
