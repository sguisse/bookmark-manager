import React from 'react';
import { Plus } from 'lucide-react';
import { SidebarConfig, SidebarMenuItem } from '../../../types/sidebar';
import { useTheme } from '../../../contexts/ThemeContext';
import { SimpleSidebarTree } from '../../common/treeview';

export interface SidebarPanelProps {
  sidebarConfig?: SidebarConfig;
  openedGroups?: Record<string, boolean>;
  selectedMenuItem?: SidebarMenuItem | null;
  onToggleGroup?: (id: string) => void;
  onSelectItem: (nodeId: string) => void;
  onAddBookmark: () => void;
  onAddGroup: (groupId?: string | null) => void;
  onSidebarChange?: (newConfig: SidebarConfig) => void;
  onMoveItem?: (sourceId: string, targetId: string | null, position?: 'before' | 'after' | 'inside', parentId?: string | null, targetIndex?: number) => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  sidebarConfig,
  openedGroups,
  selectedMenuItem,
  onToggleGroup,
  onSelectItem,
  onAddBookmark,
  onAddGroup,
  onSidebarChange,
  onMoveItem
}) => {
  const { theme } = useTheme();

  // Keep onMoveItem referenced to avoid unused prop TypeScript errors.
  React.useEffect(() => {
    // Intentionally empty — prop is kept for future integration with drag/drop logic
  }, [onMoveItem]);

  if (!sidebarConfig?.sidebarItems) {
    return <div>No sidebar configuration available</div>;
  }

  const handleSelectItem = (nodeId: string) => {
    onSelectItem(nodeId);
  };

  return (
    <aside className="app-sidebar" style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      backgroundColor: theme.colors.sidebarBackground,
      color: theme.colors.text.primary,
      padding: 12,
      boxSizing: 'border-box',
      borderRight: `1px solid ${theme.colors.border}`
    }}>
  {/* Header: title/logo */}
      <div id="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/app-icon.svg" alt="App" style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }} />
          <div style={{ fontSize: 20, fontWeight: 700 }}>Web Fusion</div>
        </div>
      </div>

      {/* Header separator aligned with the main header bottom (cf DashboardLayout header tall) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '43px',
          height: 2,
          background: theme.colors.border,
          pointerEvents: 'none'
        }}
      />

      <div className="sidebar-content">
        <SimpleSidebarTree
          sidebarConfig={sidebarConfig}
          onSelectItem={handleSelectItem}
          onSidebarChange={onSidebarChange}
        />

        {/* Minimal group toggles preview to use openedGroups/onToggleGroup props */}
        {openedGroups && onToggleGroup && (
          <div style={{ marginTop: 12 }}>
            {Object.keys(openedGroups).map(gid => (
              <div key={gid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => onToggleGroup(gid)} style={{ padding: 4, cursor: 'pointer' }}>{openedGroups[gid] ? 'Collapse' : 'Expand'}</button>
                <span style={{ fontSize: 12, color: theme.colors.text.secondary }}>{gid}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer" style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16
      }}>
        <button
          onClick={onAddBookmark}
          style={{
            width: '100%',
            padding: 8,
            backgroundColor: theme.colors.primary,
            color: theme.colors.background,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Plus size={16} />
          Add Bookmark
        </button>
      </div>
    </aside>
  );
};

export default SidebarPanel;
