import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookmarkForm from './BookmarkForm';
// ...existing code...
import { Bookmark, BookmarkInput, BookmarksTabConfig } from '../../types/bookmark';
import BookmarkCard from './BookmarkCard';

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

  const handleSubmit = (data: BookmarkInput) => {
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

    window.addEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
    return () => window.removeEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
  }, [nodeId]);

  return (
    <div style={{ padding: 0 }}>
      {bookmarks.length === 0 ? (
        <div>No bookmarks</div>
      ) : (
        <div style={{ display: 'grid', gap: 5 }}>
          {bookmarks.map(b => (
            <BookmarkCard key={b.id} bookmark={b} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
      {isBookmarkFormOpen && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <button onClick={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }} aria-label="Close modal" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', border: 'none', padding: 0, cursor: 'pointer' }} />
          <div style={{ position: 'relative', width: 720, maxWidth: '95%', background: '#fff', padding: 20, borderRadius: 8 }}>
            <BookmarkForm bookmark={editingBookmark} onSubmit={(d) => handleSubmit(d as BookmarkInput)} onCancel={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}
