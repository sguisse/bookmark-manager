const registry = new Map<string, HTMLElement | null>();

export function registerRow(id: string, el: HTMLElement | null) {
  if (el) registry.set(id, el);
  else registry.delete(id);
}

export function getRowRect(id: string) {
  const el = registry.get(id);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export function listRowIds() {
  return Array.from(registry.keys());
}

export function clearRegistry() {
  registry.clear();
}
