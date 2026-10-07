import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-9 h-9 rounded-xl text-slate-600 dark:text-[#d4d4d4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1a1a] flex items-center justify-center transition border border-transparent hover:border-slate-200 dark:hover:border-[#303030] focus:outline-hidden cursor-pointer"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${resolvedTheme})`}
        aria-label="Toggle theme appearance"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-[#e0e0e0]" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2e2e2e] shadow-xl py-1.5 z-50 animate-scale-in text-xs">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-[#888888] uppercase tracking-wider">
            Theme
          </div>

          <button
            type="button"
            onClick={() => handleSelect('light')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-[#202020] cursor-pointer ${
              theme === 'light'
                ? 'font-bold text-[#0f2942] dark:text-white'
                : 'text-slate-700 dark:text-[#d4d4d4]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Light
            </span>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#0f2942] dark:text-white" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('dark')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-[#202020] cursor-pointer ${
              theme === 'dark'
                ? 'font-bold text-[#0f2942] dark:text-white'
                : 'text-slate-700 dark:text-[#d4d4d4]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-[#e0e0e0]" />
              Dark
            </span>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#0f2942] dark:text-white" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('system')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-[#202020] cursor-pointer ${
              theme === 'system'
                ? 'font-bold text-[#0f2942] dark:text-white'
                : 'text-slate-700 dark:text-[#d4d4d4]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-[#a0a0a0]" />
              System
            </span>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#0f2942] dark:text-white" />}
          </button>
        </div>
      )}
    </div>
  );
};
