import React, { useState } from 'react';
import { DraggableBookmarkCardFlexLayout } from './DraggableBookmarkCardFlexLayout';
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
    setIsDragOver(false);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const { sourceGroupId, sourceIndex, bookmarkId } = dragData;

      // Si on déplace vers le même groupe, on ne fait rien
      if (sourceGroupId === groupId) {
        return;
      }

      // Calculer la position de destination
      const destIndex = bookmarks.length;

      // Déplacer le bookmark
      moveBookmark(sourceGroupId, groupId, sourceIndex, destIndex);

      console.log(`Moved bookmark from ${sourceGroupId}[${sourceIndex}] to ${groupId}[${destIndex}]`);
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
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
      {bookmarks.map((bookmark, index) => (
        <DraggableBookmarkCardFlexLayout
          key={bookmark.id}
          bookmark={bookmark}
          groupId={groupId}
          index={index}
          onEdit={() => onEdit(bookmark)}
        />
      ))}
    </div>
  );
};
