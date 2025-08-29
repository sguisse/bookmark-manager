import { BrowserBookmarkNode, BrowserFavorites } from "../types/browser";


// Utilities (kept as module-private helpers)
function normalizeTimestampAttr(val?: string | null): number | null {
  if (!val) return null;
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return null;
  return n < 1e12 ? n * 1000 : n;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `bf-${Date.now()}-${idCounter}`;
}

/**
 * BrowserFavoritesService
 * - Provides helpers to parse exported browser bookmark HTML into a tree of BrowserBookmarkNode
 * - Keeps the existing functional API via a named export wrapper for compatibility
 */
export class BrowserFavoritesService {

  static readonly STORAGE_KEY = 'app-fusion-browser-favorites';

  static parseChromeBookmarksHtml(htmlText: string): BrowserBookmarkNode[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const body = doc.body;
    if (!body) return [];

    // Find top DL(s). Chrome normally has the main content under the first DL.
    const dls = Array.from(body.querySelectorAll('dl'));
    if (dls.length === 0) return [];

    let orderCounter = 0;

    function parseDL(dl: Element, parentPath: string[] = []): BrowserBookmarkNode[] {
      const nodes: BrowserBookmarkNode[] = [];

      // Collect DT elements but be tolerant of wrappers like <p> which some exporters insert.
      const dtElements: Element[] = [];
      for (const child of Array.from(dl.children)) {
        const tn = child.tagName.toLowerCase();
        if (tn === 'dt') dtElements.push(child);
        else if (tn === 'p') {
          // sometimes DTs are wrapped inside a <p>
          for (const inner of Array.from(child.children)) {
            if (inner.tagName.toLowerCase() === 'dt') dtElements.push(inner);
          }
        }
      }

      // helper: find the next element sibling that may be attached to the dt or to a wrapper (like <p>)
      function findDirectChildMatch(start: Element | null, tagNames: string[]): Element | null {
        if (!start) return null;
        for (const t of tagNames) {
          const child = start.querySelector(`:scope > ${t}`);
          if (child) return child;
        }
        return null;
      }

      function scanSiblingsForTag(from: Element | null, tagNames: string[]): Element | null {
        let sib: Element | null = from ? from.nextElementSibling : null;
        while (sib) {
          const tn = sib.tagName.toLowerCase();
          if (tagNames.includes(tn)) return sib;
          // check direct children of the sibling
          for (const t of tagNames) {
            const inner = sib.querySelector(`:scope > ${t}`);
            if (inner) return inner;
          }
          sib = sib.nextElementSibling;
        }
        return null;
      }

      function findFollowingElementOfTag(start: Element | null, tagNames: string[]): Element | null {
        if (!start) return null;
        const direct = findDirectChildMatch(start, tagNames);
        if (direct) return direct;

        let node: Element | null = start;
        while (node && node !== dl) {
          const found = scanSiblingsForTag(node, tagNames);
          if (found) return found;
          node = node.parentElement;
        }
        return null;
      }

      // helper to extract dd text for a dt (if any)
      function extractDDText(dt: Element): string | null {
        const next = findFollowingElementOfTag(dt, ['dd']);
        return next && next.tagName.toLowerCase() === 'dd' ? (next.textContent || '').trim() : null;
      }

      function handleFolder(dt: Element, h3: HTMLElement, ddText: string | null) {
        const title = (h3.textContent || '').trim() || 'Folder';
        const addDate = normalizeTimestampAttr(h3.getAttribute('add_date') || h3.getAttribute('adddate') || null);
        const lastModified = normalizeTimestampAttr(h3.getAttribute('last_modified') || h3.getAttribute('last-modified') || h3.getAttribute('lastmodified') || null);
        const attributes: Record<string,string> = {};
        for (const a of Array.from(h3.attributes)) attributes[a.name] = a.value;

        let children: BrowserBookmarkNode[] = [];
        const possibleDL = findFollowingElementOfTag(dt, ['dl']);
        if (possibleDL && possibleDL.tagName.toLowerCase() === 'dl') {
          children = parseDL(possibleDL, parentPath.concat(title));
        }

        nodes.push({
          id: nextId(),
          title,
          isFolder: true,
          children,
          createdDate: addDate ? new Date(addDate) : undefined,
          lastModifiedDate: lastModified ? new Date(lastModified) : undefined,
          description: ddText,
          attributes,
          order: orderCounter++,
          path: parentPath.concat(title),
        });
      }

      function handleLink(a: HTMLAnchorElement, ddText: string | null) {
        const title = (a.textContent || a.getAttribute('title') || '').trim() || 'Bookmark';
        const href = a.getAttribute('href') || undefined;
        const addDate = normalizeTimestampAttr(a.getAttribute('add_date') || a.getAttribute('adddate') || null);
        const icon = a.getAttribute('icon') || null;
        const attributes: Record<string,string> = {};
        for (const at of Array.from(a.attributes)) attributes[at.name] = at.value;

        nodes.push({
          id: nextId(),
          title,
          url: href,
          isFolder: false,
          createdDate: addDate ? new Date(addDate) : undefined,
          icon,
          description: ddText,
          attributes,
          order: orderCounter++,
          path: parentPath,
        });
      }

      for (const dt of dtElements) {
        function processDt(dtEl: Element) {
          const firstChild = dtEl.firstElementChild;
          if (!firstChild) return;
          const tag = firstChild.tagName.toLowerCase();
          const ddText = extractDDText(dtEl);

          if (tag === 'h3') {
            handleFolder(dtEl, firstChild as HTMLElement, ddText);
          } else if (tag === 'a') {
            handleLink(firstChild as HTMLAnchorElement, ddText);
          } else {
            const raw = firstChild.outerHTML;
            nodes.push({
              id: nextId(),
              title: raw.slice(0, 120),
              isFolder: false,
              description: ddText || null,
              attributes: { rawTag: tag },
              order: orderCounter++,
              path: parentPath,
            });
          }
        }

        processDt(dt);
      }

      return nodes;
    }

    // use the first top-level DL as root
    return parseDL(dls[0], []);
  }

  /**
   * Load BrowserFavorites from localStorage.
   * Returns null when nothing is stored or parsing fails.
   */
  static loadFromStorage(): BrowserFavorites | null {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(BrowserFavoritesService.STORAGE_KEY) : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Basic shape check
      if (!parsed || typeof parsed !== 'object' || !parsed.id || !Array.isArray(parsed.bookmarksTree)) return null;

      // Helper: parse a value that may be a Date (string/number) or already a Date
      function parseDateVal(v: any): Date | undefined {
        if (v === null || v === undefined) return undefined;
        if (typeof v === 'number') {
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? undefined : d;
        }
        if (typeof v === 'string') {
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? undefined : d;
        }
        if (v instanceof Date) return v;
        return undefined;
      }

      // Recursively walk nodes and convert createdDate/lastModifiedDate to Date instances
      function rehydrateNode(node: any) {
        if (!node || typeof node !== 'object') return;
        if ('createdDate' in node) node.createdDate = parseDateVal(node.createdDate);
        if ('lastModifiedDate' in node) node.lastModifiedDate = parseDateVal(node.lastModifiedDate);
        // also support legacy numeric fields in case older stored data still uses them
        if ((!node.createdDate || node.createdDate === undefined) && ('addDate' in node)) {
          node.createdDate = parseDateVal(node.addDate);
        }
        if ((!node.lastModifiedDate || node.lastModifiedDate === undefined) && ('lastModified' in node)) {
          node.lastModifiedDate = parseDateVal(node.lastModified);
        }
        if (Array.isArray(node.children)) {
          for (const c of node.children) rehydrateNode(c);
        }
      }

      // Rehydrate top-level auditing fields
      if ('createdDate' in parsed) parsed.createdDate = parseDateVal(parsed.createdDate);
      if ('lastModifiedDate' in parsed) parsed.lastModifiedDate = parseDateVal(parsed.lastModifiedDate);
      if (!parsed.createdDate && 'createdDate' in parsed && parsed.createdDate === undefined && 'createdAt' in parsed) parsed.createdDate = parseDateVal(parsed.createdAt);

      // Rehydrate each node in the bookmarksTree
      if (Array.isArray(parsed.bookmarksTree)) {
        for (const n of parsed.bookmarksTree) rehydrateNode(n);
      }

      return parsed as import('../types/browser').BrowserFavorites;
    } catch (err) {
      // Log and return null on error
      // eslint-disable-next-line no-console
      console.warn('BrowserFavoritesService.loadFromStorage: failed to parse stored favorites', err);
      return null;
    }
  }

  /**
   * Save BrowserFavorites to localStorage (overwrites existing value).
   */
  static saveToStorage(favorites: BrowserFavorites): void {
    try {
      if (typeof window === 'undefined') return;
      const toStore = JSON.stringify(favorites);
      window.localStorage.setItem(BrowserFavoritesService.STORAGE_KEY, toStore);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('BrowserFavoritesService.saveToStorage: failed to save favorites', err);
    }
  }


}
