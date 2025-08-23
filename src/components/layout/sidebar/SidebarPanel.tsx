import React, { useEffect, useState } from 'react';
import { SidebarService } from '../../../services/sidebarService';
import { SidebarConfig, SidebarMenuItem, SidebarCategory, SidebarMenuGroup, SidebarItemType } from '../../../types/sidebar';
import { useApplication } from '../../../contexts/ApplicationContext';
import { DynamicIcon } from 'lucide-react/dynamic';
import { useTheme } from '../../../contexts/ThemeContext';

export const SidebarPanel: React.FC = () => {
  type MenuNode = SidebarCategory | SidebarMenuGroup | SidebarMenuItem;

  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | undefined>(undefined);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  // UI state kept locally (not persisted in the SidebarConfig type)
  const [collapsedLocal, setCollapsedLocal] = useState<boolean>(false);
  const [visibleLocal, setVisibleLocal] = useState<boolean>(true);
  const { setSelectedMenuItem, selectedMenuItem } = useApplication();
  const { theme } = useTheme();

  useEffect(() => {
    try {
      const config: SidebarConfig | null = SidebarService.loadConfig();
      if (config) {
        setSidebarConfig(config);

        // Initialize openGroups from any group.expanded flags present in the saved config
        const initialOpen: Record<string, boolean> = {};
        const collectOpen = (items?: MenuNode[]) => {
          if (!items) return;
          for (const it of items) {
            if ('expanded' in it && it.expanded) initialOpen[it.id] = true;
            if ('children' in it && it.children) collectOpen(it.children as any);
          }
        };
        collectOpen(config.sidebarItems as any);
        setOpenGroups(initialOpen);

        // Migrate persisted UI flags from older saved config (if present) into local state
        const legacyCollapsed = (config as any).collapsed;
        if (typeof legacyCollapsed !== 'undefined') setCollapsedLocal(!!legacyCollapsed);
        const legacyVisible = (config as any).visible;
        if (typeof legacyVisible !== 'undefined') setVisibleLocal(!!legacyVisible);

        // restore last selected
        if (config.lastSelectedItemId) {
          const find = (items?: MenuNode[]): SidebarMenuItem | undefined => {
            if (!items) return undefined;
            for (const it of items) {
              if (it.id === config.lastSelectedItemId && !('children' in it)) return it;
              if ('children' in it && it.children) {
                const f = find(it.children as any);
                if (f) return f;
              }
            }
            return undefined;
          };
          const found = find(config.sidebarItems as any);
          if (found && setSelectedMenuItem) setSelectedMenuItem(found);
        }
      }
    } catch (error) {
      console.error('Failed to load sidebar config', error);
    }
  }, [setSelectedMenuItem]);

  // Small helper to render badge UI
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

    return (
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: item.badge.color || '#1976d2',
          display: 'inline-block',
          marginLeft: 4,
          boxShadow: '0 0 0 2px rgba(0,0,0,0.06)'
        }}
      />
    );
  };

  // Update the expanded flag for a group in the nested sidebar items (mutates a copy)
  const updateExpandedForId = (items: MenuNode[] | undefined, groupId: string, expanded: boolean) => {
    if (!items) return;
    for (const it of items) {
      if (it.id === groupId && 'expanded' in it) {
        (it as any).expanded = expanded;
      }
      if ('children' in it && it.children) updateExpandedForId(it.children as any, groupId, expanded);
    }
  };

  // Handler when a menu item is clicked: set selection and persist lastSelectedItemId
  const menuItemSelectionHandler = (id: string) => {
    // find the item
    const findItem = (items?: MenuNode[]): SidebarMenuItem | undefined => {
      if (!items) return undefined;
      for (const it of items) {
        if (it.id === id && !('children' in it)) return it as any;
        if ('children' in it && it.children) {
          const f = findItem(it.children as any);
          if (f) return f;
        }
      }
      return undefined;
    };
    const found = sidebarConfig ? findItem(sidebarConfig.sidebarItems as any) : undefined;
    if (found && setSelectedMenuItem) setSelectedMenuItem(found);
    if (sidebarConfig) {
      const updated = { ...sidebarConfig, lastSelectedItemId: id, lastUpdateDate: new Date() } as unknown as SidebarConfig;
      SidebarService.saveConfig(updated);
      setSidebarConfig(updated);
    }
  };

  // Toggle expansion for a group and persist the expanded flag in the config
  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (sidebarConfig) {
        const updatedConfig = { ...sidebarConfig } as SidebarConfig;
        updateExpandedForId(updatedConfig.sidebarItems as any, id, next[id]);
        SidebarService.saveConfig(updatedConfig);
        setSidebarConfig(updatedConfig);
      }
      return next;
    });
  };

  const toggleCollapsed = () => {
    setCollapsedLocal(c => !c);
  };

  // Small helper to convert hex color to rgba string with alpha
  const hexToRgba = (hex: string, alpha = 0.12) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Render items as full-width rows (no ul/li). Indentation is defined by item type:
  // - Category and its children: 10px from the beginning of the panel
  // - MenuGroup: 10px from the beginning of the panel
  // - MenuGroup children (menu items inside a group): 20px from the beginning of the panel
  const renderMenu = (items: Array<MenuNode> | undefined) => {
    if (!items || items.length === 0) return null;
    // render flattened rows preserving order and expansion
    const renderNodes = (nodes: MenuNode[], parentType?: SidebarItemType): React.ReactNode[] => {
      const out: React.ReactNode[] = [];
      for (const node of nodes) {
        out.push(renderMenuRow(node, parentType));
        const hasChildren = 'children' in node && !!node.children && (node.children as any).length > 0;
        if (hasChildren) {
          // Categories are non-collapsible: always render their children
          if (node.type === SidebarItemType.Category) {
            out.push(...renderNodes(node.children as any, node.type));
          } else {
            // For groups, render children only when expanded
            const isOpen = !!openGroups[node.id];
            if (isOpen) out.push(...renderNodes(node.children as any, node.type));
          }
        }
      }
      return out;
    };

    return <div>{renderNodes(items)}</div>;
  };

  // Render a single row for a node. Indentation is absolute from panel start based on type rules.
  const renderMenuRow = (item: MenuNode, parentType?: SidebarItemType): JSX.Element => {
    const hasChildren = 'children' in item && !!item.children && (item.children as any).length > 0;
    const isOpen = !!openGroups[item.id];
    const isSelected = !!(selectedMenuItem && selectedMenuItem.id === item.id);
    const collapsed = !!collapsedLocal;

    // Category header: non-clickable, styled like CoreUI nav-title
    if (item.type === SidebarItemType.Category) {
      // indent for category is always 10px
      const indent = 10;
      return (
        <div key={item.id} style={{ margin: '10px 0 6px 0' }}>
          <div
            style={{
              padding: '6px 8px',
              paddingLeft: indent,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: theme.colors.text.primary,
              opacity: 0.75
            }}
          >
            {item.title}
          </div>
        </div>
      );
    }

    // compute indent according to spec:
    // - Category rows and their children: 10px
    // - MenuGroup row itself: 10px
    // - MenuItem that is a child of a MenuGroup: 20px
    let indent = 10; // default
    if (item.type === SidebarItemType.MenuItem) {
      indent = parentType === SidebarItemType.MenuGroup ? 20 : 10;
    }

    // badge
    const badgeNode = buildBadgeNode(item as any, collapsed);

    // compute translucent selected background
    const alpha = theme.name === 'dark' ? 0.18 : 0.12;
    const selectedBackground = isSelected ? hexToRgba(theme.colors.primary, alpha) : 'transparent';

    return (
      <div key={item.id} style={{ margin: '6px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={item.type === SidebarItemType.MenuGroup ? () => toggleGroup(item.id) : () => menuItemSelectionHandler(item.id)}
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
              onClick={() => toggleGroup(item.id)}
              style={{ marginLeft: 8, fontSize: '1em', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={isOpen ? 'Collapse group' : 'Expand group'}
            >
              {isOpen ? '▾' : '▸'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Keep Render the icon for a menu item with DynamicIcon even if it's heavy
  const renderIcon = (icon?: string) => {
    if (!icon) return <DynamicIcon name="camera" color={theme.colors.text.primary} size={20} />;
    if (icon.startsWith('http')) {
      return <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
    }
    return <DynamicIcon name={icon as any} color={theme.colors.text.primary} size={20} />;
  };

  const collapsed = !!collapsedLocal;
  const visible = visibleLocal;

  const setVisible = (v: boolean) => {
    setVisibleLocal(v);
  };

  return (
    <>
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`} style={{
        position: 'relative',
        width: collapsed ? 0 : '100%',
        minHeight: '100vh',
        background: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.border}`,
        padding: 12,
        boxSizing: 'border-box',
        display: visible ? 'flex' : 'hidden',
        flexDirection: 'column'
      }}>
        {/* Header: sandwich button + title/logo */}
        <div id="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button aria-label={visible ? 'Hide sidebar' : 'Show sidebar'} onClick={() => setVisible(!visible)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>☰</button>
            {!collapsed && <div style={{ fontWeight: 700 }}>App</div>}
          </div>
          <div>
            <button onClick={toggleCollapsed} aria-pressed={collapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{collapsed ? '➤' : '◀'}</button>
          </div>
        </div>

  {/* Main nav */}
  <div
    id="sidebar-nav"
    style={{
      flex: 1,
      minHeight: 0, // allow flex child to shrink and enable scrolling
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}
  >
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
          <div id="sidebar-footer" style={{ marginTop: 12, borderTop: `1px solid ${theme.colors.border}`, paddingTop: 8, display: 'flex', gap: 8, justifyContent: 'right' }}>
            {sidebarConfig.footerItems.map(fi => (
              <button key={fi.id} title={fi.title} onClick={() => menuItemSelectionHandler(fi.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{renderIcon(fi.icon)}</button>
            ))}
          </div>
        )}
      </aside>

      {/* Floating opener when hidden */}
      {!visible && (
        <button aria-label="Open sidebar" onClick={() => setVisible(true)} style={{ position: 'fixed', left: 12, bottom: 12, width: 44, height: 44, borderRadius: 10, background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', cursor: 'pointer' }}>☰</button>
      )}
    </>
  );
};
