import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import type { Bookmark } from '../../../types/bookmark';

export type DropEffect = 'move' | 'copy' | 'none';

export type DndState = {
  draggingIds: string[];
  previewIndex: number | null;
  effect: DropEffect;
};

import React, { useCallback } from 'react';

export function DndProviderWrapper(props: {
  children: React.ReactNode;
  visibleList: Bookmark[];
  tabId?: string;
  onPerformDrop: (opts: { sourceIds: string[]; sourceTabId?: string; targetIndex: number; effect: DropEffect }) => Promise<void>;
}) {
  const { children, visibleList, onPerformDrop } = props;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: undefined })
  );

  const handleDragStart = useCallback(() => {
    // nothing special for now
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // attempt to compute source and target
    // active.id and over.id are bookmark ids
    const sourceId = String(active.id);
    const targetId = String(over.id);
    const sourceIndex = visibleList.findIndex(b => b.id === sourceId);
    const targetIndex = visibleList.findIndex(b => b.id === targetId);

    // simple move
    if (sourceIndex !== -1 && targetIndex !== -1) {
      await onPerformDrop({ sourceIds: [sourceId], targetIndex, effect: 'move' });
    }
  }, [visibleList, onPerformDrop]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[]}
    >
      <SortableContext items={visibleList.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function useSortableRow(id: string) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition
  } as React.CSSProperties;

  return { attributes, listeners, setNodeRef, style, isDragging };
}
