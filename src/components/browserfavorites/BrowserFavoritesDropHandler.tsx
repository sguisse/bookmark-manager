import React, { useEffect } from 'react';

// Centralized handler that listens for native drag/drop events produced by the
// BrowserFavorites tree nodes and translates them into app-level CustomEvents
// consumed by bookmarks tabs and the flexlayout manager.

function tryParse(dataTransfer: DataTransfer | null, type: string) {
  if (!dataTransfer) return null;
  const raw = (() => {
    try {
      return dataTransfer.getData(type);
    } catch (err) {
      // getData may throw on some browsers for unknown types
      console.debug('tryParse: getData failed for type', type, err);
      return null;
    }
  })();
  if (!raw) {
    try {
      const txt = dataTransfer.getData('text/plain');
      if (txt) return { text: txt };
    } catch (err) {
      console.debug('tryParse: text/plain fallback failed', err);
      return null;
    }
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.debug('tryParse: JSON parse failed', err);
    return null;
  }
}

function buildPayload(dataTransfer: DataTransfer | null): Record<string, unknown> | null {
  if (!dataTransfer) return null;
  const folder = tryParse(dataTransfer, 'application/x-bookmarks-folder');
  const nodes = tryParse(dataTransfer, 'application/x-bookmarks');
  const payload: any = {};

  if (folder) {
    payload.node = folder.node || folder;
    payload.title = folder.title || payload.node?.title || 'Bookmarks';
    return payload;
  }

  if (nodes) {
    payload.nodes = nodes.nodes || nodes;
    payload.title = payload.nodes?.length ? (payload.nodes[0].title || 'Bookmarks') : 'Bookmarks';
    return payload;
  }

  try {
    const text = dataTransfer.getData('text/uri-list') || dataTransfer.getData('text/plain');
    if (text) {
      const urls = text.split(/\r?\n/).filter(Boolean);
      if (urls.length) {
        payload.urls = urls;
        payload.title = urls[0] || 'Bookmarks';
        return payload;
      }
    }
  } catch (err) {
    console.debug('buildPayload: failed to read text/uri-list or text/plain', err);
  }

  return null;
}

// detectTargetTabset removed: header/tabset dispatch is no longer used in the new flow.

const BrowserFavoritesDropHandler: React.FC = () => {
  useEffect(() => {
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      const payload = buildPayload(e.dataTransfer);
      if (!payload) return;

  // include drop effect (copy/move) when available
      const dropEffect = (e.dataTransfer && (e.dataTransfer.dropEffect as string)) || undefined;
      // normalize nodeIds safely
      let nodeIds: string[] | undefined = undefined;
      try {
        const p: any = payload;
        if (p?.node) {
          if (Array.isArray(p.node)) {
            nodeIds = p.node.map((n: any) => n?.id).filter(Boolean);
          } else if (p.node?.id) {
            nodeIds = [p.node.id];
          }
        }
      } catch (err) {
        console.debug('BrowserFavoritesDropHandler: nodeIds normalization failed', err);
        nodeIds = undefined;
      }

      // Debug log — helps trace native drag/drop translation
      console.debug('BrowserFavoritesDropHandler onDrop payload', { payload, clientX: e.clientX, clientY: e.clientY, dropEffect, nodeIds });

      // Dispatch for bookmarks list insertion
      try {
        window.dispatchEvent(new CustomEvent('flexlayout:bookmarks:external-drop', { detail: { ...payload, clientX: e.clientX, clientY: e.clientY, dropEffect, nodeIds } }));
      } catch (err) {
        console.warn('BrowserFavoritesDropHandler: external-drop dispatch failed', err);
      }
    };

    const onDragOver = (e: DragEvent) => {
      try {
        // Allow drops by preventing default. If we don't preventDefault here,
        // many browsers will not emit 'drop' on targets.
        e.preventDefault();
        // Try to set an appropriate dropEffect if available. Prefer 'copy'
        // to avoid accidental destructive moves; callers may inspect effect.
        if (e.dataTransfer) {
          // Prefer copy when modifier keys indicate copy; else let browser decide
          if (e.ctrlKey || e.metaKey) e.dataTransfer.dropEffect = 'copy';
          else e.dataTransfer.dropEffect = e.dataTransfer.dropEffect || 'copy';
        }
      } catch (err) {
        console.debug('BrowserFavoritesDropHandler: dragover handler failed', err);
      }
    };

    // We only care about drops initiated by the BrowserFavorites tree (it sets custom mime types)
    window.addEventListener('dragover', onDragOver as EventListener);
    window.addEventListener('drop', onDrop as EventListener);
    return () => {
      window.removeEventListener('dragover', onDragOver as EventListener);
      window.removeEventListener('drop', onDrop as EventListener);
    };
  }, []);

  return null;
};

export default BrowserFavoritesDropHandler;
