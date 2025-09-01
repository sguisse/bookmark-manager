# DnD Kit Integration for Bookmark Manager

This folder contains a lightweight integration with dnd-kit to provide sortable and cross-tab drag & drop for bookmarks.

Files:
- `useDndKitBookmarks.tsx` - DndProvider wrapper and small helpers (`useSortableRow`).
- `DndPreview.tsx` - simple visual preview component (consumed by the list container).

Notes:
- The implementation is intentionally minimal and demonstrates how to wire dnd-kit into the existing manager. It must be extended to support multi-selection drag, copy vs move semantics (Alt key), and external drops.
- The orchestrator (`onPerformDrop`) must implement persistence (reorder, copy-with-new-ids, cross-tab events).

Next steps:
- Add keyboard sensor coordinateGetter implementation to support keyboard sorting.
- Add drag overlay visuals with `DragOverlay` for better UX.
- Wire multi-item drag start handling via `DragStartEvent`.

# DndKit Multi-Drag Integration

This folder contains the dnd-kit multi-drag provider and preview marker for bookmark manager.

- `DndKitMultiDragProvider.tsx`: DndContext provider for multi-selection drag, Alt/Option copy modifier, DragOverlay for ghost preview, and drop orchestration.
- `DndKitPreviewMarker.tsx`: Visual marker for insertion preview and count badge.
- `useDndKitSortableRow`: Hook for sortable row props (attributes, listeners, ref, style).

Usage:
- Wrap your bookmarks list in `DndKitMultiDragProvider`, passing `visibleList`, `selectedIds`, `tabId`, and `onPerformDrop`.
- Use `useDndKitSortableRow(bookmark.id)` in each row to get drag/drop props.
- Render `DndKitPreviewMarker` at the computed preview position (top/left/width) with effect and count.

Next steps:
- Wire preview marker to row refs and DndContext state.
- Extend drop orchestration for cross-tab and external drops.
- Add keyboard sensor coordinateGetter for full accessibility.
