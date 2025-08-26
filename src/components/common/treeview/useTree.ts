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
  selectedId: string | null;
  toggleNode: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  moveItem: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => TreeNode[];
  setNodes: (nodes: TreeNode[]) => void;
}

export const useTree = ({
  nodes: initialNodes,
  initialOpenNodes = [],
  initialSelectedId = null
}: UseTreeOptions): UseTreeResult => {
  const [nodes, setNodes] = useState<TreeNode[]>(initialNodes);
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set(initialOpenNodes));
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

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

  const selectNode = useCallback((nodeId: string) => {
    setSelectedId(nodeId);
  }, []);

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
    draggedId: string,
    targetId: string | null,
    position: 'before' | 'after' | 'inside'
  ): TreeNode[] => {
    let updatedNodes: TreeNode[] = [];
    setNodes(currentNodes => {
      updatedNodes = moveNode(currentNodes, draggedId, targetId, position);
      return updatedNodes;
    });
    return updatedNodes;
  }, []);

  return {
    nodes,
    openNodes,
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
