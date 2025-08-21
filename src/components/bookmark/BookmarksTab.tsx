import { useState } from 'react';
// ...existing code...
import { Bookmark, BookmarkInput, BookmarksTabConfig } from '../../types/bookmark';
import BookmarkCard from './BookmarkCard';
import BookmarkForm from './BookmarkForm';
import { v4 as uuidv4 } from 'uuid';

interface BookmarksTabProps {
  config?: BookmarksTabConfig;
  onConfigChange?: (cfg: BookmarksTabConfig) => void;
}

export default function BookmarksTab(props: Readonly<BookmarksTabProps> = {}) {
  const { config, onConfigChange } = props;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const bookmarks = config?.bookmarks || [];

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsFormOpen(true);
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
    const now = new Date();
    if (editingBookmark) {
      const updated: Bookmark = {
        ...editingBookmark,
        ...data,
        tags: data.tags || editingBookmark.tags || [],
        updatedAt: now
      };
      const newBookmarks = bookmarks.map(b => b.id === updated.id ? updated : b);
      if (onConfigChange) onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    } else {
      const newBookmark: Bookmark = {
        id: uuidv4(),
        title: data.title,
        url: data.url,
        description: data.description || undefined,
        tags: data.tags || [],
        createdAt: now,
        updatedAt: now
      };
      const newBookmarks = [...bookmarks, newBookmark];
      if (onConfigChange) onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    }
    setIsFormOpen(false);
    setEditingBookmark(null);
  };

  return (
    <div style={{ padding: 12 }}>
      <h4>{config?.title ?? 'Bookmarks'}</h4>
      {bookmarks.length === 0 ? (
        <div>No bookmarks</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {bookmarks.map(b => (
            <BookmarkCard key={b.id} bookmark={b} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {isFormOpen && (
        <BookmarkForm
          bookmark={editingBookmark}
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingBookmark(null); }}
        />
      )}
    </div>
  );
}
