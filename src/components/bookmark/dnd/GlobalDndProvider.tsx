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

/**
 * Global DnD Provider for bookmark drag and drop operations across FlexLayout tabs.
 *
 * SOLUTION: This provider is now scoped to individual bookmark/browser favorites tabs
 * rather than wrapping the entire app. This prevents conflicts with FlexLayout's
 * native tab reordering system by ensuring dnd-kit only manages bookmark content
 * and doesn't interfere with FlexLayout's HTML5 drag-and-drop for tab reordering.
 */

type DropEffect = 'move' | 'copy' | 'none';

type OnPerformDrop = (opts: { sourceIds: string[]; sourceTabId?: string; targetIndex: number; effect: DropEffect }) => Promise<void>;

type RegisteredList = {
  tabId: string;
  // items are the bookmark records visible in the list (leaf bookmarks)
  items: Bookmark[];
  // selectedIds are the bookmark ids currently selected (leaf ids)
  selectedIds: string[];
  onPerformDrop: OnPerformDrop;
  // optional: nodeIds includes all draggable node ids in the list (may include folder ids)
  nodeIds?: string[];
  // optional: given node ids (possibly folder ids), return the bookmark payloads (leaf bookmarks)
  getPayloadForIds?: (ids: string[]) => Bookmark[];
  // optional: given node ids return additional metadata (e.g. folder title) to be cached with the drag payload
  getMetadataForIds?: (ids: string[]) => any;
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
  const [listsVersion, setListsVersion] = useState(0);

  const [overlay, setOverlay] = useState<React.ReactNode | null>(null);
  const [effect, setEffect] = useState<DropEffect>('move');
  const [preview, setPreview] = useState<null | { top: number; left: number; width: number; effect: DropEffect; count: number; targetTab?: string; targetIndex: number; height: number }>(null);
  const dragSourceTab = useRef<string | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const dragCountRef = useRef<number>(1);

  const sensors = useSensors(
    // Add a small press delay and tolerance so quick native HTML5 drags (e.g. FlexLayout tab reordering)
    // are not captured by dnd-kit. This makes dnd-kit less aggressive and reduces conflicts.
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const rebuildIdMap = useCallback(() => {
    idToTab.current.clear();
    for (const [tabId, rl] of listsRef.current.entries()) {
      if (rl.nodeIds && rl.nodeIds.length > 0) {
        for (const id of rl.nodeIds) idToTab.current.set(id, tabId);
      } else {
        for (const b of rl.items) idToTab.current.set(b.id, tabId);
      }
    }
  }, []);

  const registerList = useCallback((list: RegisteredList) => {
    if (listsRef.current.has(list.tabId)) {
      console.log('[GlobalDndProvider] registerList ignored (already registered)', { tabId: list.tabId });
      return;
    }
    listsRef.current.set(list.tabId, list);
    console.log('[GlobalDndProvider] registerList', { tabId: list.tabId });
    rebuildIdMap();
    setListsVersion(v => v + 1);
  }, [rebuildIdMap]);

  const updateList = useCallback((list: RegisteredList) => {
    listsRef.current.set(list.tabId, list);
    console.log('[GlobalDndProvider] updateList', { tabId: list.tabId });
    rebuildIdMap();
    setListsVersion(v => v + 1);
  }, [rebuildIdMap]);

  const unregisterList = useCallback((tabId: string) => {
    listsRef.current.delete(tabId);
    console.log('[GlobalDndProvider] unregisterList', { tabId });
    rebuildIdMap();
    setListsVersion(v => v + 1);
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
        const payloadItems = sourceList?.getPayloadForIds ? sourceList.getPayloadForIds(ids).map(b => ({ ...b })) : sourceList?.items.filter(b => ids.includes(b.id)).map(b => ({ ...b })) || [];
        const meta = sourceList?.getMetadataForIds ? sourceList.getMetadataForIds(ids) : undefined;
        console.debug('[GlobalDnd] caching drag payload', { sourceTab: dragSourceTab.current, count: payloadItems.length, meta });
        if (payloadItems.length > 0) crossTabBookmarkService.cacheDragData(dragSourceTab.current, ids, payloadItems, meta);
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

  // Tabset overlay rendering removed; tabset-specific droppable areas are disabled.

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

    const overId = event.over?.id as string | undefined;

    const overInfo = getOverInfo(overId, nativeEvent);
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
      if (rl.nodeIds && rl.nodeIds.length > 0) {
        for (const id of rl.nodeIds) out.push(id);
      } else {
        for (const b of rl.items) out.push(b.id);
      }
    }
    return out;
  }, [listsVersion]);

  const ctxValue = useMemo(() => ({ registerList, updateList, unregisterList }), [registerList, updateList, unregisterList]);
  // Debugging: expose a mount/unmount log so testers can see whether dnd-kit
  // provider is mounted for the current tab content. This helps determine if
  // dnd-kit is still present when FlexLayout native tab drag is blocked.
  React.useEffect(() => {
    console.log('[GlobalDndProvider] mounted');
    return () => { console.log('[GlobalDndProvider] unmounted'); };
  }, []);

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
  <DragOverlay dropAnimation={null}><div style={{ pointerEvents: 'none' }}>{overlay}</div></DragOverlay>
        {preview && preview.effect !== 'none' && (
    <DndKitPreviewMarker top={preview.top} left={preview.left} width={preview.width} effect={preview.effect} count={preview.count} height={preview.height} />
        )}
      </DndContext>
    </GlobalDndContext.Provider>
  );
};
