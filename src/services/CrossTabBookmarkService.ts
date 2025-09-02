type DragPayload = {
  ids: string[];
  bookmarks: any[];
  timestamp: number;
};

class CrossTabBookmarkService {
  private channel: BroadcastChannel | null = null;
  private cache = new Map<string, DragPayload>();
  private readonly channelName = 'bookmark-cross-tab';

  constructor() {
    try {
      // Use BroadcastChannel if available for cross-tab messaging
      // eslint-disable-next-line no-undef
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.addEventListener('message', (ev) => this.handleMessage(ev.data));
      }
    } catch (err) {
      // BroadcastChannel not available (older browsers) - fallback to in-memory cache
      this.channel = null;
    }
  }
  private handleMessage(data: any) {
    console.debug('[CrossTabService] message received', data);
  if (!data?.type) return;

    if (data.type === 'announce-drag' && data.sourceTabId && data.payload) {
      this.cache.set(data.sourceTabId, { ...data.payload, timestamp: Date.now() });
      return;
    }

    if (data.type === 'clear-drag' && data.sourceTabId) {
      this.cache.delete(data.sourceTabId);
      return;
    }

    if (data.type === 'commit-move' && data.sourceTabId && Array.isArray(data.ids)) {
      const current = (window as any).__CURRENT_TAB_ID__;
      if (current && current === data.sourceTabId) {
        console.debug('[CrossTabService] commit-move received for this tab', { sourceTabId: data.sourceTabId, ids: data.ids });
        const ev = new CustomEvent('cross-tab-move', { detail: { ids: data.ids, sourceTabId: data.sourceTabId } });
        try {
          window.dispatchEvent(ev);
        } catch (err) {
          console.warn('[CrossTabService] dispatch cross-tab-move error', err);
        }
      }
    }
  }

  public cacheDragData(sourceTabId: string, ids: string[], bookmarks: any[]) {
    const payload: DragPayload = { ids, bookmarks, timestamp: Date.now() };
    this.cache.set(sourceTabId, payload);
    console.debug('[CrossTabService] announce-drag', { sourceTabId, ids: ids.slice(0, 8) });
    try {
      this.channel?.postMessage({ type: 'announce-drag', sourceTabId, payload });
    } catch (err) {
      console.warn('[CrossTabService] announce-drag postMessage error', err);
    }
    // also persist briefly to localStorage for other contexts that may read it (best-effort)
    try {
      const key = `ctb:drag:${sourceTabId}`;
      localStorage.setItem(key, JSON.stringify(payload));
      // set a TTL cleanup
      setTimeout(() => {
        try { localStorage.removeItem(key); } catch (e) { console.warn('[CrossTabService] TTL cleanup removeItem error', e); }
      }, 30_000);
    } catch (err) {
      console.warn('[CrossTabService] cacheDragData localStorage error', err);
    }
  }

  public getDragData(sourceTabId: string) {
    const cached = this.cache.get(sourceTabId);
    if (cached && (Date.now() - cached.timestamp) < 30_000) return cached;
    try {
      const key = `ctb:drag:${sourceTabId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as DragPayload;
        if (parsed && (Date.now() - parsed.timestamp) < 30_000) return parsed;
      }
    } catch (err) {
      console.warn('[CrossTabService] getDragData localStorage error', err);
    }
    return null;
  }

  public clearDragData(sourceTabId: string) {
    this.cache.delete(sourceTabId);
    try {
      this.channel?.postMessage({ type: 'clear-drag', sourceTabId });
    } catch (err) {
      console.warn('[CrossTabService] clearDragData postMessage error', err);
    }
    try {
      localStorage.removeItem(`ctb:drag:${sourceTabId}`);
    } catch (err) {
      console.warn('[CrossTabService] clearDragData localStorage error', err);
    }
  }

  public notifyMove(sourceTabId: string, ids: string[]) {
    console.debug('[CrossTabService] notifyMove commit-move', { sourceTabId, ids });
    // Immediately dispatch a local event so same-window (in-app) listeners can react without relying on BroadcastChannel
    try {
      const ev = new CustomEvent('cross-tab-move', { detail: { ids, sourceTabId } });
      window.dispatchEvent(ev);
    } catch (err) {
      console.warn('[CrossTabService] notifyMove dispatch error', err);
    }

    try {
      this.channel?.postMessage({ type: 'commit-move', sourceTabId, ids });
    } catch (err) {
      console.warn('[CrossTabService] notifyMove postMessage error', err);
    }

    try {
      localStorage.setItem(`ctb:commit-move:${sourceTabId}`, JSON.stringify({ ids, timestamp: Date.now() }));
    } catch (err) {
      console.warn('[CrossTabService] notifyMove localStorage error', err);
    }
  }
}

export const crossTabBookmarkService = new CrossTabBookmarkService();
