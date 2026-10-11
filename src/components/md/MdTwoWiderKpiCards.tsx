import React from 'react';
import { CheckCircle2, Award, Info } from 'lucide-react';

interface Props {
  attendanceRate: number;
  academicPerformance: string;
  onNavigateTab?: (tab: any) => void;
}

export const MdTwoWiderKpiCards: React.FC<Props> = ({
  attendanceRate,
  academicPerformance,
  onNavigateTab
}) => {
  const isCompliant = attendanceRate >= 75;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Overall Attendance - Mint Tinted */}
      <div 
        onClick={() => onNavigateTab?.('principal_analytics')}
        className="rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs
          bg-[#f0fdf4] border-[#bbf7d0] text-emerald-950
          dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Overall Attendance</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Current Academic Term (2026–27)</p>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            isCompliant 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}>
            {isCompliant ? 'Compliant (≥75%)' : 'Warning (<75%)'}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-emerald-200/40 dark:border-zinc-800">
          <div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 tracking-tight">
              {attendanceRate}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Campus academic attendance denominator (HPTU statutory standard)</span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline">
            View Analytics →
          </span>
        </div>
      </div>

      {/* 2. Academic Performance - Lavender Tinted */}
      <div 
        onClick={() => onNavigateTab?.('academic_catalog')}
        className="rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs
          bg-[#faf5ff] border-[#e9d5ff] text-purple-950
          dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Academic Performance</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Published Sessional Examinations</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
            Benchmark Met
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-purple-200/40 dark:border-zinc-800">
          <div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 tracking-tight">
              {academicPerformance}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Average sessional pass rate across verified engineering branches</span>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-800 dark:text-purple-400 hover:underline">
            Academic Catalog →
          </span>
        </div>
      </div>
    </div>
  );
};
