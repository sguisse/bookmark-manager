import { useSortable } from '@dnd-kit/sortable';
import React from 'react';
import { registerRow } from './rowRegistry';

export function useDndKitSortableRow(id: string) {
  const { attributes, listeners, setNodeRef: origSetNodeRef, transform, transition, isDragging } = useSortable({ id });
  const setNodeRef = (el: HTMLElement | null) => {
    // register the row for preview geometry
    registerRow(id, el);
    // call original setNodeRef (dnd-kit internal)
    origSetNodeRef(el as any);
  };

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition
  };

  return { attributes, listeners, setNodeRef, style, isDragging };
}
