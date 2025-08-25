import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import HeaderPanel from './HeaderPanel';
import SidebarManager from './sidebar/SidebarManager';
import BottomPanel from './BottomPanel';
import BodyContentPanel from './BodyContentPanel';
import { FlexLayoutManager } from '../flexlayout/FlexLayoutManager';
import { SidebarViewMode } from '../../types/sidebar';


interface DashboardLayoutProps {
}

export default function DashboardLayout(_props: Readonly<DashboardLayoutProps>) {
  const { theme } = useTheme();
  const [sidebarVisibility, setSidebarVisibility] = useState<SidebarViewMode>(SidebarViewMode.Visible);

  // Listen for toggle commands from HeaderPanel (Visible/Hidden)
  useEffect(() => {
    const onToggle = (e: Event) => {
      // support both: a bare toggle event (no detail) and an event carrying detail.visibility
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail?.visibility === 'string') {
        const visibility = detail.visibility as string;
        if (visibility === SidebarViewMode.Visible) {
          setSidebarVisibility(SidebarViewMode.Hidden);
        } else {
          setSidebarVisibility(SidebarViewMode.Visible);
        }
      }
      else {
        // no detail -> simple toggle
        setSidebarVisibility(v => v === SidebarViewMode.Visible ? SidebarViewMode.Hidden : SidebarViewMode.Visible);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-sidebar', onToggle as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('toggle-sidebar', onToggle as EventListener);
      }
    };
  }, []);

  // Broadcast sidebarVisibility so other parts can stay in sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar-visibility', { detail: { visibility: sidebarVisibility } }));
    }
  }, [sidebarVisibility]);

  return (
    <div
      className="dashboard-layout"
      data-theme={theme.name}
      style={{
        height: '100vh',
        display: 'grid',
        // keep the sidebar area in the grid at all times and collapse the first column to 0 when hidden
        gridTemplateColumns: sidebarVisibility === SidebarViewMode.Visible ? '250px 1fr' : '0 1fr',
        gridTemplateRows: '45px 1fr 40px',
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
      {/* Sidebar - always mounted so the layout can collapse the column via gridTemplateColumns */}
      <div
        style={{
          gridArea: 'sidebar',
          borderRight: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.sidebarBackground,
          overflow: 'hidden'
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
        <HeaderPanel />
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
        <BottomPanel />
      </div>
    </div>
  );
}
