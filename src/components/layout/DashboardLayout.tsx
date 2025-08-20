import { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useBookmarks } from '../../contexts/BookmarkContext';
import HeaderPanel from './HeaderPanel';
import Sidebar from './Sidebar';
import BottomPanel from './BottomPanel';
import BodyContentPanel from './BodyContentPanel';
import FlexLayoutManager from './FlexLayoutManager';
import FlexTabForm from '../common/FlexTabForm';

interface DashboardLayoutProps {
  onExport: () => void;
  onImport: () => void;
  onClearCache: () => void;
  lastSaved: Date | null;
}

export default function DashboardLayout(props: Readonly<DashboardLayoutProps>) {
  const { onExport, onImport, onClearCache, lastSaved } = props;
  const { theme, toggleTheme } = useTheme();
  const { groups, selectedGroupId, setSelectedGroup } = useBookmarks();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'groups' | 'settings'>('bookmarks');

  // Memoize sidebar props for better performance
  const sidebarProps = useMemo(() => ({
    groups,
    selectedGroupId,
    onSelectGroup: setSelectedGroup,
    activeTab,
    onTabChange: setActiveTab
  }), [groups, selectedGroupId, setSelectedGroup, activeTab]);

  // Memoize control panel props
  const controlPanelProps = useMemo(() => ({
    onExport,
    onImport,
    onClearCache,
    lastSaved,
    onThemeToggle: toggleTheme
  }), [onExport, onImport, onClearCache, lastSaved, toggleTheme]);

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
        <Sidebar {...sidebarProps} />
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
          selectedGroup={groups.find(g => g.id === selectedGroupId)}
        />
      </div>

      {/* Main Content Area */}
      <BodyContentPanel>
        {activeTab === 'bookmarks' && (
          <div style={{ height: '100%', padding: '1rem' }}>
            <FlexLayoutManager />
          </div>
        )}

        {activeTab === 'groups' && (
          <div style={{ height: '100%', padding: '1rem' }}>
            <FlexTabForm />
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ height: '100%', padding: '1rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: theme.colors.text.secondary
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>⚙️</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: theme.colors.text.primary }}>
                Layout Settings
              </h3>
              <p style={{ margin: 0, fontSize: theme.fonts.sizes.small }}>
                Advanced layout configuration coming soon
              </p>
            </div>
          </div>
        )}
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
