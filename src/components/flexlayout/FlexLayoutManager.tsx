import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FlexLayoutConfig, FlexLayoutService } from '../../services/flexLayoutService';
import { useApplication } from '../../contexts/ApplicationContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Layout, Model } from 'flexlayout-react';
import createFlexLayoutFactory from './FlexLayoutTabFactory';
import { v4 as uuidv4 } from 'uuid';
import { setParentTabsetSelected } from './flexlayoutUtils';
import { crossTabBookmarkService } from '../../services/CrossTabBookmarkService';
import { FormDisplayMode } from '../../types/app';
import FlexLayoutTabForm from './FlexLayoutTabForm';
import { SidebarItem } from '../../types/sidebar';
import { useTheme } from '../../contexts/ThemeContext';

interface FlexLayoutManagerProps {
  onFlexLayoutTabUpdate?: (menuItem: SidebarItem, nodeId: string, config: any) => void;
}

export const FlexLayoutManager: React.FC<FlexLayoutManagerProps> = (props) => {
  const { onFlexLayoutTabUpdate } = props;
  const [layout, setLayout] = useState<FlexLayoutConfig | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const { selectedMenuItem, setSelectedMenuItem } = useApplication();
  const { success } = useNotifications();

  // Load layout configuration when a menu item is selected
  useEffect(() => {
    if (selectedMenuItem) {
      const id = selectedMenuItem.id;
      // attempt to load layout for this id
      try {
        const config = FlexLayoutService.loadConfig(id);
        if (config) {
          setLayout(config);
        }
      } catch (err) {
        console.warn('Error loading layout for selected menu item', err);
      }
    } else {
      // Clear layout when no menu item is selected
      setLayout(null);
    }
  }, [selectedMenuItem]);

  // listen for duplicate tab requests from tab UI
  useEffect(() => {
    const duplicateHandler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        const nid = ce?.detail?.nodeId;
        if (!nid || !modelRef.current) return;

        const jsonDoc = modelRef.current.toJson();

        // find the tab and its parent array reference so we can insert next to it
        const findParentArrayAndIndex = (children: any[] | undefined, parent: any = null): { arr: any[] | null; idx: number; parentNode: any } | null => {
          if (!Array.isArray(children)) return null;
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.type === 'tab' && child.id === nid) {
              return { arr: children, idx: i, parentNode: parent };
            }
            const found = findParentArrayAndIndex(child.children as any[] | undefined, child);
            if (found) return found;
          }
          return null;
        };

  const found = findParentArrayAndIndex([jsonDoc.layout], null) || null;
  if (!found?.arr) { return; }

  const original = found.arr[found.idx];
        if (!original) return;

        // deep clone config
        const originalConfig = JSON.parse(JSON.stringify(original.config || {}));
        const newId = uuidv4();
        const newTitle = (originalConfig.title || original.name || 'Tab') + ' - copy';

        const newTab = {
          type: 'tab',
          id: newId,
          name: newTitle,
          component: original.component,
          config: { ...(originalConfig || {}), id: newId, title: newTitle, createdDate: new Date(), lastModifiedDate: new Date() }
        };

        // insert next to original (after)
        found.arr.splice(found.idx + 1, 0, newTab);

        // recreate model and persist
        const newModel = Model.fromJson(jsonDoc);
        setModel(newModel);
        modelRef.current = newModel;
        FlexLayoutService.saveConfig(selectedMenuItem?.id || '', jsonDoc);
      } catch (err) {
        console.warn('Failed to duplicate tab', err);
      }
    };

    window.addEventListener('flexlayout:tab:duplicate', duplicateHandler as EventListener);
    return () => window.removeEventListener('flexlayout:tab:duplicate', duplicateHandler as EventListener);
  }, [selectedMenuItem]);

  // Listen for sidebar item deletion events and clear selection if the current item was deleted
  useEffect(() => {
    const handleItemDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ deletedItemId: string }>;
      const deletedItemId = customEvent.detail?.deletedItemId;

      if (deletedItemId && selectedMenuItem?.id === deletedItemId) {
        console.log('Clearing selected menu item because it was deleted:', deletedItemId);
        setSelectedMenuItem(null);
      }
    };

    window.addEventListener('sidebar:item:deleted', handleItemDeleted as EventListener);
    return () => {
      window.removeEventListener('sidebar:item:deleted', handleItemDeleted as EventListener);
    };
  }, [selectedMenuItem, setSelectedMenuItem]);

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

  // keep a ref to the last-known selected menu item id so we can still
  // persist layout even if the selection transiently becomes null
  const menuItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedMenuItem?.id) menuItemIdRef.current = selectedMenuItem.id;
  }, [selectedMenuItem]);

  // persist model for the selected menu item
  const saveModelForSelected = useCallback(() => {
    if (!modelRef.current) return;
    const menuId = selectedMenuItem?.id || menuItemIdRef.current;
    if (!menuId) {
      console.warn('No menu id available to save flexlayout model');
      return;
    }
    try {
      FlexLayoutService.saveConfig(menuId, modelRef.current.toJson());
    } catch (err) {
      console.warn('Failed to save flexlayout model', err);
    }
  }, [selectedMenuItem]);

  // handle flexlayout actions and save layout when relevant
  const onAction = useCallback((action: any) => {
    try {
      const atype = String(action?.type || '');

      // If an action has a type and doesn't look like a drag, persist after
      // a short delay so flexlayout has a chance to mutate the model.
      if (atype && !atype.toLowerCase().includes('drag')) {
        setTimeout(() => saveModelForSelected(), 120);
      }

      // If the action carries a node that is a tab/tabset and the action type
      // indicates removal/close, persist immediately (no long debounce).
      const node = action?.data?.node || action?.node || null;
      const nodeType = node?.getType ? node.getType() : node?.type;
      if (nodeType && /tab|tabset/i.test(String(nodeType)) && /remove|close/i.exec(atype)) {
        try {
          // give a tiny tick for the model to settle, then save
          setTimeout(() => saveModelForSelected(), 40);
        } catch (err) {
          // fallback to immediate attempt
          console.warn('Failed to schedule save, trying immediate save', err);
          try {
            saveModelForSelected();
          } catch (fallbackErr) {
            console.warn('Fallback save also failed', fallbackErr);
          }
        }
      }
    } catch (err) {
      console.warn('onAction handler error', err);
    }
    return action;
  }, [saveModelForSelected]);

  // Header-drop helpers removed: creating tabs from header drops is no longer
  // handled here. Use the in-list external-drop event flow instead.


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
            // update lastModifiedDate for edits
            child.config = { ...(child.config || {}), ...(newConfig || {}), lastModifiedDate: new Date() };
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
  onFlexLayoutTabUpdate && onFlexLayoutTabUpdate(selectedMenuItem, nodeId, cfg);
      } catch (err) {
        console.warn('onFlexLayoutTabUpdate threw', err);
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

  // modal state for editing a tab's config
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<Record<string, any> | null>(null);
  const [editingMode, setEditingMode] = useState<FormDisplayMode>(FormDisplayMode.Edit);
  // when creating a new tab we keep track of the selected node that indicates the target tabset
  const [createTargetNodeId, setCreateTargetNodeId] = useState<string | null>(null);

  const openTabEditor = useCallback((nodeId: string, mode: FormDisplayMode = FormDisplayMode.Edit) => {
    if (!modelRef.current) return;
    const json = modelRef.current.toJson();
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
  // ensure mode is set first so the form renders in the expected mode (avoids race where modal opens with stale mode)
  setEditingMode(mode ?? FormDisplayMode.Edit);

  if (mode === FormDisplayMode.Create) {
    // For creation we remember the target (selected) node so we can insert a new tab in the same tabset.
    setCreateTargetNodeId(nodeId);
    setEditingNodeId(null);
    setEditingConfig({}); // empty form fields for creation
    } else {
    setCreateTargetNodeId(null);
    setEditingNodeId(nodeId);
    // include top-level tab dates (if present) in the editing config so the form can display them
    // also include the tab's name and component so the form fields are pre-filled when editing
    setEditingConfig({ ...(tab?.config || {}), title: tab?.name, component: tab?.component, creationDate: tab?.creationDate, lastUpdateDate: tab?.lastUpdateDate });
  }
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

  // header-level drops previously created bookmarks tabs; that behavior
  // has been removed in favor of the unified in-list external drop flow.

  // Listen for tabset header drop events to create a new Bookmarks tab.
  useEffect(() => {
    const handler = async (e: Event) => {
      try {
        const ce = e as CustomEvent<{ sourceTabId?: string; sourceIds?: string[]; effect?: string; tabsetId?: string }>;
        const { sourceTabId, sourceIds, effect, tabsetId } = ce?.detail || {};
        if (!modelRef.current) return;

        // fetch cached payload from cross-tab service
        let payload: any = null;
        try {
          if (sourceTabId) payload = crossTabBookmarkService.getDragData(sourceTabId);
        } catch (err) {
          console.warn('[FlexLayoutManager] failed to get cached drag payload', err);
        }

        if (!payload || !Array.isArray(payload.bookmarks) || payload.bookmarks.length === 0) return;

        // build a new tab config for bookmarks
        const newId = uuidv4();
  const bookmarks = payload.bookmarks.map((b: any) => ({ ...b, id: uuidv4() }));
        const newTab = {
          type: 'tab',
          id: newId,
          name: 'Bookmarks',
          component: 'Bookmarks',
          config: { id: newId, title: 'Bookmarks', bookmarks, createdDate: new Date(), lastModifiedDate: new Date() }
        };

        // Determine where to insert: try to find the tabset by id, otherwise append to top-level
        const json = modelRef.current.toJson();

  const findTabsetById = (children: any[] | undefined): Record<string, any> | null => {
          if (!Array.isArray(children)) return null;
          for (const child of children) {
            if ((child.type === 'tabset' || child.type === 'row' || child.type === 'column') && (child.id === tabsetId || child.getId && child.getId() === tabsetId)) return child;
            const found = findTabsetById(child.children as any[] | undefined);
            if (found) return found;
          }
          return null;
        };

        const target = json.layout ? findTabsetById([json.layout]) : null;

        if (target && Array.isArray(target.children)) {
          target.children.push(newTab);
        } else if (json.layout && Array.isArray((json.layout as any).children)) {
          (json.layout as any).children.push(newTab);
        } else {
          json.layout = { type: 'row', children: [{ type: 'tabset', children: [newTab] }] } as any;
        }

        // After inserting the new tab, ensure the parent tabset selects the newly added tab
        setParentTabsetSelected(json, newId);

        const newModel = Model.fromJson(json as any);
        setModel(newModel);
        modelRef.current = newModel;
        FlexLayoutService.saveConfig(selectedMenuItem?.id || '', json as any);

        // If this was a move, notify the source to remove originals
        try {
          if (effect === 'move' && sourceTabId && Array.isArray(sourceIds) && sourceIds.length > 0) {
            crossTabBookmarkService.notifyMove(sourceTabId, sourceIds);
          }
        } catch (err) {
          console.warn('[FlexLayoutManager] notifyMove failed', err);
        }
      } catch (err) {
        console.warn('[FlexLayoutManager] create-bookmarks-tab handler failed', err);
      }
    };

    window.addEventListener('app:flexlayout:create-bookmarks-tab', handler as EventListener);
    return () => window.removeEventListener('app:flexlayout:create-bookmarks-tab', handler as EventListener);
  }, [selectedMenuItem]);

  const { factory, onRenderTabSet, onRenderTab } = (createFlexLayoutFactory as any)(handleChildConfigChange, openTabEditor);

  // Theme flexlayout definition
  const { isDarkMode } = useTheme();
  const flexlayoutThemeClass = isDarkMode ? 'flexlayout__theme_dark' : 'flexlayout__theme_light';
  const flexlayoutCombinedClass = ''; //'flexlayout__theme_rounded'; // + ' ' + 'flexlayout__theme_underline';

  return (
    <div className={flexlayoutCombinedClass + ' ' + flexlayoutThemeClass}
         style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {model ? (
        // wrapper that provides a containing block for the absolutely positioned
        // .flexlayout__layout element. Use flex:1 so it grows to fill available space.
        <div style={{ flex: 1, position: 'relative' }}>
          <Layout
            model={model}
            factory={factory}
            onAction={onAction}
            onRenderTab={onRenderTab}
            onRenderTabSet={onRenderTabSet}
          />
          {(editingNodeId || createTargetNodeId) && (
            <FlexLayoutTabForm
              flexLayoutTab={{ id: editingNodeId || undefined, ...(editingConfig || {}) } as any}
              mode={editingMode}
              onSave={(update) => {
                if (editingMode === FormDisplayMode.Create) {
                  // create a new tab in the same tabset as createTargetNodeId
                  const m = modelRef.current;
                  if (m) {
                    const json = m.toJson();

                    // find the parent tabset of the createTargetNodeId
                    const findParentTabset = (children: Array<Record<string, any>> | undefined, parent: Record<string, any> | null = null): Record<string, any> | null => {
                      if (!Array.isArray(children)) return null;
                      for (const child of children) {
                        if (child.type === 'tab' && child.id === createTargetNodeId) return parent;
                        const found = findParentTabset(child.children as Array<Record<string, any>> | undefined, child.type === 'tabset' ? child : parent);
                        if (found) return found;
                      }
                      return null;
                    };

                    const parentTabset = json.layout ? findParentTabset([json.layout], null) : null;

                    const newId = uuidv4();
                    const newTab: any = {
                      type: 'tab',
                      id: newId,
                      name: update.title,
                      component: update.component,
                      // stamp auditing fields for a newly created tab
                      config: { ...(update || {}), id: newId, createdDate: new Date(), lastModifiedDate: new Date() }
                    };

                    if (parentTabset && Array.isArray(parentTabset.children)) {
                      parentTabset.children.push(newTab);
                    } else if (json.layout?.children && Array.isArray(json.layout.children)) {
                      // fallback: append to top-level layout children
                      json.layout.children.push(newTab);
                    } else {
                      // if layout is empty, create a new tabset with this tab
                      json.layout = { type: 'row', children: [{ type: 'tabset', children: [newTab] }] };
                    }

                    const newModel = Model.fromJson(json);
                    setModel(newModel);
                    modelRef.current = newModel;
                    FlexLayoutService.saveConfig(selectedMenuItem?.id || '', json);
                  }
                } else if (editingNodeId) {
                  updateTabConfigAndSave(editingNodeId, update);
                }

                // reset modal state
                setEditingNodeId(null);
                setEditingConfig(null);
                setCreateTargetNodeId(null);
              }}
              onCancel={() => { setEditingNodeId(null); setEditingConfig(null); setCreateTargetNodeId(null); }}
            />
          )}
        </div>
      ) : (
        <div style={{ padding: '16px', textAlign: 'center' }}>Select a menu to start...</div>
      )}
    </div>
  );
};
