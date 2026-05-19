import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface ThemeContextValue {
  theme: string;
  setTheme: (name: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  availableThemes: ['light', 'dark'],
});

const STORAGE_KEY = 'taiga-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  });

  const setTheme = useCallback((name: string) => {
    setThemeState(name);
    localStorage.setItem(STORAGE_KEY, name);
    document.documentElement.setAttribute('data-theme', name);
  }, []);

  // Sync on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: ['light', 'dark'] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
