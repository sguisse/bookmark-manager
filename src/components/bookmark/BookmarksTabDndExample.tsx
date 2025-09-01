import { useState } from 'react';
import { DndKitMultiDragProvider, useDndKitSortableRow } from './dnd/DndKitMultiDragProvider';
import type { DropEffect } from './dnd/DndKitMultiDragProvider';
import type { Bookmark } from '../../types/bookmark';

// Example row component using dnd-kit sortable hook
function BookmarkTableRow({ bookmark, isSelected, onToggle }: { bookmark: Bookmark; isSelected: boolean; onToggle?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, style, isDragging } = useDndKitSortableRow(bookmark.id);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onToggle?.(bookmark.id)}
      style={{
        ...style,
        background: isDragging ? 'rgba(0,123,255,0.08)' : isSelected ? '#e6f0ff' : undefined,
        border: isDragging ? '2px solid #007bff' : undefined,
        padding: '8px 12px',
        marginBottom: 4,
        borderRadius: 6,
        cursor: 'grab',
      }}
      tabIndex={0}
      aria-selected={isSelected}
    >
      {bookmark.title}
    </div>
  );
}

// Example bookmarks tab manager with dnd-kit provider
export function BookmarksTabDndExample() {
  // Example bookmarks and selection state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: '1', title: 'Google', url: 'https://google.com' },
    { id: '2', title: 'GitHub', url: 'https://github.com' },
    { id: '3', title: 'React', url: 'https://react.dev' },
  ]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const tabId = 'tab-1';

  // Example drop handler: move or copy
  const handlePerformDrop = async ({ sourceIds, targetIndex, effect }: { sourceIds: string[]; targetIndex: number; effect: DropEffect }) => {
    if (effect === 'move') {
      // Move: reorder bookmarks
      const moving = bookmarks.filter(b => sourceIds.includes(b.id));
      const remaining = bookmarks.filter(b => !sourceIds.includes(b.id));
      const before = remaining.slice(0, targetIndex);
      const after = remaining.slice(targetIndex);
      setBookmarks([...before, ...moving, ...after]);
    } else {
      // Copy: duplicate bookmarks
      const toCopy = bookmarks.filter(b => sourceIds.includes(b.id));
      const copies = toCopy.map(b => ({ ...b, id: Math.random().toString(36).slice(2) }));
      const before = bookmarks.slice(0, targetIndex);
      const after = bookmarks.slice(targetIndex);
      setBookmarks([...before, ...copies, ...after]);
    }
  };

  return (
    <DndKitMultiDragProvider
      visibleList={bookmarks}
      selectedIds={selectedIds}
      tabId={tabId}
      onPerformDrop={handlePerformDrop}
    >
      <div>
        {bookmarks.map(b => (
          <BookmarkTableRow
            key={b.id}
            bookmark={b}
            isSelected={selectedIds.includes(b.id)}
            onToggle={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          />
        ))}
      </div>
    </DndKitMultiDragProvider>
  );
}
