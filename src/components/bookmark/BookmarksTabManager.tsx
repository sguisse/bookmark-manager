import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookmarkForm from './BookmarkForm';
import { Bookmark, BookmarkFormData, BookmarksTabConfig } from '../../types/bookmark';
import BookmarkTableRow from './BookmarksViewer';

interface BookmarksTabProps {
  config?: BookmarksTabConfig;
  onConfigChange?: (cfg: BookmarksTabConfig) => void;
  nodeId?: string;
}

// Draggable bookmark row component (moved outside to prevent re-creation on renders)
interface DraggableBookmarkRowProps {
  bookmark: Bookmark;
  index: number;
  viewMode: 'card' | 'table';
  draggedBookmark: Bookmark | null;
  dragOverIndex: number | null;
  dropPosition: 'before' | 'after';
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onToggleCollapsed: (bookmarkId: string) => void; // Add toggle callback
  onDragStart: (bookmark: Bookmark) => void;
  onDragEnd: () => void;
  onDragOver: (index: number, position: 'before' | 'after') => void;
  onDrop: (targetIndex: number, position: 'before' | 'after') => void;
  onDragOverIndexChange: (index: number | null) => void;
}

function DraggableBookmarkRow({
  bookmark,
  index,
  viewMode,
  draggedBookmark,
  dragOverIndex,
  dropPosition,
  onEdit,
  onDelete,
  onToggleCollapsed,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragOverIndexChange
}: Readonly<DraggableBookmarkRowProps>) {
  const isDraggedOver = dragOverIndex === index;
  const isDragged = draggedBookmark?.id === bookmark.id;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Drag to reorder bookmark: ${bookmark.title}`}
      style={{ position: 'relative' }}
      draggable
      onDragStart={(e) => {
        onDragStart(bookmark);
        e.dataTransfer.setData('text/plain', bookmark.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const elementHeight = rect.height;
        const position = mouseY < elementHeight / 2 ? 'before' : 'after';
        onDragOver(index, position);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index, dropPosition);
      }}
      onDragLeave={(e) => {
        // Only clear if leaving the element boundary, not child elements
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          onDragOverIndexChange(null);
        }
      }}
      onKeyDown={(e) => {
        // Handle keyboard navigation for accessibility
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Could implement keyboard-based reordering here
        }
      }}
    >
      {/* Drop preview before */}
      {isDraggedOver && dropPosition === 'before' && draggedBookmark && (
        <div
          style={{
            position: 'relative',
            margin: '3px 0',
            opacity: 0.6,
            transform: 'scale(0.98)',
            border: '2px dashed #3b82f6',
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.05)',
            padding: '8px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#3b82f6',
            fontSize: '14px',
            fontWeight: 500
          }}>
            <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', opacity: 0.7 }}>📄</span>
            </div>
            <span>{draggedBookmark.title}</span>
          </div>
        </div>
      )}

      {/* Actual bookmark */}
      <div
        style={{
          opacity: isDragged ? 0.5 : 1,
          transform: isDragged ? 'rotate(2deg)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <BookmarkTableRow
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleCollapsed={onToggleCollapsed}
          view={viewMode === 'table' ? 'row' : 'card'}
        />
      </div>

      {/* Drop preview after */}
      {isDraggedOver && dropPosition === 'after' && draggedBookmark && (
        <div
          style={{
            position: 'relative',
            margin: '3px 0',
            opacity: 0.6,
            transform: 'scale(0.98)',
            border: '2px dashed #3b82f6',
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.05)',
            padding: '8px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#3b82f6',
            fontSize: '14px',
            fontWeight: 500
          }}>
            <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', opacity: 0.7 }}>📄</span>
            </div>
            <span>{draggedBookmark.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookmarksTabManager(props: Readonly<BookmarksTabProps> = {}) {
  const { config, onConfigChange, nodeId } = props;
  const [isBookmarkFormOpen, setIsBookmarkFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const bookmarks = config?.bookmarks || [];
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  // Drag and drop state
  const [draggedBookmark, setDraggedBookmark] = useState<Bookmark | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');

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

  // Try to open all URLs with a best-effort strategy:
  // 1) Attempt to open placeholder windows synchronously during the user gesture.
  // 2) If none could be created, open a helper window that asks the user to click
  //    to allow opening multiple tabs (usable when popups are blocked).
  // 3) Fallback to direct window.open for any remaining URLs.
  const openAllUrls = (urls: string[]) => {
    if (!urls || urls.length === 0) return;

    console.log('Opening all URLs as tabs in current window...');

    try {
      // Simple approach: Open all URLs as tabs in the current browser window
      // No separate windows, no complex logic - just open each URL with small delays
      urls.forEach((url, index) => {
        setTimeout(() => {
          try {
            // Open each URL in a new tab (_blank) in the current window
            window.open(url, '_blank', 'noopener,noreferrer');
            console.log('Opened URL in new tab:', url);
          } catch (err) {
            console.warn('Failed to open URL:', url, err);
          }
        }, index * 100); // 100ms delay between each to avoid popup blocking
      });

      console.log(`Scheduled ${urls.length} URLs to open as tabs`);
    } catch (err) {
      console.warn('openAllUrls failed:', err);
    }
  };

  const handleDelete = (bookmarkId: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    if (onConfigChange) {
      onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    } else {
      console.log('Delete bookmark', bookmarkId);
    }
  };

  // Drag and drop functions
  const handleDragStart = (bookmark: Bookmark) => {
    setDraggedBookmark(bookmark);
  };

  const handleDragEnd = () => {
    setDraggedBookmark(null);
    setDragOverIndex(null);
    setDropPosition('after');
  };

  const handleDragOver = (index: number, position: 'before' | 'after') => {
    if (draggedBookmark) {
      setDragOverIndex(index);
      setDropPosition(position);
    }
  };

  const handleDrop = (targetIndex: number, position: 'before' | 'after') => {
    if (!draggedBookmark || !onConfigChange) return;

    const draggedIndex = bookmarks.findIndex(b => b.id === draggedBookmark.id);
    if (draggedIndex === -1) return;

    const newBookmarks = [...bookmarks];

    // Remove dragged item
    const [draggedItem] = newBookmarks.splice(draggedIndex, 1);

    // Calculate new insertion index
    let insertIndex: number;
    if (draggedIndex < targetIndex) {
      insertIndex = position === 'before' ? targetIndex - 1 : targetIndex;
    } else {
      insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    }

    // Insert at new position
    newBookmarks.splice(insertIndex, 0, draggedItem);

    onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });

    setDraggedBookmark(null);
    setDragOverIndex(null);
    setDropPosition('after');
  };

  const handleSubmit = (data: BookmarkFormData) => {
    // if editingBookmark is set, update existing
    if (editingBookmark) {
      const updated = bookmarks.map(b => b.id === editingBookmark.id ? { ...b, ...data } : b);
      onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
      setEditingBookmark(null);
      setIsBookmarkFormOpen(false);
      return;
    }

    // create new
    const newBookmark: Bookmark = {
      id: uuidv4(),
      title: data.title || '',
      url: data.url || '',
      description: data.description,
      tags: data.tags || [],
      collapsed: viewMode === 'table', // Set collapsed based on current view mode
      createdDate: new Date(),
      lastModifiedDate: new Date()
    };

    const updated = [...bookmarks, newBookmark];
    onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
    setIsBookmarkFormOpen(false);
    setEditingBookmark(null);
  };

  // Listen for toolbar events dispatched from FlexLayoutManager for this node
  useEffect(() => {
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

    const toggleHandler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
          const newViewMode = viewMode === 'card' ? 'table' : 'card';
          setViewMode(newViewMode);

          // When toggling to table view (row), set all bookmarks to collapsed (true)
          // When toggling to card view, set all bookmarks to not collapsed (false)
          if (onConfigChange) {
            const updatedBookmarks = bookmarks.map(b => ({
              ...b,
              collapsed: newViewMode === 'table'
            }));
            onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updatedBookmarks });
          }
        }
      } catch (err) {
        console.warn('toggle view handler error', err);
      }
    };

    window.addEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
    window.addEventListener('flexlayout:bookmarks:toggle-view', toggleHandler as EventListener);

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
      window.removeEventListener('flexlayout:bookmarks:toggle-view', toggleHandler as EventListener);
      window.removeEventListener('flexlayout:bookmarks:open-all-urls', openAllHandler as EventListener);
    };
  }, [nodeId, bookmarks]);

  return (
    <div className="p-0">
      {bookmarks.length === 0 ? (
        <div className="text-secondary p-4 text-center">No bookmarks</div>
      ) : (
        <div className={`grid bookmark-grid-container ${viewMode === 'card' ? 'card-view' : ''}`} style={{ gap: viewMode === 'table' ? '2px' : '5px' }}>
          {bookmarks.map((b, index) => (
            <DraggableBookmarkRow
              key={b.id}
              bookmark={b}
              index={index}
              viewMode={viewMode}
              draggedBookmark={draggedBookmark}
              dragOverIndex={dragOverIndex}
              dropPosition={dropPosition}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleCollapsed={handleToggleCollapsed}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragOverIndexChange={setDragOverIndex}
            />
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
              onSave={(d) => handleSubmit(d)}
              onCancel={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
