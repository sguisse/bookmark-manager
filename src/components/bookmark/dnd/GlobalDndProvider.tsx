import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Bookmark } from '../../../types/bookmark';
import { getRowRect } from './rowRegistry';
import { crossTabBookmarkService } from '../../../services/CrossTabBookmarkService';
import { DndKitPreviewMarker } from './DndKitPreviewMarker';

type DropEffect = 'move' | 'copy' | 'none';

type OnPerformDrop = (opts: { sourceIds: string[]; sourceTabId?: string; targetIndex: number; effect: DropEffect }) => Promise<void>;

type RegisteredList = {
  tabId: string;
  items: Bookmark[];
  selectedIds: string[];
  onPerformDrop: OnPerformDrop;
};

const GlobalDndContext = createContext<{
  registerList: (list: RegisteredList) => void;
  updateList: (list: RegisteredList) => void;
  unregisterList: (tabId: string) => void;
} | null>(null);

export const useGlobalDnd = () => {
  const ctx = useContext(GlobalDndContext);
  if (!ctx) throw new Error('useGlobalDnd must be used within GlobalDndProvider');
  return ctx;
};

// Non-throwing optional accessor useful for code that may run outside the provider during tests
export const useOptionalGlobalDnd = () => {
  return useContext(GlobalDndContext);
};

export const GlobalDndProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listsRef = useRef<Map<string, RegisteredList>>(new Map());
  const idToTab = useRef<Map<string, string>>(new Map());

  const [overlay, setOverlay] = useState<React.ReactNode | null>(null);
  const [effect, setEffect] = useState<DropEffect>('move');
  const [preview, setPreview] = useState<null | { top: number; left: number; width: number; effect: DropEffect; count: number; targetTab?: string; targetIndex: number; height: number }>(null);
  const dragSourceTab = useRef<string | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const dragCountRef = useRef<number>(1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const rebuildIdMap = useCallback(() => {
    idToTab.current.clear();
    for (const [tabId, rl] of listsRef.current.entries()) {
      for (const b of rl.items) idToTab.current.set(b.id, tabId);
    }
  }, []);

  const registerList = useCallback((list: RegisteredList) => {
    listsRef.current.set(list.tabId, list);
    rebuildIdMap();
  }, [rebuildIdMap]);

  const updateList = useCallback((list: RegisteredList) => {
    listsRef.current.set(list.tabId, list);
    rebuildIdMap();
  }, [rebuildIdMap]);

  const unregisterList = useCallback((tabId: string) => {
    listsRef.current.delete(tabId);
    rebuildIdMap();
  }, [rebuildIdMap]);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div>{count > 1 ? `${count} bookmarks` : '1 bookmark'}</div>
        {count > 1 && (
          <div style={{
            background: '#222',
            color: '#fff',
            borderRadius: 10,
            width: 28,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 12
          }}>{count}</div>
        )}
      </div>
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
        if (prev !== 'copy') setOverlay(renderOverlay(dragCountRef.current, 'copy'));
        return 'copy';
      });
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (!isDraggingRef.current) return;
    if (!e.altKey) {
      setEffect(prev => {
        if (prev !== 'move') setOverlay(renderOverlay(dragCountRef.current, 'move'));
        return 'move';
      });
    }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    const sourceTab = idToTab.current.get(id);
    const sourceList = sourceTab ? listsRef.current.get(sourceTab) : undefined;
    const ids = sourceList?.selectedIds?.includes(id) ? sourceList.selectedIds : [id];
  const nativeEvent = (event as any).event as (MouseEvent | KeyboardEvent | undefined);
  const initialEffect: DropEffect = nativeEvent?.altKey ? 'copy' : 'move';
    setEffect(initialEffect);
    isDraggingRef.current = true;
    dragCountRef.current = ids.length;
    setOverlay(renderOverlay(dragCountRef.current, initialEffect));
    setPreview(null);

    // prefer explicit tab id where possible
    dragSourceTab.current = sourceTab;
    console.debug('[GlobalDnd] dragStart', { id, ids, sourceTab, initialEffect });

    try {
      if (dragSourceTab.current) {
        const payloadItems = sourceList?.items.filter(b => ids.includes(b.id)).map(b => ({ ...b })) || [];
        console.debug('[GlobalDnd] caching drag payload', { sourceTab: dragSourceTab.current, count: payloadItems.length });
        if (payloadItems.length > 0) crossTabBookmarkService.cacheDragData(dragSourceTab.current, ids, payloadItems);
      }
    } catch (err) {
      console.warn('[GlobalDnd] cache payload failed', err);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }, []);

  // helper to compute a pointer Y value from possible native events
  const computeClientY = (ne: MouseEvent | TouchEvent | KeyboardEvent | undefined, rect: { top: number; height: number }) => {
    if (!ne) return rect.top + rect.height / 2;
    const isTouch = (x: any): x is TouchEvent => !!x && typeof (x as TouchEvent).touches !== 'undefined';
    if (isTouch(ne)) return ne.touches?.[0]?.clientY ?? (rect.top + rect.height / 2);
    return (ne as MouseEvent).clientY ?? (rect.top + rect.height / 2);
  };

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const nativeEvent = (event as any).event as (MouseEvent | KeyboardEvent | undefined);

    // update overlay effect if native event indicates modifier change
    if (nativeEvent) {
      const maybeEffect: DropEffect = nativeEvent.altKey ? 'copy' : 'move';
      if (maybeEffect !== effect) {
        setEffect(maybeEffect);
        setOverlay(renderOverlay(dragCountRef.current, maybeEffect));
      }
    }

    // Helper: compute preview marker geometry and target index from the over id
    const getOverInfo = (overId: string | undefined, ne?: MouseEvent | TouchEvent | KeyboardEvent | undefined) => {
      if (!overId) return null;
      const rect = getRowRect(String(overId));
      if (!rect) return null;

      const clientY = computeClientY(ne, rect);
      const mid = rect.top + rect.height / 2;
      const insertBefore = clientY < mid;
      const placeholderTop = insertBefore ? rect.top : rect.bottom - rect.height;
      const placeholderHeight = Math.max(24, Math.round(rect.height));
      const left = rect.left;
      const width = rect.width;
      let eff: DropEffect = effect;
      if (ne) {
        eff = ne.altKey ? 'copy' : 'move';
      }

      const targetTab = idToTab.current.get(String(overId));
      const targetList = targetTab ? listsRef.current.get(targetTab) : undefined;
      const baseIndex = targetList ? targetList.items.findIndex(b => b.id === String(overId)) : -1;
      let targetIndex: number;
      if (baseIndex === -1) targetIndex = targetList ? targetList.items.length : 0;
      else targetIndex = insertBefore ? baseIndex : baseIndex + 1;

      return { placeholderTop, placeholderHeight, left, width, eff, targetTab, targetIndex } as const;
    };

    const overInfo = getOverInfo(event.over?.id as string | undefined, nativeEvent);
    if (overInfo) {
      setPreview({ top: overInfo.placeholderTop, left: overInfo.left, width: overInfo.width, effect: overInfo.eff, count: dragCountRef.current, targetTab: overInfo.targetTab, targetIndex: overInfo.targetIndex, height: overInfo.placeholderHeight });
      setOverlay(renderOverlay(dragCountRef.current, overInfo.eff));
    } else {
      setPreview(null);
    }
  }, [effect]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setOverlay(null);
    setPreview(null);
    isDraggingRef.current = false;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);

    if (!over) return;
    const sourceId = String(active.id);
    const targetId = String(over.id);

  const sourceTab = idToTab.current.get(sourceId);
  const sourceList = sourceTab ? listsRef.current.get(sourceTab) : undefined;
  const sourceIds = sourceList?.selectedIds?.includes(sourceId) ? sourceList.selectedIds : [sourceId];

  const targetTab = idToTab.current.get(targetId);
  const targetList = targetTab ? listsRef.current.get(targetTab) : undefined;
    const targetIndex = targetList ? Math.max(0, targetList.items.findIndex(b => b.id === targetId)) : 0;

    const dropEffect: DropEffect = effect;
    console.debug('[GlobalDnd] dragEnd', { active: sourceId, over: targetId, sourceIds, sourceTab, targetTab, targetIndex, dropEffect });

    try {
      if (targetList?.onPerformDrop) {
        await targetList.onPerformDrop({ sourceIds, sourceTabId: sourceTab, targetIndex, effect: dropEffect });
      }
      console.debug('[GlobalDnd] onPerformDrop completed', { sourceIds, targetTab, targetIndex, dropEffect });
    } catch (err) {
      console.warn('[GlobalDnd] onPerformDrop error', err);
    }
  }, [effect]);

  const allIds = useMemo(() => {
    const out: string[] = [];
    for (const rl of listsRef.current.values()) {
      for (const b of rl.items) out.push(b.id);
    }
    return out;
  }, [listsRef.current]);

  const ctxValue = useMemo(() => ({ registerList, updateList, unregisterList }), [registerList, updateList, unregisterList]);

  return (
    <GlobalDndContext.Provider value={ctxValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        <DragOverlay dropAnimation={null}>{overlay}</DragOverlay>
        {preview && preview.effect !== 'none' && (
    <DndKitPreviewMarker top={preview.top} left={preview.left} width={preview.width} effect={preview.effect} count={preview.count} height={preview.height} />
        )}
      </DndContext>
    </GlobalDndContext.Provider>
  );
};
