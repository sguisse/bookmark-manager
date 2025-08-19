import React, { useState } from 'react';
import { DraggableBookmarkCardWithReorder } from './DraggableBookmarkCardWithReorder';
import { Bookmark } from '../types/bookmark';
import { useBookmarks } from '../contexts/BookmarkContext';

interface DroppableGroupBookmarkListProps {
  bookmarks: Bookmark[];
  groupId: string;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
}

export const DroppableGroupBookmarkList: React.FC<DroppableGroupBookmarkListProps> = ({
  bookmarks,
  groupId,
  onEdit,
  onDelete,
}) => {
  const { moveBookmark } = useBookmarks();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Vérifier si on quitte vraiment le container
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Toujours nettoyer l'état drag-over, même pour les réorganisations internes
    setIsDragOver(false);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const { sourceGroupId, sourceIndex } = dragData;

      // Si on déplace vers le même groupe, la réorganisation est gérée par les cartes individuelles
      // mais on s'assure quand même de nettoyer l'état drag-over
      if (sourceGroupId === groupId) {
        console.log(`Internal drag detected for group ${groupId} - drag-over cleared`);
        return;
      }

      // Calculer la position de destination pour un drop entre groupes
      const destIndex = bookmarks.length;

      // Déplacer le bookmark vers un autre groupe
      moveBookmark(sourceGroupId, groupId, sourceIndex, destIndex);

      console.log(`Moved bookmark from ${sourceGroupId}[${sourceIndex}] to ${groupId}[${destIndex}]`);
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  const handleReorder = (sourceIndex: number, destIndex: number) => {
    console.log(`DEBUG handleReorder: sourceIndex=${sourceIndex}, destIndex=${destIndex}`);

    // S'assurer que drag-over est nettoyé lors d'une réorganisation
    setIsDragOver(false);

    // Réorganisation dans le même groupe
    if (sourceIndex !== destIndex) {
      const adjustedDestIndex = sourceIndex < destIndex ? destIndex - 1 : destIndex;
      console.log(`DEBUG: Moving bookmark from ${sourceIndex} to ${adjustedDestIndex}`);
      moveBookmark(groupId, groupId, sourceIndex, adjustedDestIndex);
      console.log(`Reordered bookmark in ${groupId} from ${sourceIndex} to ${adjustedDestIndex}`);
    }
  };  const handleDragPreview = (sourceIndex: number, destIndex: number) => {
    // Fonction conservée pour compatibilité mais pas utilisée en mode simple
    console.log(`Preview: ${sourceIndex} -> ${destIndex}`);
  };

  const handleClearPreview = () => {
    // Fonction conservée pour compatibilité
  };

  if (bookmarks.length === 0) {
    return (
      <div
        className={`empty-bookmarks drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>{isDragOver ? 'Déposez le bookmark ici' : 'Aucun bookmark dans ce groupe'}</p>
      </div>
    );
  }

  return (
    <div
      className={`group-bookmarks-list drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {bookmarks.map((bookmark, index) => {
        return (
          <DraggableBookmarkCardWithReorder
            key={bookmark.id}
            bookmark={bookmark}
            groupId={groupId}
            index={index}
            onEdit={() => onEdit(bookmark)}
            onReorder={handleReorder}
            onDragPreview={handleDragPreview}
            onClearPreview={handleClearPreview}
            isPreview={false}
          />
        );
      })}
    </div>
  );
};
