import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import type { Bookmark } from '../../../types/bookmark';
import { getRowRect, registerRow } from './rowRegistry';
import { DndKitPreviewMarker } from './DndKitPreviewMarker';

export type DropEffect = 'move' | 'copy' | 'none';

export interface DndKitMultiDragProviderProps {
  visibleList: Bookmark[];
  selectedIds: string[];
  tabId?: string;
  onPerformDrop: (opts: { sourceIds: string[]; sourceTabId?: string; targetIndex: number; effect: DropEffect }) => Promise<void>;
  children: React.ReactNode;
}

export function DndKitMultiDragProvider({ visibleList, selectedIds, tabId, onPerformDrop, children }: DndKitMultiDragProviderProps) {
  const [overlay, setOverlay] = useState<React.ReactNode | null>(null);
  const [effect, setEffect] = useState<DropEffect>('move');
  const dragSourceTab = useRef<string | undefined>(tabId);
  const isDraggingRef = useRef(false);
  const dragCountRef = useRef<number>(1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    // cleanup on unmount
    return () => {
      isDraggingRef.current = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderOverlay = (count: number, eff: DropEffect) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'rgba(0,123,255,0.12)',
      border: '1px solid #007bff',
      borderRadius: 8,
      padding: 8,
      minWidth: 120,
      fontWeight: 600,
      color: '#007bff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
    }}>
      <div>{count > 1 ? `${count} bookmarks` : '1 bookmark'}</div>
      {eff === 'copy' && (
        <div style={{
          marginLeft: 6,
          background: '#fff',
          color: '#007bff',
          borderRadius: '50%',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        }}>+</div>
      )}
    </div>
  );

  function onKeyDown(e: KeyboardEvent) {
    if (!isDraggingRef.current) return;
    if (e.altKey) {
      setEffect(prev => {
        if (prev !== 'copy') {
          setOverlay(renderOverlay(dragCountRef.current, 'copy'));
        }
        return 'copy';
      });
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (!isDraggingRef.current) return;
    if (!e.altKey) {
      setEffect(prev => {
        if (prev !== 'move') {
          setOverlay(renderOverlay(dragCountRef.current, 'move'));
        }
        return 'move';
      });
    }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    const ids = selectedIds.includes(id) ? selectedIds : [id];
    const nativeEvent = (event as any).event as (MouseEvent | KeyboardEvent | undefined);
    const initialEffect: DropEffect = nativeEvent?.altKey ? 'copy' : 'move';
    setEffect(initialEffect);
    isDraggingRef.current = true;
    dragCountRef.current = ids.length;
    setOverlay(renderOverlay(dragCountRef.current, initialEffect));

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }, [selectedIds]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // update overlay effect if native event indicates modifier change
    const nativeEvent = (event as any).event as (MouseEvent | KeyboardEvent | undefined);
    if (nativeEvent) {
      const maybeEffect: DropEffect = nativeEvent.altKey ? 'copy' : 'move';
      if (maybeEffect !== effect) {
        setEffect(maybeEffect);
        // update overlay if present
        setOverlay(renderOverlay(dragCountRef.current, maybeEffect));
      }
    }

    // compute preview marker position based on target row rect if available
    const overId = event.over?.id;
    if (overId) {
      const rect = getRowRect(String(overId));
      if (rect) {
        // position the marker at the top edge of the over element
        const top = rect.top;
        const left = rect.left;
        const width = rect.width;
        const eff = nativeEvent ? (nativeEvent.altKey ? 'copy' : 'move') : effect;
        // render marker into overlay (we keep overlay for label; render both)
        setOverlay(prev => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {prev}
            <DndKitPreviewMarker top={top} left={left} width={width} effect={eff as 'move' | 'copy'} count={dragCountRef.current} />
          </div>
        ));
      }
    }
  }, [effect]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setOverlay(null);
    isDraggingRef.current = false;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);

    if (!over) return;
    const sourceId = String(active.id);
    const targetId = String(over.id);
    const sourceIds = selectedIds.includes(sourceId) ? selectedIds : [sourceId];
    const targetIndex = visibleList.findIndex(b => b.id === targetId);
    // prefer runtime effect
    const dropEffect: DropEffect = effect;
    await onPerformDrop({ sourceIds, sourceTabId: dragSourceTab.current, targetIndex, effect: dropEffect });
  }, [selectedIds, visibleList, onPerformDrop, effect]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={visibleList.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay dropAnimation={null}>{overlay}</DragOverlay>
    </DndContext>
  );
}

export function useDndKitSortableRow(id: string) {
  const { attributes, listeners, setNodeRef: origSetNodeRef, transform, transition, isDragging } = useSortable({ id });
  const setNodeRef = (el: HTMLElement | null) => {
    // register the row for preview geometry
    registerRow(id, el);
    // call original setNodeRef (dnd-kit internal)
    origSetNodeRef(el as any);
  };

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition
  } as React.CSSProperties;

  return { attributes, listeners, setNodeRef, style, isDragging };
}
