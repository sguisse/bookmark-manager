import { useState, useEffect } from 'react';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark, BookmarkInput } from '../../types/bookmark';
import BookmarkCard from './BookmarkCard';
import BookmarkForm from './BookmarkForm';

export default function BookmarksTab() {
  const { theme } = useTheme();
  const { groups, selectedGroupId, addBookmark, updateBookmark, deleteBookmark } = useBookmarks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) ?? null;

  // Close modal on Escape or Enter at document level to avoid attaching keyboard handlers to non-interactive elements
  useEffect(() => {
    if (!isFormOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        setIsFormOpen(false);
        setEditingBookmark(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFormOpen]);

  if (!selectedGroup) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '2rem',
          textAlign: 'center',
          color: theme.colors.text.secondary
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📚</div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: theme.colors.text.primary }}>
          No Group Selected
        </h3>
        <p style={{ margin: 0, fontSize: theme.fonts.sizes.small }}>
          Select a group from the sidebar to view and manage bookmarks
        </p>
      </div>
    );
  }

  const handleAddBookmark = (bookmarkData: BookmarkInput) => {
    addBookmark(selectedGroup.id, bookmarkData);
    setIsFormOpen(false);
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsFormOpen(true);
  };

  const handleUpdateBookmark = (bookmarkData: BookmarkInput) => {
    if (editingBookmark) {
      updateBookmark(selectedGroup.id, editingBookmark.id, bookmarkData as Partial<Bookmark>);
      setEditingBookmark(null);
      setIsFormOpen(false);
    }
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      deleteBookmark(selectedGroup.id, bookmarkId);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBookmark(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Add Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${theme.colors.border}`
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 0.25rem 0',
              fontSize: theme.fonts.sizes.large,
              fontWeight: 600,
              color: theme.colors.text.primary
            }}
          >
            {selectedGroup.title}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: theme.fonts.sizes.small,
              color: theme.colors.text.secondary
            }}
          >
            {selectedGroup.bookmarks.length} bookmark{selectedGroup.bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: theme.colors.primary,
            color: '#ffffff',
            fontSize: theme.fonts.sizes.medium,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ display: 'inline-block' }}>➕</span>
          <span style={{ marginLeft: '0.4rem' }}>Add Bookmark</span>
        </button>
      </div>

      {/* Bookmarks Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {selectedGroup.bookmarks.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '3rem',
              textAlign: 'center',
              color: theme.colors.text.secondary
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🔖</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: theme.colors.text.primary }}>
              No Bookmarks Yet
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: theme.fonts.sizes.small }}>
              Add your first bookmark to get started
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              style={{
                padding: '0.75rem 1.5rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                backgroundColor: theme.colors.surface,
                color: theme.colors.text.primary,
                fontSize: theme.fonts.sizes.medium,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = theme.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
                e.currentTarget.style.color = theme.colors.text.primary;
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              Add First Bookmark
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
              padding: '0 0 1rem 0'
            }}
          >
            {selectedGroup.bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={handleEditBookmark}
                onDelete={handleDeleteBookmark}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bookmark Form Modal */}
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bookmark form"
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: '8px',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90%',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <BookmarkForm
              bookmark={editingBookmark}
              onSubmit={editingBookmark ? handleUpdateBookmark : handleAddBookmark}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
