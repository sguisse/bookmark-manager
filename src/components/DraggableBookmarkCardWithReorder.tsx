import React, { useState } from 'react';
import { ExternalLink, Edit, Trash2, Tag, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Bookmark } from '../types/bookmark';
import { useBookmarks } from '../contexts/BookmarkContext';

interface DraggableBookmarkCardWithReorderProps {
  readonly bookmark: Bookmark;
  readonly groupId: string;
  readonly index: number;
  readonly onEdit?: (bookmark: Bookmark) => void;
  readonly onReorder?: (sourceIndex: number, destIndex: number) => void;
  readonly onDragPreview?: (sourceIndex: number, destIndex: number, bookmark: Bookmark) => void;
  readonly onClearPreview?: () => void;
  readonly isPreview?: boolean;
}

export const DraggableBookmarkCardWithReorder: React.FC<DraggableBookmarkCardWithReorderProps> = ({
  bookmark,
  groupId,
  index,
  onEdit,
  onReorder,
  onDragPreview,
  onClearPreview,
  isPreview = false,
}) => {
  const { groups, deleteBookmark } = useBookmarks();
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Trouver la couleur du groupe
  const group = groups.find(g => g.id === groupId);
  const groupColor = group?.color || '#3b82f6';

  // Variable globale pour stocker les données de drag (workaround pour la limitation du navigateur)
  const setDragData = (data: any) => {
    (window as any).__dragData = data;
  };

  const getDragData = () => {
    return (window as any).__dragData;
  };

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

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
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

    // Stocker dans le window pour contourner la limitation du navigateur
    setDragData(dragData);

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', `${groupId}:${index}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverPosition(null);
    // Nettoyer la prévisualisation à la fin du drag
    if (onClearPreview) {
      onClearPreview();
    }
    // Nettoyer les données de drag
    (window as any).__dragData = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Utiliser les données stockées dans window pour contourner la limitation du navigateur
    const dragData = getDragData();
    if (dragData && dragData.sourceGroupId === groupId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'top' : 'bottom';
      setDragOverPosition(position);

      // Déclencher la prévisualisation si disponible
      if (onDragPreview && dragData.sourceIndex !== index) {
        const sourceIndex = dragData.sourceIndex;
        const destIndex = position === 'top' ? index : index + 1;

        if (sourceIndex !== destIndex && sourceIndex !== destIndex - 1) {
          onDragPreview(sourceIndex, destIndex, dragData.bookmark);
        }
      }
    }
  };  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverPosition(null);
    // Nettoyer la prévisualisation si on quitte la zone de drop
    if (onClearPreview) {
      onClearPreview();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Sauvegarder la position avant de la réinitialiser
    const savedPosition = dragOverPosition;
    setDragOverPosition(null);

    // Nettoyer la prévisualisation dès le début du drop
    if (onClearPreview) {
      onClearPreview();
    }

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const { sourceGroupId, sourceIndex } = dragData;

      // Réorganisation dans le même groupe
      if (sourceGroupId === groupId && sourceIndex !== index && onReorder) {
        let destIndex = index;
        if (savedPosition === 'bottom') {
          destIndex = index + 1;
        }
        // Si on drag vers le top, destIndex reste = index

        console.log(`DEBUG: Reordering from ${sourceIndex} to ${destIndex}, current card index: ${index}, saved position: ${savedPosition}`);
        onReorder(sourceIndex, destIndex);
      } else {
        console.log(`DEBUG: No reorder - sourceGroupId: ${sourceGroupId}, groupId: ${groupId}, sourceIndex: ${sourceIndex}, index: ${index}`);
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
        className={`bookmark-card draggable-bookmark ${isDragging ? 'dragging' : ''} ${isPreview ? 'preview-item' : ''} ${isCollapsed ? 'collapsed' : ''}`}
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
            className="action-button collapse-toggle"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Développer' : 'Réduire'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
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

        {!isCollapsed && (
          <>
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
          </>
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
