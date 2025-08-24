import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { useApplication } from '../../contexts/ApplicationContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderPanelProps {}

export default function HeaderPanel(props: Readonly<HeaderPanelProps>) {
  const { selectedMenuItem } = useApplication();
  const { isDarkMode, toggleTheme } = useTheme();

  const toggleSidebarFromHeader = () => {
    if (typeof window !== 'undefined') {
      // use a kebab-case event name for clarity
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    }
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = event.target.value as 'light' | 'dark';
    if ((selectedTheme === 'light' && isDarkMode) || 
        (selectedTheme === 'dark' && !isDarkMode)) {
      toggleTheme();
    }
  };

  const headerTitle = selectedMenuItem?.title || 'Bookmark Manager';

  return (
    <div className="header-panel">
      <div className="header-content">
        <div className="header-left">
          <button
            onClick={toggleSidebarFromHeader}
            className="sidebar-toggle-btn"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="header-title">{headerTitle}</h1>
        </div>
        
        <div className="header-right">
          <div className="theme-switcher">
            <select
              className="theme-select"
              value={isDarkMode ? 'dark' : 'light'}
              onChange={handleThemeChange}
              aria-label="Select theme"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <ChevronDown size={14} className="theme-select-arrow" />
          </div>
        </div>
      </div>
    </div>
  );
}
