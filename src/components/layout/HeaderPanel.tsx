import { useTheme } from '../../contexts/ThemeContext';
import { BookmarksTabConfig } from '../../types/bookmark';

interface HeaderPanelProps {
  activeTab: string;
}

export default function HeaderPanel({ activeTab }: HeaderPanelProps) {
  const { theme } = useTheme();


  return (
    <header
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        backgroundColor: theme.colors.headerBackground,
        borderBottom: `1px solid ${theme.colors.border}`,
        color: theme.colors.text.primary
      }}
    >
      The Header
    </header>
  );
}
