import React, { useEffect, useState } from 'react';
import { SidebarService } from '../../services/sidebarService';
import { SidebarConfig, MenuItem } from '../../types/sidebar';
import { DynamicIcon } from 'lucide-react/dynamic';

export const SidebarManager: React.FC = () => {
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Try to load from SidebarService/localStorage first
    try {
      const raw: SidebarConfig | null = SidebarService.loadConfig();
      if (raw) {
        setSidebarConfig(raw);
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
            <li id={item.flexLayoutId} style={{ margin: '6px 0' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {renderIcon(item.icon)}
                {item.title}
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
