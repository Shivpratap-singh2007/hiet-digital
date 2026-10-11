import React from 'react';
import { Users, Briefcase, Building, Award } from 'lucide-react';

interface Props {
  totalStudents: number;
  totalFaculty: number;
  activeDepartments: number;
  activeHods: number;
  onNavigateTab?: (tab: any) => void;
}

export const MdTopKpiCards: React.FC<Props> = ({
  totalStudents,
  totalFaculty,
  activeDepartments,
  activeHods,
  onNavigateTab
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Students - Soft Blue */}
      <div 
        onClick={() => onNavigateTab?.('department')}
        className="rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs
          bg-[#eff6ff] border-[#dbeafe] text-[#1e3a8a]
          dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total Students</span>
          <div className="w-9 h-9 rounded-xl bg-blue-100/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 tracking-tight">
            {totalStudents}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
            Enrolled Students
          </div>
        </div>
      </div>

      {/* 2. Total Faculty - Soft Lavender */}
      <div 
        onClick={() => onNavigateTab?.('department')}
        className="rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs
          bg-[#f5f3ff] border-[#ede9fe] text-[#4c1d95]
          dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total Faculty</span>
          <div className="w-9 h-9 rounded-xl bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 tracking-tight">
            {totalFaculty}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
            Teaching Faculty (Unique)
          </div>
        </div>
      </div>

      {/* 3. Departments - Soft Mint */}
      <div 
        onClick={() => onNavigateTab?.('department')}
        className="rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs
          bg-[#ecfdf5] border-[#d1fae5] text-[#065f46]
          dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Departments</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 tracking-tight">
            {activeDepartments}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
            Active Departments
          </div>
        </div>
      </div>

      {/* 4. HODs - Soft Peach */}
      <div 
        onClick={() => onNavigateTab?.('department')}
        className="rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs
          bg-[#fffbeb] border-[#fef3c7] text-[#92400e]
          dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total HODs</span>
          <div className="w-9 h-9 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 tracking-tight">
            {activeHods}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
            Assigned Departments
          </div>
        </div>
      </div>
    </div>
  );
};
