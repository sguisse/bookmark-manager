import React, { useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useGlobalDnd } from '../bookmark/dnd/GlobalDndProvider';
import { registerRow } from '../bookmark/dnd/rowRegistry';

// A small invisible overlay rendered inside each tabset header that acts as a
// droppable target. When a drop occurs, it dispatches a global event that the
// FlexLayoutManager listens to and uses to create a new Bookmarks tab.
const TabsetDropTarget: React.FC<{ tabsetId: string }> = ({ tabsetId }) => {
  const dropId = `flex-tabset-${tabsetId}`;
  const { setNodeRef } = useDroppable({ id: dropId });
  const g = useGlobalDnd();

  useEffect(() => {
    if (!g) return;
    const reg = {
      tabId: dropId,
      items: [],
      selectedIds: [],
      nodeIds: [dropId],
      onPerformDrop: async ({ sourceIds, sourceTabId, effect }: any) => {
        try {
          // include the tabsetId so the layout manager can insert the new tab into
          // the specific tabset that received the drop
          window.dispatchEvent(new CustomEvent('app:flexlayout:create-bookmarks-tab', { detail: { sourceTabId, sourceIds, effect, tabsetId } }));
        } catch (err) {
          console.warn('[TabsetDropTarget] dispatch failed', err);
        }
      }
    } as any;

    try { g.registerList(reg); } catch (err) { console.warn('[TabsetDropTarget] register failed', err); }
    return () => {
      try { g.unregisterList(dropId); } catch (err) { console.warn('[TabsetDropTarget] unregister failed', err); }
      try { registerRow(dropId, null); } catch (err) { console.warn('[TabsetDropTarget] registerRow cleanup failed', err); }
    };
  }, [g, dropId]);

  // The element must be present in the DOM somewhere inside the tabset header.
  // We render an invisible absolute element that covers the header area and
  // register it in the row registry so preview geometry can be computed.
  const combinedRef = (el: HTMLElement | null) => {
    try { (setNodeRef as any)(el); } catch (err) { console.warn('[TabsetDropTarget] setNodeRef failed', err); }
    try { registerRow(dropId, el); } catch (err) { console.warn('[TabsetDropTarget] registerRow failed', err); }
  };

  // The overlay must not block the native tab header interactions (dragging/reorder)
  // so keep pointerEvents disabled; dnd-kit collision detection uses the node's
  // geometry (registered via rowRegistry) and does not require pointer events on
  // the target element itself.
  return (
    <div ref={combinedRef as any} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden />
  );
};

export default TabsetDropTarget;
