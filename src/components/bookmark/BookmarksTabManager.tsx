import { useState, useEffect } from 'react';
import BookmarkForm from './BookmarkForm';
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
  const [isBookmarkFormOpen, setIsBookmarkFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const bookmarks = config?.bookmarks || [];
  // Used to know the action needed if user click on toggle view button in tab toolbar
  const [tabToggleViewMode, setTabToggleViewMode] = useState<'card' | 'row'>(config?.toggleTabViewMode || 'row');

  // Selection now managed by the hook

  const { handleAdd, handleSelect, handleToggleTabView, handleOpenAllUrls, handleEdit, handleToggleCollapsed, handleDelete, handleSubmit, selectionState } = useBookmarksTabHandlers({
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


  return (
    <div className="p-0">
      {bookmarks.length === 0 ? (
        <div className="text-secondary p-4 text-center">No bookmarks</div>
      ) : (
        <DndKitMultiDragProvider
          visibleList={bookmarks}
          selectedIds={selectionState.selectedIds}
          tabId={nodeId}
          onPerformDrop={async ({ sourceIds, /* sourceTabId, */ targetIndex, effect }) => {
            // Move or copy within the same tab. Caller persists via onConfigChange.
            if (!onConfigChange) return;
            const sourceSet = new Set(sourceIds);
            const moving = bookmarks.filter(b => sourceSet.has(b.id));
            const remaining = bookmarks.filter(b => !sourceSet.has(b.id));
            const before = remaining.slice(0, targetIndex);
            const after = remaining.slice(targetIndex);

            let newBookmarks: Bookmark[];
            if (effect === 'copy') {
              // Duplicate moved items with new ids
              const copies = moving.map(b => ({ ...b, id: Math.random().toString(36).slice(2) }));
              newBookmarks = [...before, ...copies, ...after];
              // Keep selection on the newly copied items
              // Note: selectionState is owned by the hook; we can't mutate it here — it's fine if copies are not selected by default.
            } else {
              // move
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
