import { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import HeaderPanel from './HeaderPanel';
import SideBar from './sidebar/Sidebar';
import BottomPanel from './BottomPanel';
import BodyContentPanel from './BodyContentPanel';
import BookmarksTabManager from '../manager/BookmarksTabManager';
import { FlexLayoutManager } from '../manager/FlexLayoutManager';
import { SidebarManager } from '../manager/SidebarManager';


interface DashboardLayoutProps {
  //onExport: () => void;
  //onImport: () => void;
  //onClearCache: () => void;
  //lastSaved: Date | null;
}

export default function DashboardLayout(props: Readonly<DashboardLayoutProps>) {
  //const { onExport, onImport, onClearCache, lastSaved } = props;
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'groups' | 'settings'>('bookmarks');

  // Memoize sidebar props for better performance
  const sidebarProps = useMemo(() => ({

  }), []);

  // Memoize control panel props
  const controlPanelProps = useMemo(() => ({
//    onExport,
 //   onImport,
 //   onClearCache,
 //   lastSaved,
    onThemeToggle: toggleTheme
  }), [toggleTheme]);

  return (
    <div
      className="dashboard-layout"
      data-theme={theme.name}
      style={{
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gridTemplateRows: '60px 1fr 40px',
        gridTemplateAreas: `
          "sidebar header"
          "sidebar main"
          "sidebar bottom"
        `,
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
        fontFamily: theme.fonts.family
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          gridArea: 'sidebar',
          borderRight: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.sidebarBackground
        }}
      >
        <SidebarManager />
      </div>

      {/* Header */}
      <div
        style={{
          gridArea: 'header',
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.headerBackground
        }}
      >
        <HeaderPanel
          activeTab={activeTab}
        />
      </div>

      {/* Main Content Area */}
      <BodyContentPanel>

        <FlexLayoutManager />

      </BodyContentPanel>

      {/* Bottom Panel */}
      <div
        style={{
          gridArea: 'bottom',
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.footerBackground
        }}
      >
        <BottomPanel {...controlPanelProps} />
      </div>
    </div>
  );
}
