import React, { useEffect, useState } from 'react';
import { SidebarService } from '../../../services/sidebarService';
import { SidebarConfig, SidebarMenuItem, SidebarCategory, SidebarMenuGroup } from '../../../types/sidebar';
import { useApplication } from '../../../contexts/ApplicationContext';
import { DynamicIcon } from 'lucide-react/dynamic';
import { useTheme } from '../../../contexts/ThemeContext';

export const SidebarPanel: React.FC = () => {
  type MenuNode = SidebarCategory | SidebarMenuGroup | SidebarMenuItem;
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | undefined>(undefined);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
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
        if (config.lastSelectedItemId) {
          // find and set selected
          const find = (items?: MenuNode[]): SidebarMenuItem | undefined => {
            if (!items) return undefined;
            for (const it of items) {
              if (it.id === config.lastSelectedItemId) {
                // only return leaf menu items (those without children)
                if (!('children' in it)) return it;
              }
              if ('children' in it && it.children) {
                const f = find(it.children as any);
                if (f) return f;
              }
            }
            return undefined;
          };
          const selected = find(config.sidebarItems);
          setSelectedMenuItem(selected || null);
        }
      }
    } catch (err) {
      console.warn('Failed to load sidebar config', err);
    }
  }, []);

  // Collapsed state (icons-only) persisted in sidebar config
  const toggleCollapsed = () => {
    if (!sidebarConfig) return;
    const newCfg = { ...sidebarConfig, collapsed: !sidebarConfig.collapsed };
    setSidebarConfig(newCfg);
    SidebarService.saveConfig(newCfg);
  };

  // Handler for menu item selection (recursive)
  function menuItemSelectionHandler(id: string) {
  function find(items?: MenuNode[]): SidebarMenuItem | undefined {
      if (!items) return undefined;
      for (const it of items) {
        if (it.id === id) {
          if (!('children' in it)) return it;
        }
        if ('children' in it && it.children) {
          const f = find(it.children as any);
          if (f) return f;
        }
      }
      return undefined;
    }
    const found = find(sidebarConfig?.sidebarItems as any);
    if (found) {
      setSelectedMenuItem(found);
      const newCfg = { ...(sidebarConfig as SidebarConfig), lastSelectedItemId: found.id, lastUpdateDate: new Date() };
      setSidebarConfig(newCfg);
      SidebarService.saveConfig(newCfg);
    } else {
      setSelectedMenuItem(null);
    }
  }

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const newOpen = { ...prev, [id]: !prev[id] };
      if (sidebarConfig) {
        const newCfg = { ...sidebarConfig, sidebarItems: updateExpandedForId(sidebarConfig.sidebarItems as any, id, !!newOpen[id]), lastUpdateDate: new Date() };
        setSidebarConfig(newCfg);
        SidebarService.saveConfig(newCfg);
      }
      return newOpen;
    });
  };

  // Helper to update expanded flag for a group id recursively
  const updateExpandedForId = (items: MenuNode[], groupId: string, expanded: boolean): MenuNode[] => {
    return items.map(it => {
      if (it.id === groupId && 'expanded' in it) {
        return { ...it, expanded } as MenuNode;
      }
      if ('children' in it && it.children) {
        return { ...it, children: updateExpandedForId(it.children as any, groupId, expanded) } as MenuNode;
      }
      return it;
    });
  };

  // Render the menu items
  const renderMenu = (items: Array<SidebarCategory | SidebarMenuGroup | SidebarMenuItem> | undefined, depth = 0) => {
    if (!items || items.length === 0) return null;
    return (
      <ul style={{ listStyle: 'none', paddingLeft: depth === 0 ? 8 : 16, margin: 0 }}>
        {items.map((item) => {
          // Treat an item without an icon but with children as a category (non-clickable header)
          const hasChildren = 'children' in item && !!item.children && (item.children as any).length > 0;
          const isCategory = hasChildren && !item.icon;
          const isOpen = !!openGroups[item.id];
          const isSelected = !!(selectedMenuItem && selectedMenuItem.id === item.id);
          const collapsed = !!sidebarConfig?.collapsed;

          if (isCategory) {
            // Render non-clickable section header for category type
            return (
              <li key={item.id} style={{ margin: '10px 0 6px 0' }}>
                <div style={{ padding: '6px 8px', fontSize: 12, fontWeight: 700, color: theme.colors.text.primary, opacity: 0.8 }}>{item.title}</div>
                {hasChildren && <div style={{ marginLeft: 8 }}>{renderMenu(item.children as any, depth + 1)}</div>}
              </li>
            );
          }

          // Prepare badge node to avoid nested ternaries in JSX
          // badgeNode — build conditionally with type narrowing
          let badgeNode: React.ReactNode = null;
          if ('badge' in item && item.badge) {
            if (!collapsed) {
              badgeNode = (
                <span style={{
                  marginLeft: 8,
                  background: item.badge.color || '#1976d2',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>{item.badge.label}</span>
              );
            } else {
              badgeNode = (
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: item.badge.color || '#1976d2',
                  display: 'inline-block',
                  marginLeft: 4,
                  boxShadow: '0 0 0 2px rgba(0,0,0,0.06)'
                }} />
              );
            }
          }

          return (
            <li key={item.id} id={item.id} style={{ margin: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => menuItemSelectionHandler(item.id)}
                  aria-current={isSelected ? 'true' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: isSelected ? theme.colors.surface : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: 6,
                    width: '100%',
                    textAlign: 'left'
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
              {hasChildren && isOpen && (
                <div style={{ marginLeft: 16 }}>
                  {renderMenu(item.children as any, depth + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
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

  const collapsed = !!sidebarConfig?.collapsed;
  const visible = sidebarConfig?.visible !== false;

  const setVisible = (v: boolean) => {
    if (!sidebarConfig) return;
    const newCfg = { ...sidebarConfig, visible: v };
    setSidebarConfig(newCfg);
    SidebarService.saveConfig(newCfg);
  };

  return (
    <>
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`} style={{
        position: 'relative',
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        background: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.border}`,
        padding: 12,
        boxSizing: 'border-box',
        display: visible ? 'flex' : 'none',
        flexDirection: 'column'
      }}>
        {/* Header: sandwich button + title/logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button aria-label={visible ? 'Hide sidebar' : 'Show sidebar'} onClick={() => setVisible(!visible)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>☰</button>
            {!collapsed && <div style={{ fontWeight: 700 }}>App</div>}
          </div>
          <div>
            <button onClick={toggleCollapsed} aria-pressed={collapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{collapsed ? '➤' : '◀'}</button>
          </div>
        </div>

  {/* Main nav */}
  <div style={{ flex: 1, overflow: 'auto' }}>
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
          <div style={{ marginTop: 12, borderTop: `1px solid ${theme.colors.border}`, paddingTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
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
