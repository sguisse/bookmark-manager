import React, { useState } from 'react';
import { ExternalLink, Edit, Trash2, Tag, GripVertical } from 'lucide-react';
import { Bookmark } from '../types/bookmark';
import { useBookmarks } from '../contexts/BookmarkContext';

interface DraggableBookmarkCardWithReorderProps {
  readonly bookmark: Bookmark;
  readonly groupId: string;
  readonly index: number;
  readonly onEdit?: (bookmark: Bookmark) => void;
  readonly onReorder?: (sourceIndex: number, destIndex: number) => void;
}

export const DraggableBookmarkCardWithReorder: React.FC<DraggableBookmarkCardWithReorderProps> = ({
  bookmark,
  groupId,
  index,
  onEdit,
  onReorder,
}) => {
  const { groups, deleteBookmark } = useBookmarks();
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);

  // Trouver la couleur du groupe
  const group = groups.find(g => g.id === groupId);
  const groupColor = group?.color || '#3b82f6';

  const handleOpenBookmark = () => {
    if (!isDragging) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    }
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

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);

    // Stocker les données du bookmark à déplacer
    const dragData = {
      bookmarkId: bookmark.id,
      sourceGroupId: groupId,
      sourceIndex: index,
      bookmark: bookmark
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', `${groupId}:${index}`); // Format simple pour vérification
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverPosition(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Vérifier si c'est un drag interne (même groupe)
    const simpleData = e.dataTransfer.getData('text/plain');
    if (simpleData && simpleData.startsWith(`${groupId}:`)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'top' : 'bottom';
      setDragOverPosition(position);
    }
  };  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPosition(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const { sourceGroupId, sourceIndex } = dragData;

      // Réorganisation dans le même groupe
      if (sourceGroupId === groupId && sourceIndex !== index && onReorder) {
        let destIndex = index;
        if (dragOverPosition === 'bottom') {
          destIndex = index + 1;
        }
        // Si on drag vers le top, destIndex reste = index

        console.log(`Reordering from ${sourceIndex} to ${destIndex}`);
        onReorder(sourceIndex, destIndex);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  return (
    <div className="bookmark-card-wrapper">
      {/* Zone de drop en haut */}
      <div
        className={`drop-indicator ${dragOverPosition === 'top' ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      <div
        className={`bookmark-card draggable-bookmark ${isDragging ? 'dragging' : ''}`}
        style={{ '--group-color': groupColor } as React.CSSProperties}
        onClick={handleOpenBookmark}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="bookmark-drag-handle" title="Déplacer le bookmark">
          <GripVertical size={14} />
        </div>

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
            {bookmark.tags.map((tag, tagIndex) => (
              <span key={`tag-${tagIndex}`} className="bookmark-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Zone de drop en bas */}
      <div
        className={`drop-indicator ${dragOverPosition === 'bottom' ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    </div>
  );
};
