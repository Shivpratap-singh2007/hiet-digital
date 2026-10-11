import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeColor = 'blue',
  onClick,
  className = ''
}) => {
  const badgeClasses = {
    blue: 'bg-blue-50 dark:bg-sky-500/10 text-[#0f2942] dark:text-sky-400 border-blue-200 dark:border-sky-500/25',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/25',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/70'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-[#0f2942] dark:hover:border-slate-700 hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-tight">
          {label}
        </span>
        {Icon && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-[#0f2942] dark:text-sky-300 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-2">
        <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
          {value}
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeClasses[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
