import { Bookmark } from '../types/bookmark';

// Global event system for cross-tab bookmark transfers
interface CrossTabDropEvent {
  bookmark: Bookmark;
  sourceNodeId: string;
  targetNodeId: string;
  targetIndex: number;
  dropPosition: 'before' | 'after';
}

interface CrossTabMoveEvent {
  bookmarkId: string;
  sourceNodeId: string;
}

// Service to handle cross-tab bookmark moves
export class CrossTabBookmarkService {
  private static instance: CrossTabBookmarkService;

  private constructor() {}

  public static getInstance(): CrossTabBookmarkService {
    if (!CrossTabBookmarkService.instance) {
      CrossTabBookmarkService.instance = new CrossTabBookmarkService();
    }
    return CrossTabBookmarkService.instance;
  }

  /**
   * Request a bookmark move from one tab to another
   */
  public requestMove(
    bookmark: Bookmark,
    sourceNodeId: string,
    targetNodeId: string,
    targetIndex: number,
    dropPosition: 'before' | 'after'
  ): void {
    console.log('[CrossTabBookmarkService] Requesting cross-tab move:', {
      bookmarkId: bookmark.id,
      bookmarkTitle: bookmark.title,
      from: sourceNodeId,
      to: targetNodeId,
      targetIndex,
      dropPosition
    });

    // First dispatch event to source tab to remove the bookmark
    const moveEvent: CrossTabMoveEvent = {
      bookmarkId: bookmark.id,
      sourceNodeId
    };

    window.dispatchEvent(new CustomEvent('bookmark:cross-tab:remove', {
      detail: moveEvent
    }));

    // Then dispatch event to target tab to add the bookmark
    const dropEvent: CrossTabDropEvent = {
      bookmark: { ...bookmark }, // Clone the bookmark
      sourceNodeId,
      targetNodeId,
      targetIndex,
      dropPosition
    };

    window.dispatchEvent(new CustomEvent('bookmark:cross-tab:add', {
      detail: dropEvent
    }));
  }

  /**
   * Get enhanced drag data for dataTransfer
   */
  public createDragData(bookmark: Bookmark, sourceNodeId: string, sourceIndex: number): string {
    return JSON.stringify({
      type: 'bookmark-cross-tab',
      bookmark,
      sourceNodeId,
      sourceIndex,
      timestamp: Date.now()
    });
  }

  /**
   * Parse drag data from dataTransfer
   */
  public parseDragData(dataTransferData: string): {
    bookmark: Bookmark;
    sourceNodeId: string;
    sourceIndex: number;
  } | null {
    try {
      const data = JSON.parse(dataTransferData);
      if (data.type === 'bookmark-cross-tab' && data.bookmark && data.sourceNodeId !== undefined) {
        return {
          bookmark: data.bookmark,
          sourceNodeId: data.sourceNodeId,
          sourceIndex: data.sourceIndex
        };
      }
    } catch (err) {
      console.warn('Failed to parse drag data:', err);
    }
    return null;
  }
}

export const crossTabBookmarkService = CrossTabBookmarkService.getInstance();
