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
    blue: 'bg-blue-50 dark:bg-blue-950/60 text-[#0f2942] dark:text-sky-300 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-[#0f2942] dark:hover:border-sky-500 hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
            {label}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0f2942] dark:text-white tracking-tight mt-1.5 font-mono">
            {value}
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[#0f2942] dark:text-sky-400 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          {subtext && <span className="truncate">{subtext}</span>}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
