import { useState, useEffect, useRef } from 'react';
import BookmarkForm from './BookmarkForm';
import { crossTabBookmarkService } from '../../services/CrossTabBookmarkService';
import { Bookmark, BookmarksTabConfig } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';
import BookmarkTableRow from './BookmarksViewer';
import { DndKitMultiDragProvider } from './dnd/DndKitMultiDragProvider';
import { useBookmarksTabHandlers } from './useBookmarksTabHandlers';

interface BookmarksTabProps {
  config?: BookmarksTabConfig;
  onConfigChange?: (cfg: BookmarksTabConfig) => void;
  nodeId?: string;
}

export default function BookmarksTabManager(props: Readonly<BookmarksTabProps> = {}) {
  const { config, onConfigChange, nodeId } = props;
  // stable local tab id used by provider to identify this tab as drag source
  const localTabIdRef = useRef<string>(nodeId || (config && config.id) || `tab-${Math.random().toString(36).slice(2)}`);
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

  return (
    <div className="p-0">
      {bookmarks.length === 0 ? (
        <div className="text-secondary p-4 text-center">No bookmarks</div>
      ) : (
        <DndKitMultiDragProvider
          visibleList={bookmarks}
          selectedIds={selectionState.selectedIds}
          tabId={localTabIdRef.current}
          onPerformDrop={async ({ sourceIds, sourceTabId, targetIndex, effect }) => {
            try { console.debug('[BookmarksTabManager] onPerformDrop', { sourceIds, sourceTabId, targetIndex, effect }); } catch (e) {}
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
                    copies = payload.bookmarks.map((b: any) => ({ ...(b as Bookmark), id: Math.random().toString(36).slice(2) }));
                  }
                }
                if (copies.length === 0) {
                  copies = moving.map(b => ({ ...b, id: Math.random().toString(36).slice(2) }));
                }

                newBookmarks = [...before, ...copies, ...after];
                try {
                  const newIds = newBookmarks.slice(before.length, before.length + copies.length).map(c => c.id);
                  dispatch({ type: 'RANGE_SELECT', ids: newIds, index: targetIndex, union: false });
                } catch (err) {
                  console.warn('Failed to select copies after cross-tab drop', err);
                }
              } catch (err) {
                const copies = moving.map(b => ({ ...b, id: Math.random().toString(36).slice(2) }));
                newBookmarks = [...before, ...copies, ...after];
              }
            } else if (effect === 'move') {
              // Cross-tab move: if the source is a different tab, create copies here and ask source to remove originals
              if (sourceTabId && sourceTabId !== localTabIdRef.current) {
                try {
                  const payload = crossTabBookmarkService.getDragData(sourceTabId);
                  let copies: Bookmark[] = [];
                  if (payload && payload.bookmarks) {
                    copies = payload.bookmarks.map((b: any) => ({ ...(b as Bookmark), id: Math.random().toString(36).slice(2) }));
                  }
                  if (copies.length === 0) {
                    copies = moving.map(b => ({ ...b, id: Math.random().toString(36).slice(2) }));
                  }
                  newBookmarks = [...before, ...copies, ...after];
                  try { crossTabBookmarkService.notifyMove(sourceTabId, sourceIds); } catch (err) { /* ignore */ }
                  try {
                    const newIds = newBookmarks.slice(before.length, before.length + copies.length).map(c => c.id);
                    dispatch({ type: 'RANGE_SELECT', ids: newIds, index: targetIndex, union: false });
                  } catch (err) {
                    console.warn('Failed to select moved copies after cross-tab drop', err);
                  }
                } catch (err) {
                  const copies = moving.map(b => ({ ...b, id: Math.random().toString(36).slice(2) }));
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
          }}
        >
          <div className="grid" style={{ gap: '5px' }}>
            {bookmarks.map((b, i) => (
              <BookmarkTableRow key={b.id}
                                bookmark={b}
                                onSelect={(id, e) => handleSelect(id, i, e)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleCollapsed={handleToggleCollapsed}
                                isSelected={selectionState.selectedIds.includes(b.id)} />
            ))}
          </div>
        </DndKitMultiDragProvider>
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
