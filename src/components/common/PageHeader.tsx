import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  breadcrumb?: BreadcrumbItem[];
  title: string;
  description?: string;
  subtitle?: string;
  badge?: string | { label: string; variant?: string };
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  breadcrumb,
  title,
  description,
  subtitle,
  badge,
  actions
}) => {
  const activeBreadcrumbs = breadcrumbs || breadcrumb;
  const activeDescription = description || subtitle;
  const badgeLabel = typeof badge === 'object' && badge ? badge.label : badge;

  return (
    <div className="space-y-3 mb-6">
      {/* Breadcrumbs */}
      {activeBreadcrumbs && activeBreadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1 hover:text-[#0f2942] dark:hover:text-white transition cursor-pointer" onClick={activeBreadcrumbs[0]?.onClick}>
            <Home className="w-3.5 h-3.5" />
          </span>
          {activeBreadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
              {crumb.active || !crumb.onClick ? (
                <span className="font-semibold text-slate-900 dark:text-white truncate">{crumb.label}</span>
              ) : (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="hover:text-[#0f2942] dark:hover:text-white transition truncate font-medium text-slate-500 dark:text-slate-400"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0f2942] dark:text-white tracking-tight">
              {title}
            </h1>
            {badgeLabel && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0f2942] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                {badgeLabel}
              </span>
            )}
          </div>
          {activeDescription && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {activeDescription}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
