import { v4 as uuidv4 } from 'uuid';
import type { Bookmark } from '../types/bookmark';

export function extractUrlFromDataTransfer(dt: DataTransfer | null | undefined): string | null {
  if (!dt) return null;
  let url = '';
  try {
    if ((dt as any).getData) url = (dt as any).getData('text/uri-list') || '';
  } catch (err) {
    // ignore
  }
  if (!url) {
    try {
      const plain = (dt as any).getData('text/plain') || '';
      const trimmed = (plain || '').trim();
      if (trimmed) {
        try { new URL(trimmed); url = trimmed; } catch (_) { /* not a url */ }
      }
    } catch (err) {
      // ignore
    }
  }
  return url || null;
}

export function extractNodesFromParsed(parsed: any): any[] {
  if (!parsed) return [];
  if (Array.isArray(parsed.nodes)) return parsed.nodes;
  if (parsed.node) {
    const root = parsed.node;
    if (!root.isFolder) return [root];
    const out: any[] = [];
    const walk = (n: any) => {
      if (!n) return;
      if (!n.isFolder) { out.push(n); return; }
      if (Array.isArray(n.children)) for (const c of n.children) walk(c);
    };
    walk(root);
    return out;
  }
  return [];
}

export function buildBookmarksFromNodes(nodes: any[]): Bookmark[] {
  const out: Bookmark[] = [];
  for (const n of nodes) {
    if (!n) continue;
    if (n.url || n.title) {
      out.push({
        id: uuidv4(),
        title: n.title || n.url || '',
        url: n.url || '',
        icon: n.icon || '',
        color: '',
        bgColor: '',
        description: n.description || '',
        tags: [],
        collapsed: true,
        createdDate: n.createdDate ? new Date(n.createdDate) : new Date(),
        lastModifiedDate: n.lastModifiedDate ? new Date(n.lastModifiedDate) : new Date()
      });
    }
  }
  return out;
}
