import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all ${className}`}
      role="group"
      aria-label="Theme mode switcher"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          resolvedTheme === 'light'
            ? 'bg-white text-amber-600 shadow-2xs font-bold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Light Mode"
        aria-pressed={resolvedTheme === 'light'}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="hidden sm:inline text-[11px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          resolvedTheme === 'dark'
            ? 'bg-slate-950 dark:bg-slate-800 text-sky-400 shadow-2xs font-bold border border-slate-700/80'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Dark Mode"
        aria-pressed={resolvedTheme === 'dark'}
      >
        <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="hidden sm:inline text-[11px]">Dark</span>
      </button>
    </div>
  );
};
