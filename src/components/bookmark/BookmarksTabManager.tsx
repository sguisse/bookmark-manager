import { useState, useEffect } from 'react';
import BookmarkForm from './BookmarkForm';
import { Bookmark, BookmarksTabConfig } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';
import BookmarkTableRow from './BookmarksViewer';
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
