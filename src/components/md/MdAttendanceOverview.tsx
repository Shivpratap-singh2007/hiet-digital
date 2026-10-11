import React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface Props {
  attendanceRate: number;
  presentCount: number;
  totalRecords: number;
  periodLabel?: string;
  onNavigateTab?: (tab: any) => void;
}

export const MdAttendanceOverview: React.FC<Props> = ({
  attendanceRate,
  presentCount,
  totalRecords,
  periodLabel = 'Current Academic Session (2026–27)',
  onNavigateTab
}) => {
  const absentCount = Math.max(0, totalRecords - presentCount);
  const absentRate = 100 - attendanceRate;

  // SVG circular arc parameters
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const presentOffset = circumference - (circumference * attendanceRate) / 100;

  if (totalRecords === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Attendance Overview</h2>
        </div>
        <div className="py-10 text-center text-slate-400 dark:text-zinc-500 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
          <p className="text-xs font-medium">No institutional attendance sessions recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Attendance Overview
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">{periodLabel}</p>
        </div>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('principal_analytics')}
            className="text-xs font-bold text-[#0f2942] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Doughnut Chart & Legend Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
        {/* SVG Circular Doughnut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle track representing Absent slice */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="9"
              className="text-rose-100 dark:text-rose-950/40"
            />
            {/* Foreground circle arc representing Present slice */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={presentOffset}
              strokeLinecap="round"
              className="text-emerald-500 dark:text-emerald-400 transition-all duration-700 ease-out"
            />
          </svg>
          {/* Centered Percentage Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono tracking-tight">
              {attendanceRate}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Present Rate
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-3 w-full sm:w-auto text-xs">
          <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-zinc-200">Present (Compliant)</span>
            </div>
            <div className="text-right sm:ml-4">
              <span className="font-black font-mono text-slate-900 dark:text-zinc-100">{presentCount}</span>
              <span className="text-slate-400 dark:text-zinc-500 text-[11px] ml-1">({attendanceRate}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-zinc-200">Absent / Leave</span>
            </div>
            <div className="text-right sm:ml-4">
              <span className="font-black font-mono text-slate-900 dark:text-zinc-100">{absentCount}</span>
              <span className="text-slate-400 dark:text-zinc-500 text-[11px] ml-1">({absentRate}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
        <span>Evaluated from {totalRecords} total student session records</span>
        <span className="font-medium text-emerald-700 dark:text-emerald-400">HPTU Threshold: ≥75%</span>
      </div>
    </div>
  );
};
