import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';

type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  theme: ResolvedTheme; // backward compatibility
  setThemeMode: (mode: ThemeMode) => void;
  setTheme: (mode: ThemeMode) => void; // alias
  toggleTheme: () => void; // toggles light <-> dark
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default MUST be LIGHT MODE according to Master Specification Section 4 & 5
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('hiet_theme_mode');
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
      return 'light'; // STRICT DEFAULT IS LIGHT MODE
    } catch {
      return 'light';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const updateTheme = () => {
      let activeTheme: ResolvedTheme = 'light';
      if (themeMode === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeTheme = systemDark ? 'dark' : 'light';
      } else {
        activeTheme = themeMode;
      }

      setResolvedTheme(activeTheme);
      const root = document.documentElement;
      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }
    };

    updateTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('hiet_theme_mode', mode);
      localStorage.setItem('hiet_theme', mode === 'system' ? 'light' : mode);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      resolvedTheme, 
      theme: resolvedTheme, 
      setThemeMode, 
      setTheme: setThemeMode,
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
