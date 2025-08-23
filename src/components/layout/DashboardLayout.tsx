import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import HeaderPanel from './HeaderPanel';
import SideBar from './sidebar/SidebarPanel';
import BottomPanel from './BottomPanel';
import BodyContentPanel from './BodyContentPanel';
import BookmarksTabManager from '../bookmark/BookmarksTabManager';
import { FlexLayoutManager } from '../flexlayout/FlexLayoutManager';
import { SidebarPanel } from './sidebar/SidebarPanel';


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
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);

  useEffect(() => {
    const onSidebar = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (typeof detail?.visible === 'boolean') setSidebarVisible(detail.visible);
      } catch (err) {
        // ignore
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('sidebar-visibility', onSidebar as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('sidebar-visibility', onSidebar as EventListener);
      }
    };
  }, []);

  // Listen for toggle commands from HeaderPanel and toggle sidebar visibility
  useEffect(() => {
    const onToggle = () => setSidebarVisible(v => !v);
    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-sidebar', onToggle as EventListener);
      window.addEventListener('toggleSidebar', onToggle as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('toggle-sidebar', onToggle as EventListener);
        window.removeEventListener('toggleSidebar', onToggle as EventListener);
      }
    };
  }, []);

  // Broadcast sidebarVisible so other parts can stay in sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar-visibility', { detail: { visible: sidebarVisible } }));
    }
  }, [sidebarVisible]);

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
        gridTemplateColumns: sidebarVisible ? '250px 1fr' : '0 1fr',
        gridTemplateRows: '60px 1fr 40px',
        gridTemplateAreas: sidebarVisible ? `
          "sidebar header"
          "sidebar main"
          "sidebar bottom"
        ` : `
          "header"
          "main"
          "bottom"
        `,
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
        fontFamily: theme.fonts.family
      }}
    >
      {/* Sidebar */}
      {sidebarVisible && (
        <div
          style={{
            gridArea: 'sidebar',
            borderRight: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.sidebarBackground
          }}
        >
          <SidebarPanel />
        </div>
      )}

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
