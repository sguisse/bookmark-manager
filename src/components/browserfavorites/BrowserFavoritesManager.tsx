import React, { useState, useEffect, useRef } from 'react';
import { BrowserBookmarkNode, BrowserFavorites, BrowserFavoritesFormData } from '../../types/browser';
import { FormDisplayMode } from '../../types/app';
import BrowserFavoritesForm from './BrowserFavoritesForm';
import BrowserFavoritesDropHandler from './BrowserFavoritesDropHandler';

import '../../styles/index.css';
import { BrowserFavoritesService } from '../../services/BrowserFavoritesService';
import { DragHandle } from '../common/treeview/BookmarkTree';
import { useOptionalGlobalDnd } from '../bookmark/dnd/GlobalDndProvider';
import { useSortable } from '@dnd-kit/sortable';
import type { Bookmark } from '../../types/bookmark';

type Props = {};

function formatAddDate(d?: Date | null) {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const isImageSrc = (val?: string) => {
  if (!val) return false;
  if (/^data:image\//i.test(val)) return true;
  if (/https?:\/\//i.test(val)) return /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/i.test(val);
  return /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/i.test(val);
};

const Icon: React.FC<{ icon?: string | null; isFolder?: boolean }> = ({ icon, isFolder }) => {
  if (icon && isImageSrc(icon)) {
    return <img src={icon} alt="" className="bf-node-favicon" />;
  }
  return <span className="bf-node-emoji" aria-hidden>{isFolder ? '📁' : '🔖'}</span>;
};

// helper to count total links recursively inside a node (bookmarks only)
const countLinks = (node: BrowserBookmarkNode | undefined | null): number => {
  if (!node) return 0;
  if (!node.isFolder) return 1;
  let total = 0;
  if (node.children) {
    for (const c of node.children) {
      total += countLinks(c);
    }
  }
  return total;
};

// helper to collect all urls recursively from a folder node
const collectUrls = (node: BrowserBookmarkNode | undefined | null): string[] => {
  if (!node) return [];
  if (!node.isFolder) return node.url ? [node.url] : [];
  const out: string[] = [];
  if (node.children) {
    for (const c of node.children) {
      out.push(...collectUrls(c));
    }
  }
  return out;
};

// Top-level helper to insert a group of records back into a tree under a given parentId
const insertGroupHelper = (nodes: BrowserBookmarkNode[], parentId: string | null, group: { node: BrowserBookmarkNode; parentId: string | null; index: number }[]): BrowserBookmarkNode[] => {
  if (parentId === null) {
    const newRoot = [...nodes];
    group.sort((a, b) => a.index - b.index);
    for (const rec of group) {
      const idx = Math.min(rec.index, newRoot.length);
      newRoot.splice(idx, 0, rec.node);
    }
    return newRoot;
  }

  const walkAndInsert = (arr: BrowserBookmarkNode[]): BrowserBookmarkNode[] => {
    return arr.map(n => {
      if (n.id === parentId) {
        const children = n.children ? [...n.children] : [];
        const groupForParent = group.slice().sort((a, b) => a.index - b.index);
        for (const rec of groupForParent) {
          const idx = Math.min(rec.index, children.length);
          children.splice(idx, 0, rec.node);
        }
        return { ...n, children };
      }
      if (n.children) {
        return { ...n, children: walkAndInsert(n.children) };
      }
      return n;
    });
  };

  return walkAndInsert(nodes);
};

const LeafNode: React.FC<{ node: BrowserBookmarkNode; selected?: boolean; onSelect?: (id: string, e: React.MouseEvent) => void }> = ({ node, selected, onSelect }) => {
  const { attributes, listeners, setNodeRef } = useSortable({ id: node.id });

  // tooltip state
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimerRef = React.useRef<number | null>(null);

  const showTooltip = (e: any) => {
    if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current);
    if (e && 'clientX' in e && 'clientY' in e) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    } else {
      const el = e.currentTarget as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setTooltipPos({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
      } else setTooltipPos(null);
    }
    tooltipTimerRef.current = window.setTimeout(() => setTooltipVisible(true), 1000);
  };
  const moveTooltip = (e: React.MouseEvent) => setTooltipPos({ x: e.clientX, y: e.clientY });
  const hideTooltip = () => { if (tooltipTimerRef.current) { window.clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null; } setTooltipVisible(false); };

  return (
    <div className="bf-node bf-bookmark relative" role="treeitem" aria-selected={selected} ref={setNodeRef as any}>
      <div
        className={"bf-node-label" + (selected ? ' bf-node-selected' : '')}
        style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', padding: '4px 6px' }}
        onPointerDown={(e: React.PointerEvent) => { if (onSelect) onSelect(node.id, e as unknown as React.MouseEvent); }}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (onSelect) onSelect(node.id, e as unknown as React.MouseEvent); } }}
        onMouseEnter={showTooltip}
        onFocus={showTooltip}
        onMouseMove={moveTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <DragHandle {...listeners} {...(attributes as any)}>
            <Icon icon={node.icon || null} />
          </DragHandle>
          <span className="bf-node-text">{node.title}</span>
        </div>
        <div
          className="bf-node-tooltip"
          role="tooltip"
          aria-hidden={!tooltipVisible}
          style={(() => {
            const base: React.CSSProperties = {};
            if (tooltipPos) {
              base.position = 'fixed'; base.left = `${tooltipPos.x + 12}px`; base.top = `${tooltipPos.y + 12}px`;
            }
            base.visibility = !tooltipVisible ? 'hidden' : 'visible'; base.opacity = tooltipVisible ? 1 : 0; base.pointerEvents = tooltipVisible ? 'auto' : 'none';
            return base;
          })()}
        >
          {node.url}
        </div>
      </div>
    </div>
  );
};

const FolderNode: React.FC<{ node: BrowserBookmarkNode; open: boolean; onToggle: (id: string) => void; expanded: Record<string, boolean>; selected?: boolean; onSelect?: (id: string, e: React.MouseEvent) => void; selectedIds?: string[] }> = ({ node, open, onToggle, expanded, selected, onSelect, selectedIds }) => {
  const tooltipLines: string[] = [];
  const dateStr = formatAddDate(node.createdDate);
  if (dateStr) tooltipLines.push(dateStr);
  if (node.url) tooltipLines.push(node.url || '');

  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimerRef = React.useRef<number | null>(null);

  const showTooltip = (e: React.MouseEvent | React.FocusEvent) => {
    if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current);
    if ('clientX' in e && 'clientY' in e) setTooltipPos({ x: e.clientX, y: e.clientY });
    else {
      const el = e.currentTarget as HTMLElement | null;
      if (el) { const r = el.getBoundingClientRect(); setTooltipPos({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }); } else setTooltipPos(null);
    }
    tooltipTimerRef.current = window.setTimeout(() => setTooltipVisible(true), 1000);
  };
  const moveTooltip = (e: React.MouseEvent) => setTooltipPos({ x: e.clientX, y: e.clientY });
  const hideTooltip = () => { if (tooltipTimerRef.current) { window.clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null; } setTooltipVisible(false); };

  const totalLinks = countLinks(node);
  if (totalLinks >= 0) tooltipLines.push(`${totalLinks} links`);

  return (
    <div className="bf-node bf-folder relative" role="treeitem" aria-expanded={open} aria-selected={selected}>
      <div
        className={"bf-node-label bf-folder-toggle" + (selected ? ' bf-node-selected' : '')}
        style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', padding: '4px 6px' }}
        onPointerDown={(e: React.PointerEvent) => {
          const meta = (e as React.PointerEvent).metaKey || (e as React.PointerEvent).ctrlKey || (e as React.PointerEvent).altKey || (e as React.PointerEvent).shiftKey;
          if (meta) {
            if (onSelect) onSelect(node.id, e as unknown as React.MouseEvent);
          } else {
            onToggle(node.id);
          }
        }}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(node.id); } }}
        onMouseEnter={showTooltip}
        onFocus={showTooltip}
        onMouseMove={moveTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <DragHandle>
            <Icon icon={node.icon || null} isFolder />
          </DragHandle>
          <span className="bf-node-text">{node.title}</span>
        </div>
      </div>
      <div className="bf-node-tooltip" role="tooltip" aria-hidden={tooltipLines.length === 0 || !tooltipVisible} style={(() => {
        const base: React.CSSProperties = {};
        if (tooltipPos) { base.position = 'fixed'; base.left = `${tooltipPos.x + 12}px`; base.top = `${tooltipPos.y + 12}px`; }
        base.visibility = tooltipLines.length === 0 || !tooltipVisible ? 'hidden' : 'visible'; base.opacity = tooltipVisible ? 1 : 0; base.pointerEvents = tooltipVisible ? 'auto' : 'none';
        return base;
      })()}>
        {tooltipLines.map((l) => (<div key={l} className="bf-tooltip-line">{l}</div>))}
      </div>
      {open && node.children && (
        <div className="bf-children">
          {node.children.map((c) => (
            c.isFolder ? <FolderNode key={c.id} node={c} open={!!expanded[c.id]} onToggle={onToggle} expanded={expanded} selected={!!(selectedIds?.includes(c.id))} onSelect={onSelect} /> : <LeafNode key={c.id} node={c} selected={!!(selectedIds?.includes(c.id))} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeNode: React.FC<{ node: BrowserBookmarkNode; open: boolean; onToggle: (id: string) => void; expanded: Record<string, boolean>; selected?: boolean; onSelect?: (id: string, e: React.MouseEvent) => void; selectedIds?: string[] }> = ({ node, open, onToggle, expanded, selected, onSelect, selectedIds }) => {
  if (node.isFolder) return <FolderNode node={node} open={open} onToggle={onToggle} expanded={expanded} selected={selected} onSelect={onSelect} selectedIds={selectedIds} />;
  return <LeafNode node={node} selected={selected} onSelect={onSelect} />;
};

export const BrowserFavoritesManager: React.FC<Props> = () => {
  const [tree, setTree] = useState<BrowserBookmarkNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [currentFavorites, setCurrentFavorites] = useState<BrowserFavorites | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const lastRemovedIdsRef = React.useRef<string[] | null>(null);
  const lastRemovedRecordsRef = React.useRef<null | { node: BrowserBookmarkNode; parentId: string | null; index: number }[]>(null);
  const localTabIdRef = useRef<string>(`bf-${Math.random().toString(36).slice(2)}`);
  const formMode = FormDisplayMode.Edit; // Always in edit mode since form is always visible
  const globalDnd = useOptionalGlobalDnd();

  // Global debug hooks: listen for native dragstart and pointer events to diagnose when
  // drags from TreeNode fail to fire. These are temporary diagnostics and can be removed
  // once the issue is resolved.
  React.useEffect(() => {
    const onDragStartGlobal = (e: DragEvent) => {
      try {
        const tgt = e.target as HTMLElement | null;
        const info: any = { type: e.type, targetTag: tgt?.tagName, targetClass: tgt?.className, targetId: tgt?.id };
        try {
          if (e.dataTransfer) info.types = Array.from(e.dataTransfer.types || []);
        } catch (err) {
          console.debug('GLOBAL dragstart handler inner error', err);
        }
        console.debug('GLOBAL dragstart', info);
      } catch (err) {
        console.debug('GLOBAL dragstart handler error', err);
      }
    };

    const onMouseDownGlobal = (e: MouseEvent) => {
      try {
        const tgt = e.target as HTMLElement | null;
        console.debug('GLOBAL mousedown', { tag: tgt?.tagName, id: tgt?.id, className: tgt?.className });
      } catch (err) {
        console.debug('GLOBAL mousedown handler inner error', err);
      }
    };

    window.addEventListener('dragstart', onDragStartGlobal);
    window.addEventListener('mousedown', onMouseDownGlobal);
    return () => {
      window.removeEventListener('dragstart', onDragStartGlobal);
      window.removeEventListener('mousedown', onMouseDownGlobal);
    };
  }, []);

  // Build a mapping of nodeId => true for nodes which have isExpanded set
  const buildExpandedMapFromTree = (nodes: BrowserBookmarkNode[]): Record<string, boolean> => {
    const map: Record<string, boolean> = {};
    const walk = (arr: BrowserBookmarkNode[]) => {
      for (const n of arr) {
        if (n.isExpanded) map[n.id] = true;
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    return map;
  };

  // On mount, try to load saved BrowserFavorites from storage to initialize form and tree
  React.useEffect(() => {
    try {
      const stored = BrowserFavoritesService.loadFromStorage();
      if (stored) {
        setCurrentFavorites(stored);
        setTree(stored.bookmarksTree || []);
        // rebuild expanded mapping from stored bookmarksTree isExpanded flags
        setExpanded(buildExpandedMapFromTree(stored.bookmarksTree || []));
      }
    } catch (err) {
      // ignore
      // eslint-disable-next-line no-console
      console.warn('Failed to load stored BrowserFavorites', err);
    }
  }, []);

  // expose current tab id for crossTab service compatibility
  useEffect(() => {
    try { (window as any).__CURRENT_TAB_ID__ = localTabIdRef.current; } catch (err) { /* ignore */ }
  }, []);

  // Register this BrowserFavorites as a drag source list with the GlobalDndProvider
  useEffect(() => {
    if (!globalDnd) return;
    const flatten = (nodes: BrowserBookmarkNode[], expandedMap: Record<string, boolean>, out: Bookmark[]) => {
      for (const n of nodes) {
        if (!n.isFolder) {
          out.push({ id: n.id, title: n.title || n.url || 'Bookmark', url: n.url || '', icon: n.icon || '', createdDate: n.createdDate || new Date(), lastModifiedDate: n.lastModifiedDate || new Date(), description: n.description || '' } as Bookmark);
        } else if (expandedMap[n.id] && n.children) {
          flatten(n.children, expandedMap, out);
        }
      }
    };

    const visible: Bookmark[] = [];
    flatten(tree, expanded, visible);

    const list: any = { tabId: localTabIdRef.current, items: visible, selectedIds, onPerformDrop: async (_opts: any) => { /* BF is primarily a source: no-op */ } };

    try { globalDnd.registerList(list); } catch (err) { console.warn('[BrowserFavoritesManager] registerList failed', err); }
    return () => { try { globalDnd.unregisterList(localTabIdRef.current); } catch (err) { console.warn('[BrowserFavoritesManager] unregisterList failed', err); } };
  }, [globalDnd, tree, expanded, selectedIds]);

  // Listen for external requests to remove nodes (e.g. when bookmarks are moved to another tab)
  React.useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail || {};
        // support several shapes: { ids: string[] } or { nodeIds: string[] } or array directly
        let ids: string[] = [];
        if (Array.isArray(detail)) ids = detail as string[];
        else if (Array.isArray(detail.ids)) ids = detail.ids;
        else if (Array.isArray(detail.nodeIds)) ids = detail.nodeIds;

        if (!ids || ids.length === 0) return;

  // Remove nodes and get report
  const { tree: next, removedIds, removedRecords } = removeNodesByIdsWithReport(tree, ids);

        // update state and persist
        setTree(next);
        setExpanded(buildExpandedMapFromTree(next));
        if (currentFavorites) {
          try {
            const updated: BrowserFavorites = { ...currentFavorites, bookmarksTree: next, lastModifiedDate: new Date() };
            setCurrentFavorites(updated);
            BrowserFavoritesService.saveToStorage(updated);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to persist BrowserFavorites after external removal', err);
          }
        }

        // Clear any selected ids that were removed
        setSelectedIds(filterOutIds(selectedIds, ids));

        // store removed records and broadcast for telemetry/undo
        if (removedIds && removedIds.length > 0) {
          lastRemovedIdsRef.current = removedIds;
          lastRemovedRecordsRef.current = removedRecords;
          try {
            window.dispatchEvent(new CustomEvent('browserfavorites:removed-nodes', { detail: { ids: removedIds } }));
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to dispatch browserfavorites:removed-nodes event', err);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Error handling browserfavorites:remove-nodes event', err);
      }
    };

    window.addEventListener('browserfavorites:remove-nodes', handler as EventListener);
    return () => window.removeEventListener('browserfavorites:remove-nodes', handler as EventListener);
  }, [currentFavorites]);

  // Restore previously removed nodes (undo). Listens to 'browserfavorites:restore-removed-nodes'.
  React.useEffect(() => {
    const restoreHandler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail || {};
        // optional: detail.ids to restore only a subset; otherwise restore all last removed records
        let idsToRestore: string[] | null = null;
        if (Array.isArray(detail.ids)) idsToRestore = detail.ids as string[];

        const records = lastRemovedRecordsRef.current || [];
        if (!records || records.length === 0) return;

  const recordsToRestore = idsToRestore ? records.filter(r => idsToRestore.includes(r.node.id)) : records;
        if (recordsToRestore.length === 0) return;

        // Group records by parentId for stable insertion
        const grouped = recordsToRestore.reduce<Record<string, typeof recordsToRestore>>((acc, r) => {
          const key = r.parentId ?? '__ROOT__';
          if (!acc[key]) acc[key] = [] as any;
          acc[key].push(r);
          return acc;
        }, {} as Record<string, typeof recordsToRestore>);

        // use top-level insertGroup helper to re-insert records

        // Start with current tree
        let nextTree = tree;

        // First handle root inserts (key '__ROOT__')
        const rootKey = '__ROOT__';
        if (grouped[rootKey]) {
          nextTree = insertGroupHelper(nextTree, null, grouped[rootKey]);
        }

        // Then handle other parent groups
        for (const key of Object.keys(grouped)) {
          if (key === rootKey) continue;
          const parentId = key === '__ROOT__' ? null : key;
          nextTree = insertGroupHelper(nextTree, parentId, grouped[key]);
        }

        // Persist and update state
        setTree(nextTree);
        setExpanded(buildExpandedMapFromTree(nextTree));
        if (currentFavorites) {
          try {
            const updated: BrowserFavorites = { ...currentFavorites, bookmarksTree: nextTree, lastModifiedDate: new Date() };
            setCurrentFavorites(updated);
            BrowserFavoritesService.saveToStorage(updated);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to persist BrowserFavorites after restore', err);
          }
        }

        const restoredIds = recordsToRestore.map(r => r.node.id);
        try {
          window.dispatchEvent(new CustomEvent('browserfavorites:restored-nodes', { detail: { ids: restoredIds } }));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to dispatch browserfavorites:restored-nodes event', err);
        }

        // Optionally clear lastRemovedRecordsRef so undo cannot be repeated unless new removals occur
        lastRemovedRecordsRef.current = null;
        lastRemovedIdsRef.current = null;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Error handling browserfavorites:restore-removed-nodes event', err);
      }
    };

    window.addEventListener('browserfavorites:restore-removed-nodes', restoreHandler as EventListener);
    return () => window.removeEventListener('browserfavorites:restore-removed-nodes', restoreHandler as EventListener);
  }, [currentFavorites, tree]);

  // (removed buildNodePath — we now use node.isExpanded flags directly)

  // Toggle a node's isExpanded flag in the tree, update expanded map and persist
  const toggleNodeExpanded = (nodeId: string) => {
    const updateNodes = (nodes: BrowserBookmarkNode[]): BrowserBookmarkNode[] => {
      return nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, isExpanded: !n.isExpanded };
        }
        if (n.children) {
          return { ...n, children: updateNodes(n.children) };
        }
        return n;
      });
    };

    setTree(prev => {
      const next = updateNodes(prev);
      // rebuild expanded mapping from tree isExpanded flags
      setExpanded(buildExpandedMapFromTree(next));

      // persist updated tree (with isExpanded) if we have currentFavorites
      if (currentFavorites) {
        try {
          const updatedFav: BrowserFavorites = {
            ...currentFavorites,
            bookmarksTree: next,
            lastModifiedDate: new Date()
          };
          setCurrentFavorites(updatedFav);
          BrowserFavoritesService.saveToStorage(updatedFav);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to persist expanded state', err);
        }
      }

      return next;
    });
  };

  // Flatten visible nodes into an ordered list (pre-order) but only include leaf bookmark nodes
  const flattenVisibleLeafNodes = (nodes: BrowserBookmarkNode[], expandedMap: Record<string, boolean>): BrowserBookmarkNode[] => {
    const out: BrowserBookmarkNode[] = [];
    const walk = (arr: BrowserBookmarkNode[]) => {
      for (const n of arr) {
        if (!n.isFolder) {
          out.push(n);
        } else if (expandedMap[n.id] && n.children) {
          // if folder is expanded, visit children
          walk(n.children);
        }
      }
    };
    walk(nodes);
    return out;
  };

  // Find a node by id in the tree
  const findNodeById = (nodes: BrowserBookmarkNode[], id: string): BrowserBookmarkNode | undefined => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNodeById(n.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Collect visible leaf ids starting from a node (respect expanded map)
  const collectVisibleLeafIdsFromNode = (node: BrowserBookmarkNode, expandedMap: Record<string, boolean>): string[] => {
    const out: string[] = [];
    const walk = (n: BrowserBookmarkNode) => {
      if (!n) return;
      if (!n.isFolder) {
        out.push(n.id);
        return;
      }
      if (expandedMap[n.id] && n.children) {
        for (const c of n.children) walk(c);
      }
    };
    walk(node);
    return out;
  };

  // Remove nodes matching any id in `ids` from a tree (recursively).
  // Returns { tree, removedIds, removedRecords } where removedRecords include original parentId and index
  const removeNodesByIdsWithReport = (nodes: BrowserBookmarkNode[], ids: string[]): { tree: BrowserBookmarkNode[]; removedIds: string[]; removedRecords: { node: BrowserBookmarkNode; parentId: string | null; index: number }[] } => {
    const removedIds: string[] = [];
    const removedRecords: { node: BrowserBookmarkNode; parentId: string | null; index: number }[] = [];

    const walk = (arr: BrowserBookmarkNode[], parentId: string | null): BrowserBookmarkNode[] => {
      const out: BrowserBookmarkNode[] = [];
      for (let i = 0; i < arr.length; i++) {
        const n = arr[i];
        if (ids.includes(n.id)) {
          removedIds.push(n.id);
          removedRecords.push({ node: n, parentId, index: i });
          continue; // drop
        }
        if (n.children && n.children.length > 0) {
          const newChildren = walk(n.children, n.id);
          if (newChildren.length !== n.children.length) {
            out.push({ ...n, children: newChildren });
          } else {
            out.push(n);
          }
        } else {
          out.push(n);
        }
      }
      return out;
    };

    const newTree = walk(nodes, null);
    return { tree: newTree, removedIds, removedRecords };
  };

  // insertGroup helper moved to top-level insertGroupHelper

  const filterOutIds = (arr: string[], ids: string[]) => arr.filter(a => !ids.includes(a));

  // Selection handling: support Ctrl/Meta/Alt to toggle, Shift to select range
  const handleSelect = (id: string, e: React.MouseEvent) => {
    const meta = e.metaKey || e.ctrlKey || e.altKey;
    const shift = e.shiftKey;

    // Resolve incoming id into one or more leaf ids (folders -> visible leaf descendants)
    const node = findNodeById(tree, id);
    let targetLeafIds: string[] = [];
    if (!node) return;
    if (node.isFolder) {
      targetLeafIds = collectVisibleLeafIdsFromNode(node, expanded);
    } else {
      targetLeafIds = [id];
    }
    if (targetLeafIds.length === 0) return;

    setSelectedIds(prev => {
      // If shift, select range between lastSelectedId and first target id
      if (shift && lastSelectedId != null) {
        const visible = flattenVisibleLeafNodes(tree, expanded);
        const ids = visible.map(v => v.id);
        const a = ids.indexOf(lastSelectedId);
        const b = ids.indexOf(targetLeafIds[0]);
        if (a >= 0 && b >= 0) {
          const [start, end] = a < b ? [a, b] : [b, a];
          const range = ids.slice(start, end + 1);
          setLastSelectedId(targetLeafIds[0]);
          return Array.from(new Set([...prev, ...range]));
        }
      }

      // If meta (ctrl/cmd/alt), toggle each id in the target set
      if (meta) {
        const anyMissing = targetLeafIds.some(t => !prev.includes(t));
        let next: string[];
        if (anyMissing) {
          next = Array.from(new Set([...prev, ...targetLeafIds]));
        } else {
          next = prev.filter(x => !targetLeafIds.includes(x));
        }
        setLastSelectedId(targetLeafIds[0]);
        return next;
      }

      // default single selection (replace)
      setLastSelectedId(targetLeafIds[0]);
        return [targetLeafIds[0]];
    });
  };

  const loadBookmarksFile = (file: File, filePath: string) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      const text = typeof result === 'string' ? result : '';
      try {
        const parsed = BrowserFavoritesService.parseChromeBookmarksHtml(text);
        setTree(parsed);
        // keep folders collapsed by default
        setExpanded({});

        // Update current favorites with the new file
        if (currentFavorites) {
          setCurrentFavorites(prev => prev ? {
            ...prev,
            filePath,
            bookmarksTree: parsed,
            lastModifiedDate: new Date()
          } : null);
          // persist updated favorites
          try {
            const updated = {
              ...currentFavorites,
              filePath,
              bookmarksTree: parsed,
              lastModifiedDate: new Date()
            } as BrowserFavorites;
            BrowserFavoritesService.saveToStorage(updated);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to save BrowserFavorites after loading file', err);
          }
        } else {
          // if no currentFavorites existed, create and persist one
          const newFav: BrowserFavorites = {
            id: `bf-${Date.now()}`,
            filePath,
            bookmarksTree: parsed,
            createdDate: new Date(),
            lastModifiedDate: new Date()
          };
          setCurrentFavorites(newFav);
          try {
            BrowserFavoritesService.saveToStorage(newFav);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to save new BrowserFavorites after loading file', err);
          }
        }
      } catch (err) {
        // ignore parse errors
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleFormSave = (formData: BrowserFavoritesFormData, file?: File) => {
    if (currentFavorites) {
      // Update existing browser favorites
      const updatedFavorites: BrowserFavorites = {
        ...currentFavorites,
        filePath: formData.filePath,
        bookmarksTree: tree,
        lastModifiedDate: new Date()
      };
      setCurrentFavorites(updatedFavorites);

      // persist updated favorites
      try {
        BrowserFavoritesService.saveToStorage(updatedFavorites);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save BrowserFavorites on form save', err);
      }

      // If a new file was provided, load it
      if (file) {
        loadBookmarksFile(file, formData.filePath);
      }
    } else {
      // Create new browser favorites (when none exists yet)
      const newFavorites: BrowserFavorites = {
        id: `bf-${Date.now()}`,
        filePath: formData.filePath,
        bookmarksTree: [],
        createdDate: new Date(),
        lastModifiedDate: new Date()
      };
      setCurrentFavorites(newFavorites);

      // persist new favorites
      try {
        BrowserFavoritesService.saveToStorage(newFavorites);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save new BrowserFavorites on form save', err);
      }

      // If a file was provided, load it
      if (file) {
        loadBookmarksFile(file, formData.filePath);
      }
    }
    // Keep the form open after saving for potential further use
    // setIsFormOpen(false); // Commented out to keep form open
  };

  const handleFormCancel = () => {
    // Don't close the form, just keep it open for further use
    // User can manually collapse it using the toggle button if desired
  };

  return (
    <div className="browser-favorites">

      <BrowserFavoritesDropHandler />

      <BrowserFavoritesForm
        browserFavorites={currentFavorites}
        mode={formMode}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />

      <div className="bf-file-uploaded" style={{ marginTop: '16px' }}>
        {currentFavorites?.filePath && (
          <div className="bf-file-info">
            <strong>Loaded File:</strong> {currentFavorites.filePath}
          </div>
        )}
      </div>

      <div className="bf-tree" role="tree" style={{ marginTop: '16px' }}>
        {tree.length === 0 ? (
          <div className="bf-empty">No bookmarks loaded. Import a Chrome bookmarks HTML file.</div>
        ) : (
          tree.map((n) => (
            <TreeNode key={n.id} node={n} open={!!expanded[n.id]} onToggle={(id) => toggleNodeExpanded(id)} expanded={expanded} selected={!!selectedIds.includes(n.id)} onSelect={handleSelect} selectedIds={selectedIds} />
          ))
        )}
      </div>
    </div>
  );
};

export default BrowserFavoritesManager;
