import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookmarkForm from './BookmarkForm';
import { Bookmark, BookmarkFormData, BookmarksTabConfig } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';
import BookmarkTableRow from './BookmarksViewer';
import { openAllUrls } from './utils';

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
  const [tableRowViewMode, setTableRowViewMode] = useState<'card' | 'row'>(config?.viewMode || 'row');

  // Support multi-selection within a tab
  const [selectedIds, setSelectedIds] = useState<string[]>([]);


  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkFormOpen(true);
  };

  // Handle individual bookmark collapsed toggle
  const handleToggleCollapsed = (bookmarkId: string) => {
    if (!onConfigChange) return;

    const updatedBookmarks = bookmarks.map(b =>
      b.id === bookmarkId
        ? { ...b, collapsed: !(b.collapsed ?? true) }
        : b
    );

    onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updatedBookmarks });
  };


  const handleDelete = (bookmarkId: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    if (onConfigChange) {
      onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    } else {
      console.log('Delete bookmark', bookmarkId);
    }
  };

  const handleSubmit = (data: BookmarkFormData) => {
    // if editingBookmark is set and has an id, update existing
    if (editingBookmark?.id) {
      const updated = bookmarks.map(b => b.id === editingBookmark.id ? { ...b, ...data } : b);
      onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
      setEditingBookmark(null);
      setIsBookmarkFormOpen(false);
      return;
    }

    // create new - insert at remembered pendingInsertIndex if present
    const newBookmark: Bookmark = {
      id: uuidv4(),
      title: data.title || '',
      url: data.url || '',
      icon: data.icon || '',
      color: data.color || '',
      description: data.description || '',
      tags: data.tags || [],
      collapsed: true,
      createdDate: new Date(),
      lastModifiedDate: new Date()
    };

    const updated = [...bookmarks, newBookmark];
    onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
    setIsBookmarkFormOpen(false);
    setEditingBookmark(null);
  };

  // Listen for toolbar events dispatched from FlexLayoutManager for this node
  const handler = (e: Event) => {
    try {
      const ce = e as CustomEvent<{ nodeId: string }>;
      if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
        // open add-bookmark form
        setEditingBookmark(null);
        setIsBookmarkFormOpen(true);
      }
    } catch (err) {
      console.warn('toolbar event handler error', err);
    }
  };

  const toggleAllTableRowsViewHandler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
          console.log('[BookmarksTabManager] Toggle handler triggered, current view:', tableRowViewMode);

          const newViewMode = tableRowViewMode === 'card' ? 'row' : 'card';
          console.log('[BookmarksTabManager] Switching to view:', newViewMode);

          setTableRowViewMode(newViewMode);

          // When toggling to table view (row), set all bookmarks to collapsed (true)
          // When toggling to card view, set all bookmarks to not collapsed (false)
          if (onConfigChange) {
            const updatedBookmarks = bookmarks.map(b => ({
              ...b,
              collapsed: newViewMode === 'row'
            }));

            // Save both the view mode and updated bookmarks to config
            onConfigChange({
              ...(config || {} as BookmarksTabConfig),
              viewMode: newViewMode,
              bookmarks: updatedBookmarks
            });
          }
        }
      } catch (err) {
        console.warn('toggle view handler error', err);
      }
    };

    // Listen for toolbar events dispatched from FlexLayoutManager for this node
    useEffect(() => {
      // Sync local state with config when it changes
      if (config?.viewMode && config.viewMode !== tableRowViewMode) {
        setTableRowViewMode(config.viewMode);
      }
    }, [config?.viewMode, tableRowViewMode]);

    useEffect(() => {
      window.addEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
      window.addEventListener('flexlayout:bookmarks:toggle-table-row-view', toggleAllTableRowsViewHandler as EventListener);

    const openAllHandler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
          const urls = bookmarks.map(b => b.url).filter(Boolean);
          if (urls.length === 0) return;
          openAllUrls(urls);
        }
      } catch (err) {
        console.warn('open-all handler error', err);
      }
    };

    window.addEventListener('flexlayout:bookmarks:open-all-urls', openAllHandler as EventListener);

    return () => {
      window.removeEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
      window.removeEventListener('flexlayout:bookmarks:toggle-table-row-view', toggleAllTableRowsViewHandler as EventListener);
      window.removeEventListener('flexlayout:bookmarks:open-all-urls', openAllHandler as EventListener);
    };
  }, [nodeId, bookmarks, tableRowViewMode, config, onConfigChange]);

  return (
    <div className="p-0">
      {bookmarks.length === 0 ? (
        <div className="text-secondary p-4 text-center">No bookmarks</div>
      ) : (
        <div className="grid" style={{ gap: '5px' }}>
          {bookmarks.map(b => (
            <BookmarkTableRow key={b.id} bookmark={b} onEdit={handleEdit} onDelete={handleDelete} onToggleCollapsed={handleToggleCollapsed} />
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
              onSave={(d) => handleSubmit(d)}
              onCancel={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
