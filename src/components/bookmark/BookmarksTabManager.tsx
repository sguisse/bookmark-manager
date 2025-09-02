import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookmarkForm from './BookmarkForm';
import { crossTabBookmarkService } from '../../services/CrossTabBookmarkService';
import { Bookmark, BookmarksTabConfig } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';
import BookmarkTableRow from './BookmarksViewer';
import BookmarkTree from './BookmarkTree';
import { useOptionalGlobalDnd } from './dnd/GlobalDndProvider';
import { useBookmarksTabHandlers } from './useBookmarksTabHandlers';

interface BookmarksTabProps {
  config?: BookmarksTabConfig;
  onConfigChange?: (cfg: BookmarksTabConfig) => void;
  nodeId?: string;
}

export default function BookmarksTabManager(props: Readonly<BookmarksTabProps> = {}) {
  const { config, onConfigChange, nodeId } = props;
  // stable local tab id used by provider to identify this tab as drag source
  const localTabIdRef = useRef<string>(nodeId || config?.id || `tab-${uuidv4()}`);
  const [isBookmarkFormOpen, setIsBookmarkFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const bookmarks = config?.bookmarks || [];
  // Used to know the action needed if user click on toggle view button in tab toolbar
  const [tabToggleViewMode, setTabToggleViewMode] = useState<'card' | 'row'>(config?.toggleTabViewMode || 'row');

  // Selection now managed by the hook

  const { handleAdd, handleSelect, handleToggleTabView, handleOpenAllUrls, handleEdit, handleToggleCollapsed, handleDelete, handleSubmit, selectionState, dispatch } = useBookmarksTabHandlers({
    nodeId,
    bookmarks,
    config,
    onConfigChange,
    tabToggleViewMode,
    setTabToggleViewMode,
    setEditingBookmark,
    setIsBookmarkFormOpen,
    editingBookmark
  });

  // register this tab's list with the global dnd provider if available
  const globalDnd = useOptionalGlobalDnd();

  const onPerformDrop = async ({ sourceIds, sourceTabId, targetIndex, effect }: { sourceIds: string[]; sourceTabId?: string; targetIndex: number; effect: 'move' | 'copy' | 'none' }) => {
    console.debug('[BookmarksTabManager] onPerformDrop', { sourceIds, sourceTabId, targetIndex, effect });
    if (!onConfigChange) return;
    const sourceSet = new Set(sourceIds);
    const moving = bookmarks.filter(b => sourceSet.has(b.id));
    const remaining = bookmarks.filter(b => !sourceSet.has(b.id));
    const before = remaining.slice(0, targetIndex);
    const after = remaining.slice(targetIndex);

    let newBookmarks: Bookmark[];
    if (effect === 'copy') {
      try {
        let copies: Bookmark[] = [];
        if (sourceTabId) {
          const payload = crossTabBookmarkService.getDragData(sourceTabId);
          if (payload && payload.bookmarks) {
            copies = payload.bookmarks.map((b: any) => ({ ...(b as Bookmark), id: uuidv4() }));
          }
        }
        if (copies.length === 0) {
          copies = moving.map(b => ({ ...b, id: uuidv4() }));
        }

        newBookmarks = [...before, ...copies, ...after];
        try {
          const newIds = newBookmarks.slice(before.length, before.length + copies.length).map(c => c.id);
          dispatch({ type: 'RANGE_SELECT', ids: newIds, index: targetIndex, union: false });
        } catch (err) {
          console.warn('Failed to select copies after cross-tab drop', err);
        }
      } catch (err) {
  const copies = moving.map(b => ({ ...b, id: uuidv4() }));
        newBookmarks = [...before, ...copies, ...after];
      }
    } else if (effect === 'move') {
      // Cross-tab move: if the source is a different tab, create copies here and ask source to remove originals
      if (sourceTabId && sourceTabId !== localTabIdRef.current) {
        try {
          const payload = crossTabBookmarkService.getDragData(sourceTabId);
          let copies: Bookmark[] = [];
          if (payload && payload.bookmarks) {
            copies = payload.bookmarks.map((b: any) => ({ ...(b as Bookmark), id: uuidv4() }));
          }
          if (copies.length === 0) {
            copies = moving.map(b => ({ ...b, id: uuidv4() }));
          }
          newBookmarks = [...before, ...copies, ...after];
          try { crossTabBookmarkService.notifyMove(sourceTabId, sourceIds); } catch (err) { console.warn('[BookmarksTabManager] notifyMove failed', err); }
          try {
            const newIds = newBookmarks.slice(before.length, before.length + copies.length).map(c => c.id);
            dispatch({ type: 'RANGE_SELECT', ids: newIds, index: targetIndex, union: false });
          } catch (err) {
            console.warn('Failed to select moved copies after cross-tab drop', err);
          }
        } catch (err) {
          const copies = moving.map(b => ({ ...b, id: uuidv4() }));
          newBookmarks = [...before, ...copies, ...after];
        }
      } else {
        // Local move within the same tab
        newBookmarks = [...before, ...moving, ...after];
      }
    } else {
      newBookmarks = [...before, ...moving, ...after];
    }

    const base = config ? config : ({ id: nodeId || 'tab-unknown', title: 'Bookmarks', component: 'Bookmarks', bookmarks: [], toggleTabViewMode: tabToggleViewMode } as unknown as BookmarksTabConfig);
    const newCfg: BookmarksTabConfig = { ...base, id: base.id || (nodeId || 'tab-unknown'), bookmarks: newBookmarks } as BookmarksTabConfig;
    onConfigChange(newCfg);
  };

  useEffect(() => {
    if (!globalDnd) return;
    const list = { tabId: localTabIdRef.current, items: bookmarks, selectedIds: selectionState.selectedIds, onPerformDrop };
    try {
      globalDnd.registerList(list);
    } catch (err) {
      console.warn('[BookmarksTabManager] registerList failed', err);
    }
    return () => {
      try { globalDnd.unregisterList(localTabIdRef.current); } catch (err) { console.warn('[BookmarksTabManager] unregisterList failed', err); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update the registered list when bookmarks or selection changes
  useEffect(() => {
    if (!globalDnd) return;
    try {
      globalDnd.updateList({ tabId: localTabIdRef.current, items: bookmarks, selectedIds: selectionState.selectedIds, onPerformDrop });
    } catch (err) {
      console.warn('[BookmarksTabManager] updateList failed', err);
    }
  }, [bookmarks, selectionState.selectedIds]);

    // Listen for toolbar events dispatched from FlexLayoutManager for this node
    useEffect(() => {
      // Sync local state with config when it changes
      if (config?.toggleTabViewMode && config.toggleTabViewMode !== tabToggleViewMode) {
        setTabToggleViewMode(config.toggleTabViewMode);
      }
    }, [config?.toggleTabViewMode, tabToggleViewMode]);

    useEffect(() => {
      window.addEventListener('flexlayout:bookmarks:add', handleAdd as EventListener);
      window.addEventListener('flexlayout:bookmarks:toggle-tab-view', handleToggleTabView as EventListener);
      window.addEventListener('flexlayout:bookmarks:open-all-urls', handleOpenAllUrls as EventListener);

    return () => {
      window.removeEventListener('flexlayout:bookmarks:add', handleAdd as EventListener);
      window.removeEventListener('flexlayout:bookmarks:toggle-tab-view', handleToggleTabView as EventListener);
      window.removeEventListener('flexlayout:bookmarks:open-all-urls', handleOpenAllUrls as EventListener);
    };
  }, [nodeId, bookmarks, tabToggleViewMode, config, onConfigChange]);


  // ensure a tab id is available globally for cross-tab operations and keep a stable id for this instance
  useEffect(() => {
    try {
      const id = localTabIdRef.current;
      (window as any).__CURRENT_TAB_ID__ = id;
    } catch (err) {
      // ignore
    }
  }, []);

  // react to cross-tab move messages that tell this tab to remove bookmarks (they were moved elsewhere)
  useEffect(() => {
    const onCrossTabMove = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ ids: string[]; sourceTabId?: string }>;
        const movedIds = ce?.detail?.ids || [];
        const sourceTabId = ce?.detail?.sourceTabId;
        if (!movedIds || movedIds.length === 0) return;
        // Only react if this event targets this tab as the source
        if (sourceTabId !== localTabIdRef.current) return;
        console.debug('[BookmarksTabManager] cross-tab-move received for this tab', { movedIds, sourceTabId });
        // remove moved ids from our config and persist
        if (!onConfigChange) return;
        const remaining = (config?.bookmarks || []).filter(b => !movedIds.includes(b.id));
        console.debug('[BookmarksTabManager] updating config to remove moved ids', { beforeCount: (config?.bookmarks || []).length, afterCount: remaining.length });
        onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: remaining });
      } catch (err) {
        console.warn('[BookmarksTabManager] cross-tab-move handler error', err);
      }
    };

    window.addEventListener('cross-tab-move', onCrossTabMove as EventListener);
    return () => window.removeEventListener('cross-tab-move', onCrossTabMove as EventListener);
  }, [config, onConfigChange]);

  // handle external drops coming from BrowserFavorites (native drag)
  useEffect(() => {
    const listRef = (document.querySelector('[data-bookmarks-list-id="' + (nodeId || config?.id || localTabIdRef.current) + '"]') as HTMLDivElement | null);

    const computeTargetIndex = (clientX?: number, clientY?: number) => {
      try {
  const container = listRef || document.querySelector('.grid');
        if (!container) return (config?.bookmarks || []).length;
        const children = Array.from(container.children) as HTMLElement[];
  if (children.length === 0) return 0;

        if (typeof clientX === 'number' && typeof clientY === 'number') {
          const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
          if (el && container.contains(el)) {
            // walk up until the direct child of container
            let cur: HTMLElement | null = el;
            while (cur && cur.parentElement && cur.parentElement !== container) cur = cur.parentElement as HTMLElement;
            if (cur && cur.parentElement === container) {
              return children.indexOf(cur as HTMLElement);
            }
          }
        }

        // Fallback: use bounding boxes to find insertion index by Y coordinate
        if (typeof clientY === 'number') {
          for (let i = 0; i < children.length; i++) {
            const r = children[i].getBoundingClientRect();
            const mid = r.top + r.height / 2;
            if (clientY < mid) return i;
          }
          return children.length;
        }

        return (config?.bookmarks || []).length;
      } catch (err) {
        console.warn('[BookmarksTabManager] computeTargetIndex failed', err);
        return (config?.bookmarks || []).length;
      }
    };

    const onExternalDrop = (e: Event) => {
      try {
        const ce = e as CustomEvent<any>;
        const detail = ce?.detail || {};
        console.debug('[BookmarksTabManager] external-drop received', { detail });
        // normalize nodes/urls and handle folder recursion
        const rawNodes: any[] = detail.nodes || (detail.node ? (Array.isArray(detail.node) ? detail.node : [detail.node]) : []);
        const urls: string[] = detail.urls || [];

        const copies: Bookmark[] = [];

        const collectLeafNodes = (node: any, out: any[]) => {
          if (!node) return;
          if (!node.isFolder) {
            out.push(node);
            return;
          }
          if (node.children && Array.isArray(node.children)) {
            for (const c of node.children) collectLeafNodes(c, out);
          }
        };

        // If a folder node was provided directly (detail.node), and it's a folder, create a folder placeholder and then its leaves
        if (detail.node && detail.node.isFolder) {
          const folder = detail.node;
          // folder placeholder (url empty string to satisfy Bookmark type)
          copies.push({ id: uuidv4(), title: folder.title || 'Folder', url: '', icon: folder.icon || '📁', createdDate: new Date(), lastModifiedDate: new Date(), description: folder.description || '' });
          const leaves: any[] = [];
          collectLeafNodes(folder, leaves);
          for (const n of leaves) {
            copies.push({ id: uuidv4(), title: n.title || n.url || 'Bookmark', url: n.url || '', icon: n.icon, createdDate: n.createdDate || new Date(), lastModifiedDate: n.lastModifiedDate || new Date(), description: n.description });
          }
        }

        // Process any raw nodes (which may include folders or bookmarks)
        for (const n of rawNodes) {
          if (n && n.isFolder) {
            // folder: create placeholder + leaves
            copies.push({ id: uuidv4(), title: n.title || 'Folder', url: '', icon: n.icon || '📁', createdDate: new Date(), lastModifiedDate: new Date(), description: n.description || '' });
            const leaves: any[] = [];
            collectLeafNodes(n, leaves);
            for (const l of leaves) {
              copies.push({ id: uuidv4(), title: l.title || l.url || 'Bookmark', url: l.url || '', icon: l.icon, createdDate: l.createdDate || new Date(), lastModifiedDate: l.lastModifiedDate || new Date(), description: l.description });
            }
          } else if (n) {
            copies.push({ id: uuidv4(), title: n.title || n.url || 'Bookmark', url: n.url || '', icon: n.icon, createdDate: n.createdDate || new Date(), lastModifiedDate: n.lastModifiedDate || new Date(), description: n.description });
          }
        }

        // simple url list
        for (const u of urls) {
          copies.push({ id: uuidv4(), title: u, url: u, createdDate: new Date(), lastModifiedDate: new Date() });
        }

        if (copies.length === 0) return;

        const clientX = typeof detail.clientX === 'number' ? detail.clientX : undefined;
        const clientY = typeof detail.clientY === 'number' ? detail.clientY : undefined;
        const targetIndex = computeTargetIndex(clientX, clientY);

        // Insert at computed index
        const before = (config?.bookmarks || []).slice(0, targetIndex);
        const after = (config?.bookmarks || []).slice(targetIndex);
        const newBookmarks = [...before, ...copies, ...after];

        if (onConfigChange) onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });

        // select newly added items
        try {
          const newIds = copies.map(c => c.id);
          dispatch({ type: 'RANGE_SELECT', ids: newIds, index: targetIndex, union: false });
        } catch (err) {
          console.warn('[BookmarksTabManager] failed to select new items', err);
        }

        // If the drop was a move from BrowserFavorites, notify the BrowserFavorites manager to remove the original nodes
        try {
          const dropEffect = detail.dropEffect || undefined;
          const nodeIds: string[] | undefined = detail.nodeIds;
          if (dropEffect === 'move' && nodeIds && nodeIds.length > 0) {
            try {
              window.dispatchEvent(new CustomEvent('browserfavorites:remove-nodes', { detail: { ids: nodeIds } }));
            } catch (err) {
              console.warn('[BookmarksTabManager] failed to request BrowserFavorites remove nodes', err);
            }
          }
        } catch (err) {
          console.warn('[BookmarksTabManager] move semantics handling failed', err);
        }
      } catch (err) {
        console.warn('[BookmarksTabManager] external-drop handler failed', err);
      }
    };

    window.addEventListener('flexlayout:bookmarks:external-drop', onExternalDrop as EventListener);
    return () => window.removeEventListener('flexlayout:bookmarks:external-drop', onExternalDrop as EventListener);
  }, [config, onConfigChange]);

  return (
    <div className="p-0">
      {bookmarks.length === 0 ? (
        <div className="text-secondary p-4 text-center">No bookmarks</div>
      ) : (
        <div className="grid" data-bookmarks-list-id={nodeId || config?.id || localTabIdRef.current} style={{ gap: '5px' }}>
          <BookmarkTree
            nodes={bookmarks.map(b => ({ id: b.id, parent: null, text: b.title || b.url || 'Bookmark', icon: b.icon, data: b }))}
            renderRow={(n) => {
              const b = (n.data as Bookmark);
              const idx = bookmarks.findIndex(x => x.id === b.id);
              return (
                <BookmarkTableRow key={b.id}
                                  bookmark={b}
                                  onSelect={(id, e) => { console.debug('[BookmarksTabManager] onSelect invoked for', { id, idx }); handleSelect(id, idx, e); }}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  onToggleCollapsed={handleToggleCollapsed}
                                  isSelected={selectionState.selectedIds.includes(b.id)} />
              );
            }}
          />
        </div>
      )}
      {isBookmarkFormOpen && (
        <div className="modal-overlay">
          <button
            onClick={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
            aria-label="Close modal"
            className="modal-backdrop"
          />
          <div className="modal-content">
            <BookmarkForm
              bookmark={editingBookmark}
              mode={editingBookmark?.id ? FormDisplayMode.Edit : FormDisplayMode.Create}
              onSave={(d) => handleSubmit(d, editingBookmark)}
              onCancel={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
