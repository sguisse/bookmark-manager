import React, { useEffect, useState, useCallback } from 'react';
import SidebarPanel, { MenuNode } from './SidebarPanel';
import { SidebarService } from '../../../services/sidebarService';
import { SidebarConfig, SidebarMenuItem } from '../../../types/sidebar';
import { useApplication } from '../../../contexts/ApplicationContext';

export const SidebarManager: React.FC = () => {
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | undefined>(undefined);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsedLocal, setCollapsedLocal] = useState<boolean>(false);
  const [visibleLocal, setVisibleLocal] = useState<boolean>(true);
  const { setSelectedMenuItem, selectedMenuItem } = useApplication();

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
        setOpenGroups(initialOpen);

        const legacyCollapsed = (config as any).collapsed;
        if (typeof legacyCollapsed !== 'undefined') setCollapsedLocal(!!legacyCollapsed);
        const legacyVisible = (config as any).visible;
        if (typeof legacyVisible !== 'undefined') setVisibleLocal(!!legacyVisible);

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

  useEffect(() => {
    const onToggle = () => setVisibleLocal(v => !v);
    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-sidebar', onToggle as EventListener);
      window.addEventListener('toggleSidebar', onToggle as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('toggle-sidebar', onToggle as EventListener);
        window.removeEventListener('toggleSidebar', onToggle as EventListener);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar-visibility', { detail: { visible: visibleLocal } }));
    }
  }, [visibleLocal]);

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

  const setVisible = (v: boolean) => setVisibleLocal(v);

  return (
    <SidebarPanel
      sidebarConfig={sidebarConfig}
      openGroups={openGroups}
      collapsedLocal={collapsedLocal}
      visibleLocal={visibleLocal}
      selectedMenuItem={selectedMenuItem}
      onToggleGroup={toggleGroup}
      onSelectItem={menuItemSelectionHandler}
      onToggleVisible={setVisible}
    />
  );
};

export default SidebarManager;
