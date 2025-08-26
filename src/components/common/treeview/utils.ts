import { TreeNode } from './types';

/**
 * Get children of a specific parent node
 */
export const getChildren = (nodes: TreeNode[], parentId: string | null): TreeNode[] => {
  return nodes.filter(node => node.parent === parentId);
};

/**
 * Get all descendants of a node
 */
export const getDescendants = (nodes: TreeNode[], parentId: string): TreeNode[] => {
  const descendants: TreeNode[] = [];
  const children = getChildren(nodes, parentId);

  for (const child of children) {
    descendants.push(child);
    descendants.push(...getDescendants(nodes, child.id));
  }

  return descendants;
};

/**
 * Find a node by ID
 */
export const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
  return nodes.find(node => node.id === id) || null;
};

/**
 * Check if a node is an ancestor of another node
 */
export const isAncestor = (nodes: TreeNode[], ancestorId: string, descendantId: string): boolean => {
  const descendants = getDescendants(nodes, ancestorId);
  return descendants.some(node => node.id === descendantId);
};

/**
 * Build the path from root to a specific node
 */
export const getNodePath = (nodes: TreeNode[], nodeId: string): TreeNode[] => {
  const path: TreeNode[] = [];
  let currentNode = findNode(nodes, nodeId);

  while (currentNode) {
    path.unshift(currentNode);
    currentNode = currentNode.parent ? findNode(nodes, currentNode.parent) : null;
  }

  return path;
};

/**
 * Move a node to a new position
 */
export const moveNode = (
  nodes: TreeNode[],
  draggedId: string,
  targetId: string | null,
  position: 'before' | 'after' | 'inside'
): TreeNode[] => {
  const newNodes = [...nodes];
  const draggedIndex = newNodes.findIndex(n => n.id === draggedId);

  if (draggedIndex === -1) return nodes;

  const draggedNode = { ...newNodes[draggedIndex] };

  // Remove the dragged node from its current position
  newNodes.splice(draggedIndex, 1);

  // Calculate new parent and position
  if (position === 'inside' && targetId) {
    draggedNode.parent = targetId;
  } else if (targetId) {
    const targetNode = findNode(newNodes, targetId);
    draggedNode.parent = targetNode?.parent || null;
  } else {
    draggedNode.parent = null;
  }

  // Find insertion index
  let insertIndex = newNodes.length;

  if (targetId && position !== 'inside') {
    const targetIndex = newNodes.findIndex(n => n.id === targetId);
    if (targetIndex !== -1) {
      insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    }
  }

  // Insert the node at the new position
  newNodes.splice(insertIndex, 0, draggedNode);

  return newNodes;
};

/**
 * Default validation for drop operations
 */
export const canDropDefault = (
  nodes: TreeNode[],
  draggedNode: TreeNode,
  targetNode: TreeNode | null
): boolean => {
  // Can't drop on itself
  if (targetNode && draggedNode.id === targetNode.id) {
    return false;
  }

  // Can't drop on descendants
  if (targetNode && isAncestor(nodes, draggedNode.id, targetNode.id)) {
    return false;
  }

  // Can only drop inside droppable nodes
  if (targetNode && !targetNode.droppable) {
    return false;
  }

  return true;
};
