/**
 * Small helpers for manipulating FlexLayout JSON model objects.
 * Keep these tiny and well-tested to avoid cognitive complexity in callers.
 */
/**
 * Find the parent tabset-like node that directly contains a tab with id `tabId`.
 * Returns the parent node object or null when not found.
 */
export function findParentTabset(root: unknown, tabId: string): Record<string, any> | null {
  if (!root || typeof root !== 'object') return null;
  try {
    const queue: any[] = [root];
    while (queue.length) {
      const node = queue.shift();
      if (!node || typeof node !== 'object') continue;
      const children = node.children;
      if (!Array.isArray(children)) continue;

      // use Array.prototype.find to keep logic concise
      const has = children.find((c: any) => c && c.type === 'tab' && c.id === tabId);
      if (has) return node as Record<string, any>;

      // enqueue object children
      const next = children.filter((c: any) => c && typeof c === 'object');
      if (next.length) queue.push(...next);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[flexlayoutUtils] findParentTabset failed', err);
  }
  return null;
}

export function setParentTabsetSelected(root: unknown, tabId: string): void {
  const parent = findParentTabset(root, tabId);
  if (!parent || !Array.isArray(parent.children)) return;
  const idx = parent.children.findIndex((c: any) => c && c.type === 'tab' && c.id === tabId);
  if (idx >= 0) parent.selected = idx;
}
