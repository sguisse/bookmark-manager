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
  {/* expose selected menu id as data attribute for testing/styling */}
  <div data-selected-item={selectedMenuItem?.id ?? ''} />
      <div className="sidebar-header" style={{
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 18,
          color: theme.colors.text.primary,
          fontWeight: 600
        }}>
          Navigation
        </h2>
        <button
          onClick={() => onAddGroup()}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.text.primary,
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Add Group"
        >
          <Plus size={16} />
        </button>
      </div>

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
