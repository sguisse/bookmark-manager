import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Bookmark } from '../types/bookmark';

interface DragDropState {
  draggedBookmark: Bookmark | null;
  sourceNodeId: string | null;
  sourceIndex: number | null;
  isDraggingAcrossTabs: boolean;
}

interface BookmarkDragDropContextType {
  dragState: DragDropState;
  startDrag: (bookmark: Bookmark, sourceNodeId: string, sourceIndex: number) => void;
  endDrag: () => void;
  isExternalDrag: (nodeId: string) => boolean;
  canAcceptDrop: (targetNodeId: string) => boolean;
}

const BookmarkDragDropContext = createContext<BookmarkDragDropContextType | undefined>(undefined);

export const useBookmarkDragDrop = () => {
  const context = useContext(BookmarkDragDropContext);
  if (!context) {
    throw new Error('useBookmarkDragDrop must be used within a BookmarkDragDropProvider');
  }
  return context;
};

export const BookmarkDragDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dragState, setDragState] = useState<DragDropState>({
    draggedBookmark: null,
    sourceNodeId: null,
    sourceIndex: null,
    isDraggingAcrossTabs: false
  });

  const startDrag = useCallback((bookmark: Bookmark, sourceNodeId: string, sourceIndex: number) => {
    console.log('[DragDropContext] Starting drag:', {
      bookmarkId: bookmark.id,
      title: bookmark.title,
      sourceNodeId,
      sourceIndex
    });

    setDragState({
      draggedBookmark: bookmark,
      sourceNodeId,
      sourceIndex,
      isDraggingAcrossTabs: false
    });
  }, []);

  const endDrag = useCallback(() => {
    console.log('[DragDropContext] Ending drag');
    setDragState({
      draggedBookmark: null,
      sourceNodeId: null,
      sourceIndex: null,
      isDraggingAcrossTabs: false
    });
  }, []);

  const isExternalDrag = useCallback((nodeId: string): boolean => {
    const isExternal = dragState.sourceNodeId !== null && dragState.sourceNodeId !== nodeId;
    if (isExternal && !dragState.isDraggingAcrossTabs) {
      // Update state to indicate cross-tab dragging
      setDragState(prev => ({ ...prev, isDraggingAcrossTabs: true }));
      console.log('[DragDropContext] Cross-tab drag detected from', dragState.sourceNodeId, 'to', nodeId);
    }
    return isExternal;
  }, [dragState.sourceNodeId, dragState.isDraggingAcrossTabs]);

  const canAcceptDrop = useCallback((targetNodeId: string): boolean => {
    // Can accept drop if there's a dragged bookmark and it's either from the same tab or a different tab
    const canAccept = dragState.draggedBookmark !== null && dragState.sourceNodeId !== null;
    console.log('[DragDropContext] Can accept drop on', targetNodeId, ':', canAccept);
    return canAccept;
  }, [dragState.draggedBookmark, dragState.sourceNodeId]);

  const value = useMemo<BookmarkDragDropContextType>(() => ({
    dragState,
    startDrag,
    endDrag,
    isExternalDrag,
    canAcceptDrop
  }), [dragState, startDrag, endDrag, isExternalDrag, canAcceptDrop]);

  return (
    <BookmarkDragDropContext.Provider value={value}>
      {children}
    </BookmarkDragDropContext.Provider>
  );
};
