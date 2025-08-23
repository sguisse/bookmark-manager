import { useTheme } from '../../contexts/ThemeContext';
import { AlignJustify } from 'lucide-react';

interface HeaderPanelProps {
  activeTab?: string;
}

export default function HeaderPanel(_: Readonly<HeaderPanelProps>) {
  const { theme } = useTheme();

  const toggleSidebarFromHeader = () => {
    if (typeof window !== 'undefined') {
      // use a kebab-case event name for clarity
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    }
  };

  return (
    <header
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 5px',
        backgroundColor: theme.colors.headerBackground,
        borderBottom: `1px solid ${theme.colors.border}`,
        color: theme.colors.text.primary
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <button
          id="toggle-sidebar-button"
          aria-label="Toggle sidebar"
          onClick={toggleSidebarFromHeader}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'inline-flex', alignItems: 'center' }}
        >
          <AlignJustify size={25} color={theme.colors.text.primary} />
        </button>

        <div style={{ fontWeight: 700 }}>The Header</div>
      </div>
    </header>
  );
}
