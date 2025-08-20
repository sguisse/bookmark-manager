import React, { useEffect, useState } from 'react';
import { SidebarService } from '../../services/sidebarService';
import { SidebarConfig, MenuItem } from '../../types/sidebar';
import { DynamicIcon } from 'lucide-react/dynamic';


// Handler for menu item selection
function menuItemSelectionHandler(sidebarConfig: SidebarConfig | null, id: string) {
  console.log('Selected menu item id:', id);

  // Robust recursive search for menu item by id
  function findMenuItem(items: MenuItem[] | undefined): MenuItem | undefined {
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

  const selectedItem = findMenuItem(sidebarConfig?.menuItems);
  if (selectedItem && sidebarConfig) {
    sidebarConfig.lastSelectedItemId = selectedItem.id;
    sidebarConfig.lastUpdateDate = new Date().toISOString();
    SidebarService.saveConfig(sidebarConfig);

    SidebarService.openSelectedFlexLayout(selectedItem);
  }
}

export const SidebarManager: React.FC = () => {
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Try to load from SidebarService/localStorage first
    try {
      const config: SidebarConfig | null = SidebarService.loadConfig();
      if (config) {
        setSidebarConfig(config);
      }
    } catch (err) {
      // ignore and fall back to default
      console.warn('Failed to load sidebar config from storage, using default', err);
    }
  }, []);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMenu = (items: MenuItem[] | undefined) => {
    if (!items || items.length === 0) return null;
    return (
      <ul style={{ paddingLeft: 16 }}>
        {items.map((item) => {
          const hasChildren = !!(item.children && item.children.length > 0);
          const isOpen = !!openGroups[item.id];
          return (
            <li
              key={item.id}
              id={item.id}
              style={{ margin: '6px 0', cursor: 'pointer' }}
              onClick={() => menuItemSelectionHandler(sidebarConfig, item.id)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {renderIcon(item.icon)}
                {item.title}
                {hasChildren && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggleGroup(item.id); }}
                    style={{ marginLeft: 8, fontSize: '1em', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label={isOpen ? 'Collapse group' : 'Expand group'}
                  >
                    {isOpen ? '▾' : '▸'}
                  </button>
                )}
              </span>
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

  const renderIcon = (icon?: string) => {
    if (!icon) return <DynamicIcon name="camera" color="red" size={24} />;
    if (icon.startsWith('http')) {
      return <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
    }
    return <DynamicIcon name={icon} color="black" size={24} />;
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Sidebar Manager</h3>
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
