import React from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { SidebarConfig, SidebarMenuItem, SidebarCategory, SidebarMenuGroup, SidebarItemType } from '../../../types/sidebar';
import { useTheme } from '../../../contexts/ThemeContext';
import { hexToRgba } from '../../../services/Utils';

export type MenuNode = SidebarCategory | SidebarMenuGroup | SidebarMenuItem;

export interface SidebarPanelProps {
  sidebarConfig?: SidebarConfig;
  openedGroups: Record<string, boolean>;
  selectedMenuItem?: SidebarMenuItem | null;
  onToggleGroup: (id: string) => void;
  onSelectItem: (id: string) => void;
  onCreateItem?: () => void;
  onMoveItem?: (sourceId: string, targetId: string | null) => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  sidebarConfig,
  openedGroups,
  selectedMenuItem,
  onToggleGroup,
  onSelectItem,
  onCreateItem,
  onMoveItem,
}) => {
  const { theme } = useTheme();
  const collapsed = false;
  const [draggedItem, setDraggedItem] = React.useState<{ id: string; type: SidebarItemType; title: string; icon?: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = React.useState<string | null>(null);
  const [dropPosition, setDropPosition] = React.useState<'before' | 'after' | 'inside'>('inside');

  const renderIcon = (icon?: string) => {
    if (!icon) return <DynamicIcon name="camera" color={theme.colors.text.primary} size={20} />;
    if (icon.startsWith('http')) {
      return <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
    }
    return <DynamicIcon name={icon as any} color={theme.colors.text.primary} size={20} />;
  };

  const buildBadgeNode = (item: any, collapsed: boolean) => {
    if (!item?.badge) return null;
    if (!collapsed) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 8px',
            borderRadius: 999,
            background: item.badge.color || '#3399ff',
            color: '#fff',
            fontSize: 12,
            marginLeft: 8
          }}
        >
          {item.badge.label}
        </span>
      );
    }

    return <span />;
  };

  const renderMenuRow = (item: MenuNode, parentType?: SidebarItemType): JSX.Element => {
    const hasChildren = 'children' in item && !!item.children && (item.children as any).length > 0;
    const isOpen = !!openedGroups[item.id];
    const isSelected = !!(selectedMenuItem && selectedMenuItem.id === item.id);

    if (item.type === SidebarItemType.Category) {
      const indent = 10;
      const isValidDropTarget = draggedItem && (
        draggedItem.type === SidebarItemType.MenuGroup ||
        draggedItem.type === SidebarItemType.MenuItem
      );
      const isDragOver = dragOverTarget === item.id;

      return (
        <div key={item.id}
             style={{
               margin: '10px 0 6px 0',
               position: 'relative'
             }}
             draggable
             onDragStart={(e) => {
               setDraggedItem({ id: item.id, type: item.type, title: item.title, icon: item.icon });
               e.dataTransfer.setData('application/x-sidebar-item', JSON.stringify({ id: item.id, type: item.type }));
               e.dataTransfer.effectAllowed = 'move';
             }}
             onDragEnd={() => {
               setDraggedItem(null);
               setDragOverTarget(null);
               setDropPosition('inside');
             }}
             onDragOver={(e) => {
               if (draggedItem && (draggedItem.type === SidebarItemType.MenuGroup || draggedItem.type === SidebarItemType.MenuItem)) {
                 e.preventDefault();
                 setDragOverTarget(item.id);

                 // Determine drop position based on mouse position
                 const rect = e.currentTarget.getBoundingClientRect();
                 const mouseY = e.clientY - rect.top;
                 const elementHeight = rect.height;

                 if (mouseY < elementHeight * 0.25) {
                   setDropPosition('before');
                 } else if (mouseY > elementHeight * 0.75) {
                   setDropPosition('after');
                 } else {
                   setDropPosition('inside');
                 }
               }
             }}
             onDragLeave={() => {
               setDragOverTarget(null);
               setDropPosition('inside');
             }}
             onDrop={(e) => {
               e.stopPropagation();
               setDragOverTarget(null);
               setDropPosition('inside');
               const data = e.dataTransfer.getData('application/x-sidebar-item');
               if (!data) return;
               const payload = JSON.parse(data);
               if (onMoveItem && (payload.type === SidebarItemType.MenuGroup || payload.type === SidebarItemType.MenuItem)) {
                 onMoveItem(payload.id, item.id);
               }
             }}
        >
          {/* Drop preview before */}
          {isDragOver && isValidDropTarget && dropPosition === 'before' && draggedItem && (
            <div
              style={{
                position: 'relative',
                margin: '3px 0',
                opacity: 0.5,
                transform: 'scale(0.95)',
                border: '2px dashed #3b82f6',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.1)'
              }}
            >
              <div style={{
                padding: '6px 8px',
                paddingLeft: indent,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {renderIcon(draggedItem.icon)}
                {draggedItem.title}
              </div>
            </div>
          )}

          {/* Drop preview after */}
          {isDragOver && isValidDropTarget && dropPosition === 'after' && draggedItem && (
            <div
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: 0,
                right: 0,
                margin: '3px 0',
                opacity: 0.5,
                transform: 'scale(0.95)',
                border: '2px dashed #3b82f6',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.1)',
                zIndex: 1000
              }}
            >
              <div style={{
                padding: '6px 8px',
                paddingLeft: indent,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {renderIcon(draggedItem.icon)}
                {draggedItem.title}
              </div>
            </div>
          )}

          <div
            style={{
              padding: '6px 8px',
              paddingLeft: indent,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: theme.colors.text.primary,
              opacity: 0.75,
              backgroundColor: isDragOver && isValidDropTarget && dropPosition === 'inside' ? hexToRgba(theme.colors.primary, 0.1) : 'transparent',
              borderRadius: 4,
              border: isDragOver && isValidDropTarget && dropPosition === 'inside' ? `1px dashed ${theme.colors.primary}` : 'none'
            }}
          >
            {item.title}
          </div>
        </div>
      );
    }

    let indent = 10;
    if (item.type === SidebarItemType.MenuItem) {
      indent = parentType === SidebarItemType.MenuGroup ? 20 : 10;
    }

    const badgeNode = buildBadgeNode(item as any, collapsed);
    const alpha = theme.name === 'dark' ? 0.18 : 0.12;
    const selectedBackground = isSelected ? hexToRgba(theme.colors.primary, alpha) : 'transparent';

    // Determine if this item is a valid drop target
    const isValidDropTarget = draggedItem && (
      draggedItem.type === SidebarItemType.MenuItem || // MenuItem can go anywhere except inside another MenuItem
      draggedItem.type === SidebarItemType.MenuGroup // MenuGroup can go anywhere
    );

    // Menu items cannot be dropped inside other menu items
    const canDropInside = draggedItem && item.type !== SidebarItemType.MenuItem;
    const isDragOver = dragOverTarget === item.id;

    return (
      <div key={item.id}
           style={{
             margin: '6px 0',
             position: 'relative'
           }}
           draggable
           onDragStart={(e) => {
             setDraggedItem({ id: item.id, type: item.type, title: item.title, icon: item.icon });
             e.dataTransfer.setData('application/x-sidebar-item', JSON.stringify({ id: item.id, type: item.type }));
             e.dataTransfer.effectAllowed = 'move';
           }}
           onDragEnd={() => {
             setDraggedItem(null);
             setDragOverTarget(null);
             setDropPosition('inside');
           }}
           onDragOver={(e) => {
             if (draggedItem && draggedItem.id !== item.id && isValidDropTarget) {
               e.preventDefault();
               setDragOverTarget(item.id);

               // Determine drop position based on mouse position
               const rect = e.currentTarget.getBoundingClientRect();
               const mouseY = e.clientY - rect.top;
               const elementHeight = rect.height;

               if (mouseY < elementHeight * 0.3) {
                 setDropPosition('before');
               } else if (mouseY > elementHeight * 0.7) {
                 setDropPosition('after');
               } else if (canDropInside) {
                 setDropPosition('inside');
               } else {
                 setDropPosition('after'); // Default to after if can't drop inside
               }
             }
           }}
           onDragLeave={() => {
             setDragOverTarget(null);
             setDropPosition('inside');
           }}
           onDrop={(e) => {
             e.stopPropagation();
             setDragOverTarget(null);
             setDropPosition('inside');
             const data = e.dataTransfer.getData('application/x-sidebar-item');
             if (!data) return;
             const payload = JSON.parse(data);

             if (onMoveItem && payload.id !== item.id) {
               onMoveItem(payload.id, item.id);
             }
           }}
      >
        {/* Drop preview before */}
        {isDragOver && isValidDropTarget && dropPosition === 'before' && draggedItem && (
          <div
            style={{
              position: 'relative',
              margin: '3px 0',
              opacity: 0.5,
              transform: 'scale(0.95)',
              border: '2px dashed #3b82f6',
              borderRadius: '4px',
              background: 'rgba(59, 130, 246, 0.1)'
            }}
          >
            <div style={{
              padding: '6px 8px',
              paddingLeft: item.type === SidebarItemType.MenuItem && parentType === SidebarItemType.MenuGroup ? 20 : 10,
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 500
            }}>
              {renderIcon(draggedItem.icon)}
              {draggedItem.title}
            </div>
          </div>
        )}

        {/* Drop preview after */}
        {isDragOver && isValidDropTarget && dropPosition === 'after' && draggedItem && (
          <div
            style={{
              position: 'absolute',
              bottom: '-40px',
              left: 0,
              right: 0,
              margin: '3px 0',
              opacity: 0.5,
              transform: 'scale(0.95)',
              border: '2px dashed #3b82f6',
              borderRadius: '4px',
              background: 'rgba(59, 130, 246, 0.1)',
              zIndex: 1000
            }}
          >
            <div style={{
              padding: '6px 8px',
              paddingLeft: item.type === SidebarItemType.MenuItem && parentType === SidebarItemType.MenuGroup ? 20 : 10,
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 500
            }}>
              {renderIcon(draggedItem.icon)}
              {draggedItem.title}
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: isDragOver && isValidDropTarget && dropPosition === 'inside' && canDropInside ? hexToRgba(theme.colors.primary, 0.1) : 'transparent',
          borderRadius: 4,
          border: isDragOver && isValidDropTarget && dropPosition === 'inside' && canDropInside ? `1px dashed ${theme.colors.primary}` : 'none',
          padding: isDragOver && isValidDropTarget && dropPosition === 'inside' && canDropInside ? '2px' : '0'
        }}>
          <button
            type="button"
            onClick={item.type === SidebarItemType.MenuGroup ? () => onToggleGroup(item.id) : () => onSelectItem(item.id)}
            aria-current={item.type === SidebarItemType.MenuItem && isSelected ? 'true' : undefined}
            aria-expanded={(() => {
              if (item.type !== SidebarItemType.MenuGroup) return undefined;
              return isOpen ? 'true' : 'false';
            })()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: selectedBackground,
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 6,
              width: '100%',
              textAlign: 'left',
              color: theme.colors.text.primary,
              fontWeight: isSelected ? 700 : 500,
              transition: 'background 120ms ease, color 120ms ease',
              paddingLeft: indent
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {renderIcon(item.icon)}
              {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{item.title}</span>}
              {badgeNode}
            </div>
          </button>
          {hasChildren && !collapsed && (
            <button
              type="button"
              onClick={() => onToggleGroup(item.id)}
              style={{ marginLeft: 8, fontSize: '1em', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 4 }}
              aria-label={isOpen ? 'Collapse group' : 'Expand group'}
            >
              {isOpen ? (
                <ChevronDown aria-hidden="true" size={18} color={theme.colors.text.primary} />
              ) : (
                <ChevronRight aria-hidden="true" size={18} color={theme.colors.text.primary} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderMenu = (items: MenuNode[] | undefined) => {
    if (!items || items.length === 0) return null;
    const renderNodes = (nodes: MenuNode[], parentType?: SidebarItemType): React.ReactNode[] => {
      const out: React.ReactNode[] = [];
      for (const node of nodes) {
        out.push(renderMenuRow(node, parentType));
        const hasChildren = 'children' in node && !!node.children && (node.children as any).length > 0;
        if (hasChildren) {
          if (node.type === SidebarItemType.Category) {
            out.push(...renderNodes(node.children as any, node.type));
          } else {
            const isOpen = !!openedGroups[node.id];
            if (isOpen) out.push(...renderNodes(node.children as any, node.type));
          }
        }
      }
      return out;
    };
    return <div>{renderNodes(items)}</div>;
  };



  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`} style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      background: theme.colors.surface,
      borderRight: `1px solid ${theme.colors.border}`,
      padding: 12,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
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

      {/* Toolbar: add button on the right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 0, maxHeight: 20 }}>
        <button
          type="button"
          onClick={() => onCreateItem && onCreateItem()}
          title="Add item"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, borderRadius: 6 }}
        >
          <Plus size={18} color={theme.colors.text.primary} />
        </button>
      </div>

      {/* Main nav */}
      <div
        id="sidebar-nav"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: 4,
          borderRadius: 4,
          border: dragOverTarget === 'root' ? `2px dashed ${theme.colors.primary}` : '2px solid transparent',
          backgroundColor: dragOverTarget === 'root' ? hexToRgba(theme.colors.primary, 0.05) : 'transparent',
          transition: 'border-color 200ms ease, background-color 200ms ease'
        }}
        onDragOver={(e) => {
          if (draggedItem && (draggedItem.type === SidebarItemType.Category || draggedItem.type === SidebarItemType.MenuGroup)) {
            e.preventDefault();
            setDragOverTarget('root');
          }
        }}
        onDragLeave={(e) => {
          // Only clear if we're leaving the nav area entirely
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverTarget(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverTarget(null);
          setDropPosition('inside');
          const data = e.dataTransfer.getData('application/x-sidebar-item');
          if (!data) return;
          const payload = JSON.parse(data);

          if (onMoveItem && (payload.type === SidebarItemType.Category || payload.type === SidebarItemType.MenuGroup)) {
            onMoveItem(payload.id, null); // Move to root
          }
        }}
      >
        {dragOverTarget === 'root' && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '16px',
              right: '16px',
              textAlign: 'center',
              color: theme.colors.primary,
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px',
              backgroundColor: hexToRgba(theme.colors.primary, 0.1),
              borderRadius: 4,
              border: `1px solid ${theme.colors.primary}`,
              zIndex: 5
            }}
          >
            Drop here to move to root level
          </div>
        )}

        {sidebarConfig ? (
          <nav aria-label="Sidebar configuration">
            {renderMenu(sidebarConfig.sidebarItems)}
          </nav>
        ) : (
          <div>No sidebar configuration found.</div>
        )}
      </div>

      {/* Footer (icons-only area) */}
      {sidebarConfig?.footerItems && sidebarConfig.footerItems.length > 0 && (
  <div id="sidebar-footer" style={{ marginTop: 12, borderTop: `0px solid ${theme.colors.border}`, paddingTop: 8, display: 'flex', gap: 8, justifyContent: 'right' }}>
          {sidebarConfig.footerItems.map(fi => (
            <button key={fi.id} title={fi.title} onClick={() => onSelectItem(fi.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{renderIcon(fi.icon)}</button>
          ))}
        </div>
      )}
    </aside>
  );
};

export default SidebarPanel;
