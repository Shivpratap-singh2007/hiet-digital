import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  themeMode: Theme; // backward compatibility
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  setThemeMode: (theme: Theme) => void; // backward compatibility
  toggleTheme: () => void;
}

const STORAGE_KEY = 'hiet-digital-campus-theme';
const LEGACY_STORAGE_KEY = 'hiet_theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.warn('Unable to access localStorage for theme:', e);
  }
  return 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyThemeToDocument(resolvedTheme: ResolvedTheme) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.add('light');
  }
  root.style.colorScheme = resolvedTheme;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const currentTheme = getInitialTheme();
    return currentTheme === 'system' ? getSystemTheme() : currentTheme;
  });

  useEffect(() => {
    const activeResolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(activeResolved);
    applyThemeToDocument(activeResolved);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        applyThemeToDocument(nextResolved);
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      // Legacy compatibility
      localStorage.setItem(LEGACY_STORAGE_KEY, newTheme);
      localStorage.setItem('hiet_theme', newTheme === 'system' ? getSystemTheme() : newTheme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode: theme,
        resolvedTheme,
        setTheme,
        setThemeMode: setTheme,
        toggleTheme
      }}
    >
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
