import React from 'react';
import { X, Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AppearanceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (!isOpen) return null;

  const options: Array<{
    id: ThemeMode;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'light',
      title: 'Light Mode (Default)',
      description: 'Professional institutional theme with white surfaces, clean grey backgrounds, and navy accents.',
      icon: Sun
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      description: 'High-contrast institutional dark mode with deep navy and charcoal surfaces.',
      icon: Moon
    },
    {
      id: 'system',
      title: 'System Preference',
      description: 'Automatically adjust based on your operating system light/dark theme preference.',
      icon: Laptop
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#D7DEE8] dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 my-auto">
        <div className="flex items-center justify-between border-b border-[#D7DEE8] dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#172B4D] dark:text-white">
              Appearance & Theme
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Customize the visual appearance of HIET Digital Campus
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {options.map(opt => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-sky-950/40 border-[#123D70] dark:border-sky-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-[#D7DEE8] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  isSelected 
                    ? 'bg-[#123D70] text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172B4D] dark:text-white">
                      {opt.title}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#123D70] dark:text-sky-400">
                        <Check className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[#D7DEE8] dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-[#64748B] dark:text-slate-400">
            Current render: <strong className="capitalize text-[#172B4D] dark:text-slate-200">{resolvedTheme} mode</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#123D70] hover:bg-[#0B2545] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
