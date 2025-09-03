import { TreeNode } from '../common/treeview/types';
import { Bookmark } from '../../types/bookmark';

/**
 * Convert a flat array of Bookmark into TreeNode[] used by the shared TreeView.
 * This is intentionally simple (flat) — if you need hierarchical bookmarks, extend this.
 */
export function buildTreeFromBookmarks(bookmarks: Bookmark[] | undefined): TreeNode[] {
  if (!bookmarks || bookmarks.length === 0) return [];
  return bookmarks.map((b) => ({
    id: b.id,
    parent: null,
    text: b.title || b.url || 'untitled',
    icon: undefined,
    droppable: false,
    data: b
  } as TreeNode));
}

export function buildBookmarksFromTree(nodes: TreeNode[] | undefined): Bookmark[] {
  if (!nodes || nodes.length === 0) return [];
  return nodes.map(n => (n.data as Bookmark)).filter(Boolean);
}

export default {
  buildTreeFromBookmarks,
  buildBookmarksFromTree
};
