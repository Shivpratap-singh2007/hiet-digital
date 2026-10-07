import React from 'react';
import { LucideIcon, FileX2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileX2,
  title,
  description = 'Try adjusting your search or filters.',
  action,
  className = ''
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#303030] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 shadow-2xs ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] text-slate-400 dark:text-[#858585] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-[#f5f5f5] tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          {action.icon && <action.icon className="w-3.5 h-3.5" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
