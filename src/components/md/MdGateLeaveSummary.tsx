import React from 'react';
import { ArrowRightLeft, FileText, ArrowRight } from 'lucide-react';

interface Props {
  gatePassesToday: number;
  leavesSubmittedToday: number;
  totalPendingLeaves: number;
  onNavigateTab?: (tab: any) => void;
}

export const MdGateLeaveSummary: React.FC<Props> = ({
  gatePassesToday,
  leavesSubmittedToday,
  totalPendingLeaves,
  onNavigateTab
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Gate Pass & Leaves
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">Today • Asia/Kolkata</p>
        </div>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-bold text-[#0f2942] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Subcard A: Gate Passes Issued */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-bold">Gate Passes</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">
              {gatePassesToday}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              Approved & issued today
            </div>
          </div>
        </div>

        {/* Subcard B: Leave Applications */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-bold">Leave Requests</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">
              {leavesSubmittedToday}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              {totalPendingLeaves} in review pipeline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
