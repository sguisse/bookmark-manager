import { Menu, Sun, Moon } from 'lucide-react';
import { useApplication } from '../../contexts/ApplicationContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderPanelProps {}

export default function HeaderPanel(_props: Readonly<HeaderPanelProps>) {
  const { selectedMenuItem } = useApplication();
  const { isDarkMode, toggleTheme } = useTheme();

  const toggleSidebarFromHeader = () => {
    if (typeof window !== 'undefined') {
      // use a kebab-case event name for clarity
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    }
  };

  // toggles theme using ThemeContext
  const handleThemeToggle = () => {
    toggleTheme();
  };

  const headerTitle = selectedMenuItem?.title || 'Welcome';

  return (
    <header className="header-panel">
      <section
        className="header-content"
        aria-label="Header"
        onDragOver={(e) => {
          // allow drop when dragging bookmarks folder
          if (e.dataTransfer && (Array.from(e.dataTransfer.types || []).includes('application/x-bookmarks-folder') || Array.from(e.dataTransfer.types || []).includes('text/plain'))) {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={(e) => {
          console.log('Dropped data:', e.dataTransfer?.getData('text/plain'));

          const raw = (e.dataTransfer?.getData('application/x-bookmarks-folder') || e.dataTransfer?.getData('text/plain') || '').trim();
          if (!raw) return;
          let payload: { title?: string; urls?: string[] } = { title: raw, urls: [] };
          // only attempt to parse if the payload looks like JSON
          if (raw.startsWith('{') || raw.startsWith('[')) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') payload = parsed;
          }
          window.dispatchEvent(new CustomEvent('app:header:dropped-bookmarks', { detail: payload }));
        }}
      >
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleThemeToggle();
              }}
              className="sidebar-toggle-btn"
              aria-label="Toggle theme"
              title={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
  </section>
    </header>
  );
}
