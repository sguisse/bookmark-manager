export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  isFolder: boolean;
  children?: BookmarkNode[];
  addDate?: number | null;
  lastModified?: number | null;
  icon?: string | null;
  description?: string | null;
  attributes?: Record<string, string>;
  order?: number;
  path?: string[]; // optional
}

// Utilities
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
 * Parse a Chrome exported bookmarks HTML file into a tree of BookmarkNode
 * Chrome format uses <DL><DT><H3 ADD_DATE=...> for folders and <A HREF=... ADD_DATE=... ICON=...> for bookmarks.
 */
export function parseChromeBookmarksHtml(htmlText: string): BookmarkNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const body = doc.body;
  if (!body) return [];

  // Find top DL(s). Chrome normally has the main content under the first DL.
  const dls = Array.from(body.querySelectorAll('dl'));
  if (dls.length === 0) return [];

  let orderCounter = 0;

  function parseDL(dl: Element, parentPath: string[] = []): BookmarkNode[] {
    const nodes: BookmarkNode[] = [];

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
    // Find the next element (in document order) that matches one of the tagNames provided.
    // This walks siblings and, if needed, walks up to parent and continues searching. It also
    // checks inside sibling wrappers for direct children with the wanted tag (e.g. <p><dl>...).
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

    // handlers to reduce cognitive complexity
    function handleFolder(dt: Element, h3: HTMLElement, ddText: string | null) {
      const title = (h3.textContent || '').trim() || 'Folder';
      const addDate = normalizeTimestampAttr(h3.getAttribute('add_date') || h3.getAttribute('adddate') || null);
      const lastModified = normalizeTimestampAttr(h3.getAttribute('last_modified') || h3.getAttribute('last-modified') || h3.getAttribute('lastmodified') || null);
      const attributes: Record<string,string> = {};
      for (const a of Array.from(h3.attributes)) attributes[a.name] = a.value;

      let children: BookmarkNode[] = [];
      const possibleDL = findFollowingElementOfTag(dt, ['dl']);
      if (possibleDL && possibleDL.tagName.toLowerCase() === 'dl') {
        children = parseDL(possibleDL, parentPath.concat(title));
      }

      nodes.push({
        id: nextId(),
        title,
        isFolder: true,
        children,
        addDate,
        lastModified,
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
        addDate,
        icon,
        description: ddText,
        attributes,
        order: orderCounter++,
        path: parentPath,
      });
    }

    for (const dt of dtElements) {
      // process a single DT element
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
