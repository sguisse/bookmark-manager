import { useTheme } from '../../contexts/ThemeContext';
import { BookmarksTabConfig } from '../../types/bookmark';

interface SidebarProps {

}

export default function Sidebar({

}: SidebarProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.sidebarBackground,
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.family
      }}
    >
      Sidebar
    </div>
  );
}
