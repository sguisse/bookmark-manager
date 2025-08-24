import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookmarkForm from './BookmarkForm';
import { Bookmark, BookmarkFormData, BookmarksTabConfig } from '../../types/bookmark';
import BookmarkCard from './BookmarksViewer';

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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkFormOpen(true);
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
          setViewMode(v => v === 'card' ? 'table' : 'card');
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
        <div className="grid" style={{ gap: '5px' }}>
          {bookmarks.map(b => (
            <BookmarkCard key={b.id} bookmark={b} onEdit={handleEdit} onDelete={handleDelete} view={viewMode} />
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
