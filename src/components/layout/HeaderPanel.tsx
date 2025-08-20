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

interface HeaderPanelProps {
  onAddGroup?: () => void;
  onExportLayout?: () => void;
  onImportLayout?: () => void;
}

export const HeaderPanel: React.FC<HeaderPanelProps> = ({ onAddGroup, onExportLayout, onImportLayout }) => {
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
      <div className="header-controls-right">
        <button
          className="header-icon-btn"
          title="Exporter le layout"
          onClick={onExportLayout}
        >
          {/* Export SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.2em', height: '1.2em' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button
          className="header-icon-btn"
          title="Importer le layout"
          onClick={onImportLayout}
        >
          {/* Import SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.2em', height: '1.2em' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
        <button
          className="header-icon-btn"
          title="Ajouter un groupe"
          onClick={onAddGroup}
        >
          {/* Plus SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.2em', height: '1.2em' }}>
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
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
};
