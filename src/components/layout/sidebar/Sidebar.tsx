import { useTheme } from '../../../contexts/ThemeContext';
import { SidebarConfig } from '../../../types/sidebar';

interface SidebarProps {
  sideBarConfig: SidebarConfig;
}

export default function SideBar({ sideBarConfig }: SidebarProps) {
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
      Sidebar sgu
    </div>
  );
}
