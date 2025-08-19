import React, { useState } from 'react';
import { ExternalLink, Edit, Trash2, Tag } from 'lucide-react';
import { Bookmark } from '../types/bookmark';
import { useBookmarks } from '../contexts/BookmarkContext';

interface BookmarkCardProps {
  readonly bookmark: Bookmark;
  readonly groupId: string;
  readonly onEdit?: (bookmark: Bookmark) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  groupId,
  onEdit,
}) => {
  const { groups, deleteBookmark } = useBookmarks();
  const [imageError, setImageError] = useState(false);

  // Trouver la couleur du groupe
  const group = groups.find(g => g.id === groupId);
  const groupColor = group?.color || '#3b82f6';

  const handleOpenBookmark = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${bookmark.title}" ?`)) {
      deleteBookmark(groupId, bookmark.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(bookmark);
    }
  };

  return (
    <div
      className="bookmark-card"
      style={{ '--group-color': groupColor } as React.CSSProperties}
      onClick={handleOpenBookmark}
    >
      <div className="bookmark-actions">
        <button
          className="action-button"
          onClick={handleEdit}
          title="Modifier"
        >
          <Edit size={16} />
        </button>
        <button
          className="action-button delete"
          onClick={handleDelete}
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="bookmark-title">
        {!imageError && bookmark.favicon && (
          <img
            src={bookmark.favicon}
            alt=""
            className="bookmark-favicon"
            onError={() => setImageError(true)}
          />
        )}
        <span>{bookmark.title}</span>
        <ExternalLink size={16} style={{ opacity: 0.5, marginLeft: 'auto' }} />
      </div>

      <div className="bookmark-url">{bookmark.url}</div>

      {bookmark.description && (
        <div className="bookmark-description">{bookmark.description}</div>
      )}

      {bookmark.tags.length > 0 && (
        <div className="bookmark-tags">
          <Tag size={12} style={{ opacity: 0.7 }} />
          {bookmark.tags.map((tag, index) => (
            <span key={index} className="bookmark-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
