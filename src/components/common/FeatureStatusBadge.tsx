import React from 'react';
import { AiFeatureStatus } from '../../config/aiFeatures';

interface FeatureStatusBadgeProps {
  status: AiFeatureStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const FeatureStatusBadge: React.FC<FeatureStatusBadgeProps> = ({
  status,
  className = '',
  size = 'sm'
}) => {
  const normalized = status.toLowerCase().replace(/[-\s]+/g, '_') as AiFeatureStatus;

  const getBadgeConfig = () => {
    switch (normalized) {
      case 'coming_soon':
        return {
          label: 'Coming Soon',
          classes:
            'bg-slate-100 dark:bg-[#181818] text-slate-700 dark:text-[#d4d4d4] border-slate-300/80 dark:border-[#2e2e2e]',
          dotColor: 'bg-slate-400 dark:bg-neutral-500'
        };
      case 'in_development':
        return {
          label: 'In Development',
          classes:
            'bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-sky-300 border-blue-200/80 dark:border-blue-900/60',
          dotColor: 'bg-blue-500'
        };
      case 'beta':
        return {
          label: 'Beta',
          classes:
            'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
          dotColor: 'bg-amber-500'
        };
      case 'available':
        return {
          label: 'Available',
          classes:
            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
          dotColor: 'bg-emerald-500'
        };
      case 'disabled':
      default:
        return {
          label: 'Disabled',
          classes:
            'bg-slate-100 dark:bg-[#141414] text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-[#262626]',
          dotColor: 'bg-slate-400'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-[10px] sm:text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border shadow-2xs select-none tracking-wide ${sizeClasses} ${config.classes} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      <span>{config.label}</span>
    </span>
  );
};
