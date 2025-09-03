import { useState, useEffect } from 'react';
import { Bookmark, BookmarksTabConfig } from '../../types/bookmark';
import BookmarksPanel from './BookmarksPanel';
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
    <BookmarksPanel
      bookmarks={bookmarks}
      selectionState={selectionState}
      isBookmarkFormOpen={isBookmarkFormOpen}
      editingBookmark={editingBookmark}
      onSelect={handleSelect}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleCollapsed={handleToggleCollapsed}
      onSubmit={handleSubmit}
      onCloseForm={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
    />
  );
}
