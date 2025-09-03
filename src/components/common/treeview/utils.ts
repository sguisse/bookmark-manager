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
  draggedIds: string[] | string,
  targetId: string | null,
  position: 'before' | 'after' | 'inside'
): TreeNode[] => {
  const ids = Array.isArray(draggedIds) ? draggedIds : [draggedIds];
  const newNodes = [...nodes];

  // Remove all dragged nodes (preserve order as in original array)
  const draggedNodes = ids
    .map(id => newNodes.find(n => n.id === id))
    .filter(Boolean)
    .map(n => ({ ...n! } as TreeNode));

  // Filter them out
  for (const id of ids) {
    const idx = newNodes.findIndex(n => n.id === id);
    if (idx !== -1) newNodes.splice(idx, 1);
  }

  // Prevent moving into its own descendant
  if (targetId) {
    for (const dragged of draggedNodes) {
      if (isAncestor(nodes, dragged.id, targetId)) {
        // invalid move, return original
        return nodes;
      }
    }
  }

  // Determine new parent for dragged nodes
  let newParent: string | null = null;
  if (position === 'inside' && targetId) newParent = targetId;
  else if (targetId) {
    const targetNode = findNode(newNodes, targetId);
    newParent = targetNode?.parent || null;
  }

  for (const dn of draggedNodes) dn.parent = newParent;

  // Find insertion index
  let insertIndex = newNodes.length;
  if (targetId && position !== 'inside') {
    const targetIndex = newNodes.findIndex(n => n.id === targetId);
    if (targetIndex !== -1) insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  }

  // Insert dragged nodes preserving their order
  newNodes.splice(insertIndex, 0, ...draggedNodes);

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
