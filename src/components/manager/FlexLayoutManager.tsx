import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FlexLayoutConfig, FlexLayoutService } from '../../services/flexLayoutService';
import { useApplication } from '../../contexts/ApplicationContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Layout, Model } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import createFlexLayoutFactory, { onRenderTab as defaultOnRenderTab } from './FlexLayoutTabFactory';
import { FormDisplayMode } from '../../types/app';
import FlexLayoutTabForm from '../common/FlexLayoutTabForm';
import { SidebarMenuItem } from '../../types/sidebar';

interface FlexLayoutManagerProps {
  onTabConfigUpdated?: (menuItem: SidebarMenuItem, nodeId: string, config: any) => void;
}


export const FlexLayoutManager: React.FC<FlexLayoutManagerProps> = (props) => {
  const { onTabConfigUpdated } = props;
  const [layout, setLayout] = useState<FlexLayoutConfig | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const { selectedMenuItem } = useApplication();
  const { success } = useNotifications();

  // Load layout configuration when a menu item is selected
  useEffect(() => {
    if (selectedMenuItem) {
      const id = selectedMenuItem.id;
      console.log('menuItem selected :', id);
      // attempt to load layout for this id
      try {
        const config = FlexLayoutService.loadConfig(id);
        if (config) {
          setLayout(config);
        }
      } catch (err) {
        console.warn('Error loading layout for selected menu item', err);
      }
    }
  }, [selectedMenuItem]);

  // When a layout config is available, create a flexlayout Model
  useEffect(() => {
    if (!layout) {
      setModel(null);
      return;
    }

    try {
      const m = Model.fromJson(layout as any);
      setModel(m);
    } catch (err) {
      console.warn('Failed to create Model from layout', err);
      setModel(null);
    }
  }, [layout]);

  // keep a ref to the current model for imperative updates and saving
  const modelRef = useRef<Model | null>(null);
  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  // persist model for the selected menu item
  const saveModelForSelected = useCallback(() => {
    if (!modelRef.current || !selectedMenuItem) return;
    try {
      FlexLayoutService.saveConfig(selectedMenuItem.id, modelRef.current.toJson());
    } catch (err) {
      console.warn('Failed to save flexlayout model', err);
    }
  }, [selectedMenuItem]);

  // handle flexlayout actions and save layout when relevant
  const onAction = useCallback((action: any) => {
    // common action types that indicate structural changes
    if (action?.type && /move|model|add|remove|close|rename|split/i.exec(String(action.type))) {
      if (!String(action.type).includes('drag')) {
        // slight debounce to allow the model to settle
        setTimeout(() => saveModelForSelected(), 100);
      }
    }
    return action;
  }, [saveModelForSelected]);

  // update a tab node's config (and optionally name/icon) and persist the model
  const updateTabConfigAndSave = useCallback((nodeId: string, newConfig: any) => {
    const m = modelRef.current;
    if (!m) return;

    try {
      // mutate the JSON representation and recreate the model
      const json = m.toJson();

      const updateNodeInChildren = (children: any[] | undefined) => {
        if (!Array.isArray(children)) return false;
        for (const child of children) {
          if (child.type === 'tab' && child.id === nodeId) {
            // merge config
            child.config = { ...(child.config || {}), ...(newConfig || {}) };
            if (typeof newConfig?.title === 'string') child.name = newConfig.title;
            if (typeof newConfig?.icon === 'string') child.icon = newConfig.icon;
            return true;
          }
          // recurse into tabset/row/column children
          if (child.children && updateNodeInChildren(child.children)) return true;
        }
        return false;
      };

      if (json.layout) {
        updateNodeInChildren([json.layout]);
      }

      // recreate model from modified json and persist
      const newModel = Model.fromJson(json as any);
      setModel(newModel);
      modelRef.current = newModel;
      FlexLayoutService.saveConfig(selectedMenuItem?.id || '', json as any);
    } catch (err) {
      console.warn('Failed to update tab config', err);
    }
  }, [saveModelForSelected]);

  // Called by child tab managers when their config changes.
  // This will update the flexlayout model, persist it for the selected menu item,
  // and notify (console/log) the association between menu item and updated tab config.
  const handleChildConfigChange = useCallback((nodeId: string, cfg: any) => {
    updateTabConfigAndSave(nodeId, cfg);
    if (selectedMenuItem) {
      // Notify parent/owner about the change: persist already done by updateTabConfigAndSave
      console.log('FlexLayoutManager: config changed for menuItem=', selectedMenuItem.id, { nodeId, cfg });

      // fire a small notification so the user knows the change was saved
      try {
        success('Layout saved', `Saved tab changes for "${selectedMenuItem.title || selectedMenuItem.id}"`);
      } catch (err) {
        // ignore notification errors
        console.warn('Failed to emit notification', err);
      }

      // call external callback if provided
      try {
  onTabConfigUpdated && onTabConfigUpdated(selectedMenuItem, nodeId, cfg);
      } catch (err) {
        console.warn('onTabConfigUpdated threw', err);
      }
    }
  }, [updateTabConfigAndSave, selectedMenuItem]);

  // Event-driven protocol: respond to a form requesting the tab config
  useEffect(() => {
    const handleRequest = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        const nid = ce?.detail?.nodeId;
        if (!nid || !modelRef.current) return;
        const json = modelRef.current.toJson();

        // search for the tab in the JSON by id
        const findTab = (children: Array<Record<string, any>> | undefined): Record<string, any> | null => {
          if (!Array.isArray(children)) return null;
          for (const child of children) {
            if (child.type === 'tab' && child.id === nid) return child;
            const found: Record<string, any> | null = findTab(child.children as Array<Record<string, any>> | undefined);
            if (found) return found;
          }
          return null;
        };

        const tab = json.layout ? findTab([json.layout]) : null;
        if (tab) {
          window.dispatchEvent(new CustomEvent('flexlayout:tab:response', { detail: { nodeId: nid, config: tab.config || {} } }));
        }
      } catch (err) {
        console.warn('Failed to respond to tab config request', err);
      }
    };

    const handleSave = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string; update: any }>;
        const nid = ce?.detail?.nodeId;
        const update = ce?.detail?.update;
        if (!nid || !update) return;
        // Persist via the existing update helper
        updateTabConfigAndSave(nid, update);
      } catch (err) {
        console.warn('Failed to handle tab save event', err);
      }
    };

    window.addEventListener('flexlayout:tab:request-config', handleRequest as EventListener);
    window.addEventListener('flexlayout:tab:save', handleSave as EventListener);
    return () => {
      window.removeEventListener('flexlayout:tab:request-config', handleRequest as EventListener);
      window.removeEventListener('flexlayout:tab:save', handleSave as EventListener);
    };
  }, [updateTabConfigAndSave]);

  // use externalized renderers and factory for tab components
  // onRenderTab and onRenderTabSet are imported from FlexLayoutTabFactory
  // factory created below with openTabEditor

  // modal state for editing a tab's config
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<Record<string, any> | null>(null);
  const [editingMode, setEditingMode] = useState<FormDisplayMode>(FormDisplayMode.Edit);

  const openTabEditor = useCallback((nodeId: string, mode: FormDisplayMode = FormDisplayMode.Edit) => {
    if (!modelRef.current) return;
    const json = modelRef.current.toJson();
  try { console.debug('[FlexLayoutManager] openTabEditor called', { nodeId }); } catch (err) { console.warn('Failed to debug log', err); }
    const findTab = (children: Array<Record<string, any>> | undefined): Record<string, any> | null => {
      if (!Array.isArray(children)) return null;
      for (const child of children) {
        if (child.type === 'tab' && child.id === nodeId) return child;
        const found: Record<string, any> | null = findTab(child.children as Array<Record<string, any>> | undefined);
        if (found) return found;
      }
      return null;
    };
    const tab = json.layout ? findTab([json.layout]) : null;
  try { console.debug('[FlexLayoutManager] tab found?', { nodeId, found: !!tab }); } catch (err) { console.warn('Failed to debug log', err); }
  try { console.debug('[FlexLayoutManager] tab found?', { nodeId, found: !!tab }); } catch (err) { console.warn('Failed to debug log', err); }
  setEditingNodeId(nodeId);
  setEditingConfig(tab?.config || {});
  setEditingMode(mode || 'edit');
  }, []);

  // fallback listener for toolbar events that dispatch a global open-editor event
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string; mode?: FormDisplayMode }>;
        const nid = ce?.detail?.nodeId;
  const mode = ce?.detail?.mode;
        if (nid) openTabEditor(nid, mode || FormDisplayMode.Edit);
      } catch (err) {
        console.warn('fallback open-editor handler failed', err);
      }
    };
    window.addEventListener('flexlayout:tab:open-editor', handler as EventListener);
    return () => window.removeEventListener('flexlayout:tab:open-editor', handler as EventListener);
  }, [openTabEditor]);

  const { factory, onRenderTabSet, onRenderTab: boundOnRenderTab } = (createFlexLayoutFactory as any)(handleChildConfigChange, openTabEditor);
  try { console.log('[FlexLayoutManager] factory created, boundOnRenderTab?', !!boundOnRenderTab); } catch (err) { console.warn('log failed', err); }


  return (
    <div style={{ padding: 16 }}>
      <h3>Flex Layout Manager</h3>

      {model ? (
        <div style={{ height: 400 }}>
          <Layout
            model={model}
            factory={factory}
            onAction={onAction}
            onRenderTab={boundOnRenderTab || defaultOnRenderTab}
            onRenderTabSet={onRenderTabSet}
          />
          {editingNodeId && (
            <FlexLayoutTabForm
              flexTabConfig={(editingConfig || {}) as any}
              mode={editingMode}
              onSave={(update) => {
                updateTabConfigAndSave(editingNodeId, update);
                setEditingNodeId(null);
                setEditingConfig(null);
              }}
              onCancel={() => { setEditingNodeId(null); setEditingConfig(null); }}
            />
          )}
        </div>
      ) : (
        <div>No layout configuration found.</div>
      )}
    </div>
  );
};
