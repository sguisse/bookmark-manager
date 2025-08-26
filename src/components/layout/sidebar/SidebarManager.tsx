import React, { useEffect, useState, useCallback } from 'react';
import SidebarPanel from './SidebarPanel';
import SidebarForm from './SidebarForm';
import { SidebarService } from '../../../services/sidebarService';
import { SidebarConfig, SidebarItem } from '../../../types/sidebar';
import { FormDisplayMode } from '../../../types/app';
import { useApplication } from '../../../contexts/ApplicationContext';

export const SidebarManager: React.FC = () => {
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | undefined>(undefined);
  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({});
  // visibility state is not needed here; SidebarPanel uses config.viewMode
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const { setSelectedMenuItem, selectedMenuItem } = useApplication();

  // Local type alias used across this manager for sidebar tree nodes
  type MenuNode = SidebarItem;

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
          const find = (items?: MenuNode[]): SidebarItem | undefined => {
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
    const findItem = (items?: MenuNode[]): SidebarItem | undefined => {
      if (!items) return undefined;
      for (const it of items) {
        if (it.id === id) return it as any; // Return any item type, not just leaf nodes
        if ('children' in it && it.children) {
          const f = findItem(it.children as any);
          if (f) return f;
        }
      }
      return undefined;
    };
    const found = sidebarConfig ? findItem(sidebarConfig.sidebarItems as any) : undefined;
    if (found && setSelectedMenuItem) {
      // Ensure the item has a flexLayoutId for FlexLayout integration
      const itemWithFlexLayout = {
        ...found,
        flexLayoutId: found.flexLayoutId || found.id // Use existing flexLayoutId or fallback to id
      };
      setSelectedMenuItem(itemWithFlexLayout);
    }
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
    setEditingItemId(null); // Clear editing state for create mode
    setShowCreateForm(true);
  };

  // Helper function to find an item by ID in the sidebar config
  const findItemById = useCallback((itemId: string): SidebarItem | null => {
    if (!sidebarConfig?.sidebarItems) return null;

    const search = (items: SidebarItem[]): SidebarItem | null => {
      for (const item of items) {
        if (item.id === itemId) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return search(sidebarConfig.sidebarItems);
  }, [sidebarConfig]);

  const handleEditItem = useCallback((nodeId: string) => {
    setEditingItemId(nodeId);
    setShowCreateForm(true);
    console.log('Edit item:', nodeId);
  }, []);

  const handleDeleteItem = useCallback((nodeId: string) => {
    if (!sidebarConfig) return;

    // Remove the item from the config
    const removeItem = (items: any[]): any[] => {
      return items.filter(item => {
        if (item.id === nodeId) {
          return false; // Remove this item
        }
        if (item.children && item.children.length > 0) {
          item.children = removeItem(item.children);
        }
        return true;
      });
    };

    const updatedConfig = {
      ...sidebarConfig,
      sidebarItems: removeItem(sidebarConfig.sidebarItems),
      lastUpdateDate: new Date()
    };

    SidebarService.saveConfig(updatedConfig);
    setSidebarConfig(updatedConfig);

    // Clear selection if the deleted item was selected
    if (selectedMenuItem?.id === nodeId) {
      setSelectedMenuItem(null);
    }
  }, [sidebarConfig, selectedMenuItem, setSelectedMenuItem]);

  const handleCreate = (parentId: string | null, item: any) => {
    if (!sidebarConfig) return;

    if (editingItemId) {
      // Edit mode: update existing item
      const updateItem = (items: any[]): any[] => {
        return items.map(existingItem => {
          if (existingItem.id === editingItemId) {
            return { ...existingItem, ...item, id: editingItemId }; // Keep the original ID
          }
          if (existingItem.children && existingItem.children.length > 0) {
            return { ...existingItem, children: updateItem(existingItem.children) };
          }
          return existingItem;
        });
      };

      const updatedConfig = {
        ...sidebarConfig,
        sidebarItems: updateItem(sidebarConfig.sidebarItems),
        lastUpdateDate: new Date()
      };

      SidebarService.saveConfig(updatedConfig);
      setSidebarConfig(updatedConfig);
      setShowCreateForm(false);
      setEditingItemId(null);
    } else {
      // Create mode: insert new item
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
      setEditingItemId(null);
    }
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
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
      />
      {showCreateForm && (
        <SidebarForm
          mode={editingItemId ? FormDisplayMode.Edit : FormDisplayMode.Create}
          visible={showCreateForm}
          config={sidebarConfig || null}
          initial={editingItemId ? findItemById(editingItemId) : null}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingItemId(null);
          }}
          onCreate={handleCreate}
        />
      )}
    </>
  );
};

export default SidebarManager;
