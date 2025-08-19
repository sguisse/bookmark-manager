import React, { useState, useEffect } from 'react';

const themes = {
  light: {
    '--bg-primary': '#f8fafc',
    '--text-color': '#222',
    '--text-secondary': '#555',
    '--card-bg': '#fff',
    '--card-border': '#e5e7eb',
    '--hover-bg': '#e0e7ef',
    '--primary-color': '#2563eb',
    '--tooltip-bg': '#f3f4f6',
    '--tooltip-text': '#222',
    '--tooltip-border': '#d1d5db',
  },
  dark: {
    '--bg-primary': '#18181b',
    '--text-color': '#e1e1e1',
    '--text-secondary': '#9ca3af',
    '--card-bg': '#23272f',
    '--card-border': '#404040',
    '--hover-bg': '#23272f',
    '--primary-color': '#3b82f6',
    '--tooltip-bg': '#23272f',
    '--tooltip-text': '#e1e1e1',
    '--tooltip-border': '#374151',
  }
};

export const HeaderPanel: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const themeVars = themes[theme];
    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  return (
    <div className="dashboard-header-panel">
      <h1 className="header-title">Bookmark Manager</h1>
      <div className="header-controls">
        <label htmlFor="theme-select" className="header-label">Theme:</label>
        <select
          id="theme-select"
          value={theme}
          onChange={e => setTheme(e.target.value as 'light' | 'dark')}
          className="header-select"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  );
}
