import { useState, useEffect } from 'react';
// ...existing code...
import { Bookmark, BookmarkInput, BookmarksTabConfig } from '../../types/bookmark';
import BookmarkCard from '../bookmark/BookmarkCard';

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

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkFormOpen(true);
  };

  const handleDelete = (bookmarkId: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    if (onConfigChange) {
      onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    } else {
      console.log('Delete bookmark', bookmarkId);
    }
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

    window.addEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
    return () => window.removeEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
  }, [nodeId]);

  return (
    <div style={{ padding: 12 }}>
      {bookmarks.length === 0 ? (
        <div>No bookmarks</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {bookmarks.map(b => (
            <BookmarkCard key={b.id} bookmark={b} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
