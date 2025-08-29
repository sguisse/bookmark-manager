import React from 'react';
import Image from '../../common/image/Image';
import { SidebarConfig } from '../../../types/sidebar';
import { useTheme } from '../../../contexts/ThemeContext';
import { SidebarTreeRenderer } from './SidebarTreeRenderer';

export interface SidebarPanelProps {
  sidebarConfig?: SidebarConfig;
  onSelectItem: (nodeId: string) => void;
  onAddBookmark: () => void;
  onSidebarChange?: (newConfig: SidebarConfig) => void;
  onMoveItem?: (sourceId: string, targetId: string | null, position?: 'before' | 'after' | 'inside', parentId?: string | null, targetIndex?: number) => void;
  onEditItem?: (nodeId: string) => void;
  onDeleteItem?: (nodeId: string) => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  sidebarConfig,
  onSelectItem,
  onAddBookmark,
  onSidebarChange,
  onMoveItem,
  onEditItem,
  onDeleteItem
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
      padding: '8px 5px 5px 5px',
      boxSizing: 'border-box',
      borderRight: `1px solid ${theme.colors.border}`
    }}>
  {/* Header: title/logo */}
      <div id="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/app-icon.svg" alt="App" style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }} />
          <div style={{ fontSize: 20, fontWeight: 700 }}>Web Fusion</div>
        </div>

        <button
          onClick={onAddBookmark}
          className="sidebar-toggle-btn"
        >
          <Image value="Plus" size={14} rounded={false} />

        </button>
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
        <SidebarTreeRenderer
          sidebarConfig={sidebarConfig}
          onSelectItem={handleSelectItem}
          onSidebarChange={onSidebarChange}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      </div>

      <div className="sidebar-footer" style={{
        position: 'absolute',
        bottom: 10,
        left: 16,
        right: 16,
        textAlign: 'center',
        fontSize: 14,
        color: theme.colors.text.secondary
      }}>
        Todo: Define the footer
      </div>
    </aside>
  );
};

export default SidebarPanel;
