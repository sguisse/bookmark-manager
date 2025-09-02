# DnD Kit Integration for Bookmark Manager

This folder contains a lightweight integration with dnd-kit to provide sortable and cross-tab drag & drop for bookmarks.

Files

- `useDndKitBookmarks.tsx` — DndProvider wrapper and small helpers (`useSortableRow`).
- `DndPreview.tsx` — simple visual preview component (consumed by the list container).

Notes

- The implementation is intentionally minimal and demonstrates how to wire dnd-kit into the existing manager. It should be extended to support multi-selection drag, copy vs move semantics (Alt key), and external drops.
- The orchestrator (`onPerformDrop`) must implement persistence (reorder, copy-with-new-ids, cross-tab events).

Quick overview

This folder implements a global DnD context and helpers so bookmark lists across FlexLayout tabs can participate in the same drag session.

- `GlobalDndProvider.tsx`: App-level DndContext provider for multi-selection drag, Alt/Option copy modifier, DragOverlay for ghost preview, and drop orchestration.
- `DndKitPreviewMarker.tsx`: Visual marker used to show the insertion preview and a count badge when multiple items are dragged.
- `useDndKitSortableRow`: Hook that provides sortable props for each row (attributes, listeners, ref, style) and registers row DOM rects for preview positioning.

Usage

1. Mount `GlobalDndProvider` at the application root so all lists share the same DndContext.
2. In each bookmarks list component, register the visible items and selected ids with the provider (the repository contains an example in `BookmarksTabManager`).
3. Use `useDndKitSortableRow(bookmark.id)` in each row to get the necessary drag/drop props and to register the row element for preview geometry.

Next steps

- Wire keyboard sensor coordinateGetter for keyboard sorting accessibility.
- Improve DragOverlay visuals for clearer multi-item feedback.
- Add automated tests for cross-tab drag/move/copy behavior.

References

- dnd-kit documentation: [dnd-kit on GitHub](https://github.com/clauderic/dnd-kit)
