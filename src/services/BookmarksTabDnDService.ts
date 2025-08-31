import type { Bookmark } from '../types/bookmark';
import { crossTabBookmarkService } from './CrossTabBookmarkService';

interface DragDataForTransfer {
  bookmark: Bookmark;
  selectedBookmarks?: Bookmark[];
  nodeId?: string | null;
  index?: number;
  selectedIds?: string[];
}

/**
 * Create a floating drag image element for a bookmark or selection.
 */
export function createDragImageElement(bookmark: Bookmark, selectedIds: string[] = [], isCopy = false): HTMLElement {
  const dragImage = document.createElement('div');
  dragImage.style.cssText = `
    position: fixed;
    top: -1000px;
    left: -1000px;
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.95);
    color: white;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 400px;
    min-width: 100px;
    white-space: nowrap;
    overflow: visible;
    text-overflow: ellipsis;
    z-index: 9999;
  `;

  const icon = bookmark.icon || '🌐';
  if (bookmark.icon && (bookmark.icon.startsWith('http') || bookmark.icon.startsWith('data:'))) {
    dragImage.innerHTML = `<img src="${bookmark.icon}" style="width: 16px; height: 16px; border-radius: 2px;"> ${escapeHtml(bookmark.title)}`;
  } else {
    dragImage.innerHTML = `<span style="font-size: 16px;">${escapeHtml(icon)}</span> ${escapeHtml(bookmark.title)}`;
  }

  const selectionCount = selectedIds && selectedIds.length > 0 ? selectedIds.length : 1;
  if (selectionCount > 1) {
    const badge = document.createElement('span');
    badge.style.cssText = 'margin-left:8px; background: rgba(0,0,0,0.2); padding:2px 6px; border-radius:12px; font-size:12px; color:white;';
    badge.textContent = `${selectionCount}`;
    dragImage.appendChild(badge);
  }

  const indicator = document.createElement('div');
  indicator.style.cssText = `
    margin-left: 8px;
    padding: 6px 10px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4), 0 1px 3px rgba(0,0,0,0.3);
    border: 2px solid rgba(255,255,255,0.4);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  `;
  indicator.innerHTML = `<span style="font-size:14px;">📋</span><span>${isCopy ? 'COPY' : 'MOVE'}</span>`;
  dragImage.appendChild(indicator);

  return dragImage;
}

export function updateDragImageElement(bookmark: Bookmark, element: HTMLElement | null, selectedIds: string[] = [], isCopy = false): HTMLElement {
  try {
    const newEl = createDragImageElement(bookmark, selectedIds, isCopy);
    if (element?.parentNode) {
      element.parentNode.replaceChild(newEl, element);
    }
    return newEl;
  } catch (err) {
    console.warn('updateDragImageElement failed', err);
    return element || createDragImageElement(bookmark, selectedIds, isCopy);
  }
}

export function removeDragImageElement(element: HTMLElement | null): void {
  if (!element) return;
  try {
    if (element.parentNode) element.parentNode.removeChild(element);
  } catch (err) { console.warn('removeDragImageElement cleanup failed', err); }
}

/**
 * Populate DataTransfer with cross-tab / multi selection payloads
 */
export function setDataTransferForBookmarkDrag(dt: DataTransfer, opts: DragDataForTransfer) {
  const { bookmark, selectedBookmarks = [], nodeId, index, selectedIds = [] } = opts;
  try {
    dt.setData('text/plain', bookmark.id);
  } catch (err) { console.warn('setDataTransferForBookmarkDrag: failed to set effectAllowed', err); }

  const selectionCount = selectedIds && selectedIds.length > 0 ? selectedIds.length : 1;
  if (selectionCount > 1) {
    try {
      const nodesPayload = JSON.stringify({ type: 'bookmarks-multi', nodes: selectedBookmarks, sourceNodeId: nodeId, sourceIndex: index, timestamp: Date.now() });
      dt.setData('application/x-bookmarks', nodesPayload);
    } catch (err) {
      console.warn('Failed to serialize selectedBookmarks for drag', err);
    }
  } else {
    try {
      const crossTabPayload = crossTabBookmarkService.createDragData(bookmark, nodeId || '', index || 0);
      dt.setData('application/x-bookmark-cross-tab', crossTabPayload);
    } catch (err) {
      console.warn('Failed to set cross-tab drag payload', err);
    }
  }

  try {
    dt.effectAllowed = 'copyMove';
  } catch (err) { console.warn('setDataTransferForBookmarkDrag: failed to set effectAllowed', err); }
}

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
