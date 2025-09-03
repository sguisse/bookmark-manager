import { useState, useCallback } from 'react';
import { TreeNode } from './types';
import { moveNode } from './utils';

export interface UseTreeOptions {
  nodes: TreeNode[];
  initialOpenNodes?: string[];
  initialSelectedId?: string | null;
}

export interface UseTreeResult {
  nodes: TreeNode[];
  openNodes: Set<string>;
  /** Multi-selection set */
  selectedIds: Set<string>;
  selectedId: string | null;
  toggleNode: (nodeId: string) => void;
  /** Select with modifiers: ctrl/meta to toggle, shift/range handled by caller */
  selectNode: (nodeId: string, event?: React.MouseEvent) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  moveItem: (draggedIds: string[] | string, targetId: string | null, position: 'before' | 'after' | 'inside') => TreeNode[];
  setNodes: (nodes: TreeNode[]) => void;
}

export const useTree = ({
  nodes: initialNodes,
  initialOpenNodes = [],
  initialSelectedId = null
}: UseTreeOptions): UseTreeResult => {
  const [nodes, setNodes] = useState<TreeNode[]>(initialNodes);
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set(initialOpenNodes));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelectedId ? new Set([initialSelectedId]) : new Set());
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(initialSelectedId ? initialNodes.findIndex(n => n.id === initialSelectedId) : null);

  const toggleNode = useCallback((nodeId: string) => {
    setOpenNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const selectNode = useCallback((nodeId: string, e?: React.MouseEvent) => {
    const isCmd = e ? (e.ctrlKey || e.metaKey) : false;
    const isShift = e ? e.shiftKey : false;

    // If shift is pressed and we have a lastSelectedIndex, select range
    if (isShift && lastSelectedIndex !== null) {
      const idx = nodes.findIndex(n => n.id === nodeId);
      if (idx === -1) {
        setSelectedIds(new Set([nodeId]));
        setSelectedId(nodeId);
        setLastSelectedIndex(idx);
        return;
      }

      const start = Math.min(lastSelectedIndex, idx);
      const end = Math.max(lastSelectedIndex, idx);
      const idsInRange = nodes.slice(start, end + 1).map(n => n.id);
      setSelectedIds(new Set(idsInRange));
      setSelectedId(idsInRange.length ? idsInRange[idsInRange.length - 1] : nodeId);
      setLastSelectedIndex(idx);
      return;
    }

    // If ctrl/meta is pressed, toggle selection
    if (isCmd) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
        // keep last selectedId in sync
        setSelectedId(next.size ? Array.from(next).pop()! : null);
        // update lastSelectedIndex
        const idx = nodes.findIndex(n => n.id === nodeId);
        setLastSelectedIndex(idx === -1 ? null : idx);
        return next;
      });
      return;
    }

    // Otherwise select single
    setSelectedIds(new Set([nodeId]));
    setSelectedId(nodeId);
    const idx = nodes.findIndex(n => n.id === nodeId);
    setLastSelectedIndex(idx === -1 ? null : idx);
  }, [nodes, lastSelectedIndex]);

  const expandNode = useCallback((nodeId: string) => {
    setOpenNodes(prev => new Set(prev).add(nodeId));
  }, []);

  const collapseNode = useCallback((nodeId: string) => {
    setOpenNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allNodeIds = nodes
      .filter(node => node.droppable)
      .map(node => node.id);
    setOpenNodes(new Set(allNodeIds));
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setOpenNodes(new Set());
  }, []);

  const moveItem = useCallback((
    draggedIds: string[] | string,
    targetId: string | null,
    position: 'before' | 'after' | 'inside'
  ): TreeNode[] => {
    let updatedNodes: TreeNode[] = [];
    setNodes(currentNodes => {
      updatedNodes = moveNode(currentNodes, draggedIds, targetId, position);
      return updatedNodes;
    });
    return updatedNodes;
  }, []);

  return {
    nodes,
    openNodes,
    selectedIds,
    selectedId,
    toggleNode,
    selectNode,
    expandNode,
    collapseNode,
    expandAll,
    collapseAll,
    moveItem,
    setNodes
  };
};
