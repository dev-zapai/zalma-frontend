import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getStoredTheme, setStoredTheme, applyTheme } from '@/shared/lib/darkMode';

/**
 * Light/dark toggle for the dashboard header. Persists per browser and
 * flips the `dark` class on <html> immediately.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredTheme);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="theme-toggle"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
    >
      {theme === 'dark'
        ? <Sun className="h-[18px] w-[18px]" />
        : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
