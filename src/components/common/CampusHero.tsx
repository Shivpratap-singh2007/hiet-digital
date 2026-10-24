import React, { useState } from 'react';
import { Building, ShieldCheck, MapPin } from 'lucide-react';

export interface CampusHeroSummaryItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  variant?: 'default' | 'warning' | 'success';
}

interface CampusHeroProps {
  userName: string;
  roleLabel: string;
  subtitle?: string;
  departmentOrBranch?: string;
  idNumber?: string;
  summaryItems?: CampusHeroSummaryItem[];
}

export const CampusHero: React.FC<CampusHeroProps> = ({
  userName,
  roleLabel,
  subtitle,
  departmentOrBranch,
  idNumber,
  summaryItems = []
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full space-y-4">
      {/* Visual Campus Hero Banner */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#D7DEE8] dark:border-slate-800 bg-[#0B2545] shadow-xs group">
        {/* Main Campus Photograph */}
        {!imageError ? (
          <div className="relative w-full h-44 sm:h-52 md:h-60 overflow-hidden">
            <img
              src="/images/hiet_campus.jpg"
              alt="HIET Group of Institutions campus"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
              loading="eager"
            />
            {/* Subtle Gradient Overlay for Text Contrast & Institutional Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/90 via-[#0B2545]/40 to-transparent pointer-events-none" />
            
            {/* Verified Campus Tag */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[11px] font-semibold text-[#123D70] dark:text-sky-300 border border-white/40 shadow-xs">
              <MapPin className="w-3 h-3 text-[#123D70] dark:text-sky-400 shrink-0" />
              <span>Vidyanagar, Shahpur • Kangra (H.P.)</span>
            </div>

            {/* Overlaid Welcome Headline at base of image */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-5 sm:right-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-[#123D70]/80 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-sky-200 border border-sky-400/30">
                  {roleLabel}
                </span>
                {departmentOrBranch && (
                  <span className="text-[11px] text-slate-200 font-medium truncate hidden xs:inline">
                    • {departmentOrBranch}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-xs">
                Welcome back, {userName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200/90 font-medium mt-0.5 line-clamp-1 max-w-2xl drop-shadow-xs">
                {subtitle || 'Your campus, academics and college updates — all in one place.'}
              </p>
            </div>
          </div>
        ) : (
          /* Fallback Institutional Banner if asset is unreachable */
          <div className="p-6 sm:p-8 bg-gradient-to-br from-[#0B2545] to-[#123D70] text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
                  HIET Group of Institutions
                </span>
                <div className="text-xs text-slate-200">
                  Vidyanagar, Shahpur, Kangra (H.P.)
                </div>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-3">
              Welcome back, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1">
              {subtitle || 'Your campus, academics and college updates — all in one place.'}
            </p>
          </div>
        )}
      </div>

      {/* Institutional ID & Status Bar (Minimal, uncluttered) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-[#172B4D] dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-[#123D70] dark:text-sky-400 shrink-0" />
          <span className="font-semibold">{roleLabel}:</span>
          <span className="font-bold">{userName}</span>
          {idNumber && (
            <span className="text-[#64748B] dark:text-slate-400 font-mono text-[11px] ml-1">
              ({idNumber})
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
          Himachal Institute of Engineering & Technology
        </div>
      </div>

      {/* Small Number of Essential Summary Items (Only when useful) */}
      {summaryItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {summaryItems.map((item, index) => {
            const Icon = item.icon;
            const isClickable = Boolean(item.onClick);
            const isWarning = item.variant === 'warning';
            const isSuccess = item.variant === 'success';

            return (
              <div
                key={index}
                onClick={item.onClick}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') item.onClick?.(); } : undefined}
                className={`p-3.5 rounded-xl border transition-all text-left ${
                  isWarning
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                    : isSuccess
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-[#D7DEE8] dark:border-slate-800 text-[#172B4D] dark:text-slate-100 hover:border-[#123D70] dark:hover:border-slate-700'
                } ${isClickable ? 'cursor-pointer hover:shadow-2xs active:scale-[0.99]' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 truncate">
                    {item.label}
                  </span>
                  {Icon && (
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${
                      isWarning ? 'text-rose-600' : isSuccess ? 'text-emerald-600' : 'text-[#123D70] dark:text-sky-400'
                    }`} />
                  )}
                </div>
                <div className="text-base sm:text-lg font-extrabold tracking-tight truncate">
                  {item.value}
                </div>
                {item.subtext && (
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
                    {item.subtext}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
