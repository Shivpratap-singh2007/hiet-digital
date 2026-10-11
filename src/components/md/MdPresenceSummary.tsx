import React, { useState } from 'react';
import { Briefcase, MapPin, QrCode } from 'lucide-react';
import { CampusPresenceRecord } from '../../types';

interface Props {
  presenceRecords: CampusPresenceRecord[];
  facultyCount: number;
  gatePassesToday: number;
  onNavigateTab?: (tab: any) => void;
}

export const MdPresenceSummary: React.FC<Props> = ({
  presenceRecords,
  facultyCount,
  gatePassesToday,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'faculty'>('students');

  // Compute student presence categories (mutually exclusive)
  const insideStudents = presenceRecords.filter(p => p.status === 'Present').length;
  const outsideStudents = presenceRecords.filter(p => p.status === 'Exited').length;
  const awayStudents = presenceRecords.filter(p => p.status === 'Away').length;
  const totalTrackedStudents = presenceRecords.length || 1;

  const nowFormatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date());

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Student & Faculty Presence
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">Campus Checkpoints & RFID Gate Telemetry</p>
        </div>

        {/* Compact Toggle Tabs */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-2.5 py-1 rounded-md transition ${
              activeTab === 'students'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            Students
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faculty')}
            className={`px-2.5 py-1 rounded-md transition ${
              activeTab === 'faculty'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            Faculty
          </button>
        </div>
      </div>

      {/* Tab 1: Students Presence */}
      {activeTab === 'students' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                Inside Campus
              </span>
              <span className="text-xl font-black font-mono text-emerald-950 dark:text-emerald-200 mt-1 block">
                {insideStudents}
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                {Math.round((insideStudents / totalTrackedStudents) * 100)}% of tracked
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block">
                Outside / Left
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-zinc-100 mt-1 block">
                {outsideStudents}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                {Math.round((outsideStudents / totalTrackedStudents) * 100)}% of tracked
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                Temporary Away
              </span>
              <span className="text-xl font-black font-mono text-amber-950 dark:text-amber-200 mt-1 block">
                {awayStudents}
              </span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                Grounds / Labs
              </span>
            </div>
          </div>

          {/* Movement Indicator (Separated from totals) */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#0f2942] dark:text-blue-400" />
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                Active Digital Gate Passes Issued Today
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
              {gatePassesToday} passes
            </span>
          </div>
        </div>
      ) : (
        /* Tab 2: Faculty Presence */
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-bold">
            <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Faculty Attendance & Duty Roster</span>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
            Faculty presence data is recorded through lecture room logs and institutional biometric registers. 
            All {facultyCount} appointed professors are on active duty schedule for the current academic session.
          </p>
          <div className="pt-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
            Automated RFID gate telemetry for staff is scheduled for Phase 2 hardware integration.
          </div>
        </div>
      )}

      {/* Footer Timestamp */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Last updated: Today, {nowFormatted} IST</span>
        </span>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('campus_presence')}
            className="font-bold text-[#0f2942] dark:text-blue-400 hover:underline"
          >
            Presence Map →
          </button>
        )}
      </div>
    </div>
  );
};
