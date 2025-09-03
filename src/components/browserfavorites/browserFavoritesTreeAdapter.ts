import { BrowserBookmarkNode } from '../../types/browser';
import { TreeNode } from '../common/treeview/types';

/**
 * Convert a hierarchical BrowserBookmarkNode tree into a flat array of TreeNode
 * suitable for the shared TreeView. The original BrowserBookmarkNode object is
 * attached as `data` so we can reconstruct the hierarchy later.
 */
export function convertBrowserToTreeNodes(bookmarks: BrowserBookmarkNode[]): TreeNode[] {
  const out: TreeNode[] = [];

  const walk = (items: BrowserBookmarkNode[], parent: string | null) => {
    for (const n of items) {
      out.push({
        id: n.id,
        parent,
        text: n.title || n.url || '',
        icon: n.icon || undefined,
        droppable: !!n.isFolder,
        data: n
      });
      if (n.children && n.children.length > 0) {
        walk(n.children, n.id);
      }
    }
  };

  walk(bookmarks, null);
  return out;
}

/**
 * Rebuild a hierarchical BrowserBookmarkNode[] from the flat TreeNode[] produced
 * by `TreeView` operations. This will reuse the original `data` payload where
 * available and attach reconstructed `children` arrays.
 */
export function convertTreeNodesToBrowser(nodes: TreeNode[]): BrowserBookmarkNode[] {
  const map = new Map<string, BrowserBookmarkNode & { children?: BrowserBookmarkNode[] }>();

  // Initialize map entries reusing original data where present.
  for (const n of nodes) {
    const src = (n.data as BrowserBookmarkNode) || { id: n.id, title: n.text || '', isFolder: !!n.droppable } as BrowserBookmarkNode;
    map.set(n.id, { ...src, children: [] });
  }

  const roots: BrowserBookmarkNode[] = [];

  for (const n of nodes) {
    const node = map.get(n.id)!;
    if (n.parent == null) {
      roots.push(node);
    } else {
      const parent = map.get(n.parent);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        // If parent not found, treat as root
        roots.push(node);
      }
    }
  }

  return roots;
}

/**
 * Collect ids of nodes that were expanded in the BrowserBookmarkNode tree
 * (using `isExpanded` flag) so `useTree` can initialize `openNodes`.
 */
export function getInitialOpenNodeIds(bookmarks: BrowserBookmarkNode[]): string[] {
  const out: string[] = [];
  const walk = (items: BrowserBookmarkNode[]) => {
    for (const n of items) {
      if (n.isExpanded) out.push(n.id);
      if (n.children && n.children.length) walk(n.children);
    }
  };
  walk(bookmarks);
  return out;
}
