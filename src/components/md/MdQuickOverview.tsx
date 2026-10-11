import React from 'react';
import { Users, Briefcase, Building, Award, ArrowRight } from 'lucide-react';

interface Props {
  totalStudents: number;
  totalFaculty: number;
  activeDepartments: number;
  activeHods: number;
  onNavigateTab?: (tab: any) => void;
}

export const MdQuickOverview: React.FC<Props> = ({
  totalStudents,
  totalFaculty,
  activeDepartments,
  activeHods,
  onNavigateTab
}) => {
  const rows = [
    {
      label: 'Total Students',
      value: totalStudents,
      subtext: 'Enrolled in 5 Streams',
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40'
    },
    {
      label: 'Total Faculty',
      value: totalFaculty,
      subtext: 'Teaching Roster (Unique)',
      icon: Briefcase,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40'
    },
    {
      label: 'Active Departments',
      value: activeDepartments,
      subtext: 'Accredited Branches',
      icon: Building,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40'
    },
    {
      label: 'Active HOD Assignments',
      value: activeHods,
      subtext: 'Appointed Department Heads',
      icon: Award,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40'
    }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Quick Overview
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">Institutional baseline summary</p>
        </div>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('department')}
            className="text-xs font-bold text-[#0f2942] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${row.bgColor} ${row.iconColor} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                    {row.label}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {row.subtext}
                  </span>
                </div>
              </div>
              <span className="text-base font-black font-mono text-slate-900 dark:text-zinc-100">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
