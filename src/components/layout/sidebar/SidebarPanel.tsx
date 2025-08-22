import React, { useEffect, useState } from 'react';
import { SidebarService } from '../../../services/sidebarService';
import { SidebarConfig, SidebarMenuItem } from '../../../types/sidebar';
import { useApplication } from '../../../contexts/ApplicationContext';
import { DynamicIcon } from 'lucide-react/dynamic';

export const SidebarPanel: React.FC = () => {
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | undefined>(undefined);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { setSelectedMenuItem, selectedMenuItem } = useApplication();

  useEffect(() => {
    // Try to load from SidebarService/localStorage first
    try {
      const config: SidebarConfig | null = SidebarService.loadConfig();
      if (config) {
        setSidebarConfig(config);
        if (config.lastSelectedItemId) {
          const selected = config.menuItems.find(item => item.id === config.lastSelectedItemId);
          setSelectedMenuItem(selected || null);
        }
      }
    } catch (err) {
      // ignore and fall back to default
      console.warn('Failed to load sidebar config from storage, using default', err);
    }
  }, []);

  // Handler for menu item selection
  function menuItemSelectionHandler(sidebarConfig: SidebarConfig | undefined, id: string) {
    console.log('Selected menu item id:', id);

    // Robust recursive search for menu item by id
    function findMenuItem(items: SidebarMenuItem[] | undefined): SidebarMenuItem | undefined {
      if (!Array.isArray(items)) return undefined;
      for (const item of items) {
        if (item.id === id) return item;
        if (Array.isArray(item.children)) {
          const found = findMenuItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    }

    const found = findMenuItem(sidebarConfig?.menuItems);
    // update application context so other managers can react with the full item
    if (found) {
      setSelectedMenuItem(found);
    } else {
      setSelectedMenuItem(null);
    }
    if (found && sidebarConfig) {
      sidebarConfig.lastSelectedItemId = found.id;
      sidebarConfig.lastUpdateDate = new Date();
      SidebarService.saveConfig(sidebarConfig);
    }
  }

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Render the menu items
  const renderMenu = (items: SidebarMenuItem[] | undefined) => {
    if (!items || items.length === 0) return null;
    return (
      <ul style={{ paddingLeft: 16 }}>
        {items.map((item) => {
          const hasChildren = !!(item.children && item.children.length > 0);
          const isOpen = !!openGroups[item.id];
          const isSelected = !!(selectedMenuItem && selectedMenuItem.id === item.id);
          return (
            <li key={item.id} id={item.id} style={{ margin: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => menuItemSelectionHandler(sidebarConfig, item.id)}
                  aria-current={isSelected ? 'true' : undefined}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: isSelected ? '#e6f7ff' : 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6 }}
                >
                  {renderIcon(item.icon)}
                  <span>{item.title}</span>
                </button>
                {hasChildren && (
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
                  {renderMenu(item.children)}
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
    if (!icon) return <DynamicIcon name="camera" color="red" size={24} />;
    if (icon.startsWith('http')) {
      return <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
    }
  return <DynamicIcon name={icon as any} color="black" size={24} />;
  };

  return (
    <div style={{ padding: 12 }}>
      {sidebarConfig ? (
        <nav aria-label="Sidebar configuration">
          {renderMenu(sidebarConfig.menuItems)}
        </nav>
      ) : (
        <div>No sidebar configuration found.</div>
      )}
    </div>
  );
};
