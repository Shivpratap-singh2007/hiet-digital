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
    blue: 'bg-blue-50 text-[#0f2942] border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-[#0f2942] hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
            {label}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight mt-1.5 font-mono">
            {value}
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[#0f2942] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
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
