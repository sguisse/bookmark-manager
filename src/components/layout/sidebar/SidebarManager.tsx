import React, { useEffect, useState, useCallback } from 'react';
import SidebarPanel from './SidebarPanel';
import SidebarForm from './SidebarForm';
import { SidebarService } from '../../../services/sidebarService';
import { SidebarConfig, SidebarMenuItem } from '../../../types/sidebar';
import { useApplication } from '../../../contexts/ApplicationContext';

export const SidebarManager: React.FC = () => {
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | undefined>(undefined);
  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({});
  // visibility state is not needed here; SidebarPanel uses config.viewMode
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { setSelectedMenuItem, selectedMenuItem } = useApplication();

  // Local type alias used across this manager for sidebar tree nodes
  type MenuNode = import('../../../types/sidebar').SidebarCategory | import('../../../types/sidebar').SidebarMenuGroup | import('../../../types/sidebar').SidebarMenuItem;

  useEffect(() => {
    try {
      const config: SidebarConfig | null = SidebarService.loadConfig();
      if (config) {
        setSidebarConfig(config);

        const initialOpen: Record<string, boolean> = {};
        const collectOpen = (items?: MenuNode[]) => {
          if (!items) return;
          for (const it of items) {
            if ('expanded' in it && it.expanded) initialOpen[it.id] = true;
            if ('children' in it && it.children) collectOpen(it.children as any);
          }
        };
        collectOpen(config.sidebarItems as any);
        setOpenedGroups(initialOpen);

        if (config.lastSelectedItemId) {
          const find = (items?: MenuNode[]): SidebarMenuItem | undefined => {
            if (!items) return undefined;
            for (const it of items) {
              if (it.id === config.lastSelectedItemId && !('children' in it)) return it as any;
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


  const updateExpandedForId = useCallback((items: MenuNode[] | undefined, groupId: string, expanded: boolean) => {
    if (!items) return;
    for (const it of items) {
      if (it.id === groupId && 'expanded' in it) {
        (it as any).expanded = expanded;
      }
      if ('children' in it && it.children) updateExpandedForId(it.children as any, groupId, expanded);
    }
  }, []);

  const menuItemSelectionHandler = (id: string) => {
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

  const toggleGroup = (id: string) => {
    setOpenedGroups(prev => {
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

  const handleSidebarChange = (newConfig: SidebarConfig) => {
    SidebarService.saveConfig(newConfig);
    setSidebarConfig(newConfig);
  };

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  const handleCreate = (parentId: string | null, item: any) => {
    if (!sidebarConfig) return;
    // Insert under parentId if provided; otherwise append at top-level
  const updated = { ...sidebarConfig } as SidebarConfig;

    const insertInto = (children: any[] | undefined, pid: string | null): boolean => {
      if (!Array.isArray(children)) return false;
      if (!pid) return false;
      for (const ch of children) {
        if (ch.id === pid) {
          if (!('children' in ch)) ch.children = [];
          ch.children = ch.children || [];
          ch.children.push(item);
          return true;
        }
        if (ch.children && insertInto(ch.children, pid)) return true;
      }
      return false;
    };

    if (parentId) {
      insertInto(updated.sidebarItems as any[], parentId);
    } else {
      // append to top-level (as a category or group or item)
      updated.sidebarItems = updated.sidebarItems || [];
      updated.sidebarItems.push(item);
    }

    updated.lastUpdateDate = new Date();
    SidebarService.saveConfig(updated);
    setSidebarConfig(updated);
    setShowCreateForm(false);
  };

  const moveItem = (
    sourceId: string,
    targetId: string | null,
    position?: 'before' | 'after' | 'inside',
    parentId?: string | null,
    targetIndex?: number
  ) => {
    if (!sidebarConfig) return;

    // Find and remove the source item
    let sourceItem: MenuNode | null = null;

    const removeFromArray = (items: MenuNode[]): MenuNode[] => {
      return items.filter(item => {
        if (item.id === sourceId) {
          sourceItem = item;
          return false;
        }
        if ('children' in item && item.children) {
          const filteredChildren = removeFromArray(item.children as MenuNode[]);
          (item as any).children = filteredChildren;
        }
        return true;
      });
    };

    const updated = { ...sidebarConfig } as SidebarConfig;
    updated.sidebarItems = removeFromArray(updated.sidebarItems as MenuNode[]);

    if (!sourceItem) return; // Item not found

    // Insert the item using the precise position information
    if (position === 'inside' && parentId) {
      // Insert inside the specified parent at the given index
      const insertIntoParent = (items: MenuNode[]): boolean => {
        for (const item of items) {
          if (item.id === parentId) {
            if (!('children' in item)) {
              (item as any).children = [];
            }
            const children = (item as any).children || [];
            const insertIndex = targetIndex !== undefined ? Math.min(targetIndex, children.length) : children.length;
            children.splice(insertIndex, 0, sourceItem);
            (item as any).children = children;
            return true;
          }
          if ('children' in item && item.children) {
            if (insertIntoParent(item.children as MenuNode[])) return true;
          }
        }
        return false;
      };

      if (!insertIntoParent(updated.sidebarItems as MenuNode[])) {
        // If parent not found, fall back to root level
        updated.sidebarItems = updated.sidebarItems || [];
        const insertIndex = targetIndex !== undefined ? Math.min(targetIndex, updated.sidebarItems.length) : updated.sidebarItems.length;
        updated.sidebarItems.splice(insertIndex, 0, sourceItem);
      }
    } else if ((position === 'before' || position === 'after') && parentId !== undefined) {
      // Insert before or after target within the specified parent
      const insertRelativeToTarget = (items: MenuNode[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === targetId) {
            const insertIndex = position === 'before' ? i : i + 1;
            if (sourceItem) {
              items.splice(insertIndex, 0, sourceItem);
            }
            return true;
          }
          if ('children' in items[i] && (items[i] as any).children) {
            if (insertRelativeToTarget((items[i] as any).children as MenuNode[])) return true;
          }
        }
        return false;
      };

      if (parentId === null) {
        // Insert at root level
        insertRelativeToTarget(updated.sidebarItems as MenuNode[]);
      } else {
        // Find the parent and insert within its children
        const insertIntoParent = (items: MenuNode[]): boolean => {
          for (const item of items) {
            if (item.id === parentId) {
              const children = (item as any).children || [];
              insertRelativeToTarget(children);
              return true;
            }
            if ('children' in item && item.children) {
              if (insertIntoParent(item.children as MenuNode[])) return true;
            }
          }
          return false;
        };
        insertIntoParent(updated.sidebarItems as MenuNode[]);
      }
    } else if (parentId) {
      // Fallback: Insert into specified parent using targetIndex
      const insertIntoSpecifiedParent = (items: MenuNode[]): boolean => {
        for (const item of items) {
          if (item.id === parentId) {
            if (!('children' in item)) {
              (item as any).children = [];
            }
            const children = (item as any).children || [];
            const insertIndex = targetIndex !== undefined ? Math.min(targetIndex, children.length) : children.length;
            if (sourceItem) {
              children.splice(insertIndex, 0, sourceItem);
            }
            (item as any).children = children;
            return true;
          }
          if ('children' in item && item.children) {
            if (insertIntoSpecifiedParent(item.children as MenuNode[])) return true;
          }
        }
        return false;
      };
      insertIntoSpecifiedParent(updated.sidebarItems as MenuNode[]);
    } else {
      // Fallback: Insert at root level using targetIndex
      updated.sidebarItems = updated.sidebarItems || [];
      const insertIndex = targetIndex !== undefined ? Math.min(targetIndex, updated.sidebarItems.length) : updated.sidebarItems.length;
      if (sourceItem) {
        updated.sidebarItems.splice(insertIndex, 0, sourceItem);
      }
    }

    updated.lastUpdateDate = new Date();
    SidebarService.saveConfig(updated);
    setSidebarConfig(updated);
  };


  return (
    <>
      <SidebarPanel
        sidebarConfig={sidebarConfig}
        openedGroups={openedGroups}
        selectedMenuItem={selectedMenuItem}
        onToggleGroup={toggleGroup}
        onSelectItem={menuItemSelectionHandler}
        onAddBookmark={handleCreateClick}
        onAddGroup={handleCreateClick}
        onSidebarChange={handleSidebarChange}
        onMoveItem={moveItem}
      />
      {showCreateForm && (
        <SidebarForm
          visible={showCreateForm}
          config={sidebarConfig || null}
          onCancel={() => setShowCreateForm(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
};

export default SidebarManager;
