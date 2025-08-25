import React, { useState, useRef } from 'react';
import type { BrowserBookmarkNode } from '../../services/BrowserFavoritesParser';
import { parseChromeBookmarksHtml } from '../../services/BrowserFavoritesParser';

import '../../styles/index.css';

type Props = {};

function formatAddDate(addDate?: number | null) {
  if (!addDate) return '';
  // parser normalizes addDate to milliseconds
  const d = new Date(addDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const isImageSrc = (val?: string) => {
  if (!val) return false;
  if (/^data:image\//i.test(val)) return true;
  if (/https?:\/\//i.test(val)) return /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/i.test(val);
  return /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/i.test(val);
};

const Icon: React.FC<{ icon?: string | null; isFolder?: boolean }> = ({ icon, isFolder }) => {
  if (icon && isImageSrc(icon)) {
    return <img src={icon} alt="" className="bf-node-favicon" />;
  }
  return <span className="bf-node-emoji" aria-hidden>{isFolder ? '📁' : '🔖'}</span>;
};

// helper to count total links recursively inside a node (bookmarks only)
const countLinks = (node: BrowserBookmarkNode | undefined | null): number => {
  if (!node) return 0;
  if (!node.isFolder) return 1;
  let total = 0;
  if (node.children) {
    for (const c of node.children) {
      total += countLinks(c);
    }
  }
  return total;
};

// helper to collect all urls recursively from a folder node
const collectUrls = (node: BrowserBookmarkNode | undefined | null): string[] => {
  if (!node) return [];
  if (!node.isFolder) return node.url ? [node.url] : [];
  const out: string[] = [];
  if (node.children) {
    for (const c of node.children) {
      out.push(...collectUrls(c));
    }
  }
  return out;
};

const TreeNode: React.FC<{ node: BrowserBookmarkNode; open: boolean; onToggle: (id: string) => void; expanded: Record<string, boolean> }> = ({ node, open, onToggle, expanded }) => {
  const tooltipLines: string[] = [];
  const dateStr = formatAddDate(node.addDate);
  if (dateStr) tooltipLines.push(dateStr);
  if (node.url) tooltipLines.push(node.url || '');

  // tooltip follows mouse cursor: track position and visibility per node
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const showTooltip = (e: React.MouseEvent | React.FocusEvent) => {
    // MouseEvent has clientX/Y; FocusEvent does not. Use currentTarget for focus.
    if ('clientX' in e && 'clientY' in e) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    } else {
      const el = e.currentTarget as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setTooltipPos({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
      } else {
        setTooltipPos(null);
      }
    }
    setTooltipVisible(true);
  };

  const moveTooltip = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
  };

  if (node.isFolder) {
    // include total links count in folder tooltip
    const totalLinks = countLinks(node);
    if (totalLinks >= 0) tooltipLines.push(`${totalLinks} links`);
    return (
      <div className="bf-node bf-folder relative">
        <button
          type="button"
          className="bf-node-label bf-folder-toggle"
          onClick={() => onToggle(node.id)}
          aria-expanded={open}
          onMouseEnter={showTooltip}
          onFocus={showTooltip}
          onMouseMove={moveTooltip}
          onMouseLeave={hideTooltip}
          onBlur={hideTooltip}
          draggable={true}
          onDragStart={(e) => {
            try {
              // send the full BrowserBookmarkNode for richer handling on drop
              const urls = collectUrls(node);
              const payload = JSON.stringify({ title: node.title || 'Bookmarks', node, urls });
              e.dataTransfer?.setData('application/x-bookmarks-folder', payload);
              // set a plain text fallback
              e.dataTransfer?.setData('text/plain', `${node.title || 'Bookmarks'} (${urls.length} links)`);
              // allow move/copy
              if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
            } catch (err) {
              console.warn('Failed to set drag data for bookmarks folder', err);
            }
          }}
        >
          <span className="bf-node-left">
            <Icon icon={node.icon || null} isFolder />
            <span className="bf-node-text">{node.title}</span>
          </span>
        </button>
        <div
          className="bf-node-tooltip"
          role="tooltip"
          aria-hidden={tooltipLines.length === 0 || !tooltipVisible}
          style={(() => {
            const base: React.CSSProperties = {};
            if (tooltipPos) {
              base.position = 'fixed';
              base.left = `${tooltipPos.x + 12}px`;
              base.top = `${tooltipPos.y + 12}px`;
            }
            // also mirror visibility state inline to ensure consistent behavior
            base.visibility = tooltipLines.length === 0 || !tooltipVisible ? 'hidden' : 'visible';
            base.opacity = tooltipVisible ? 1 : 0;
            base.pointerEvents = tooltipVisible ? 'auto' : 'none';
            return base;
          })()}
        >
          {tooltipLines.map((l) => (
            <div key={l} className="bf-tooltip-line">{l}</div>
          ))}
        </div>
        {open && node.children && (
          <div className="bf-children">
            {node.children.map((c) => (
              <TreeNode key={c.id} node={c} open={!!expanded[c.id]} onToggle={onToggle} expanded={expanded} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bf-node bf-bookmark relative">
      <button
        type="button"
        className="bf-node-label"
        onMouseEnter={showTooltip}
        onFocus={showTooltip}
        onMouseMove={moveTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
      >
        <span className="bf-node-left">
          <Icon icon={node.icon || null} />
          <span className="bf-node-text">{node.title}</span>
        </span>
        <div
          className="bf-node-tooltip"
          role="tooltip"
          aria-hidden={tooltipLines.length === 0 || !tooltipVisible}
          style={(() => {
            const base: React.CSSProperties = {};
            if (tooltipPos) {
              base.position = 'fixed';
              base.left = `${tooltipPos.x + 12}px`;
              base.top = `${tooltipPos.y + 12}px`;
            }
            base.visibility = tooltipLines.length === 0 || !tooltipVisible ? 'hidden' : 'visible';
            base.opacity = tooltipVisible ? 1 : 0;
            base.pointerEvents = tooltipVisible ? 'auto' : 'none';
            return base;
          })()}
        >
          {tooltipLines.map((l) => (
            <div key={l} className="bf-tooltip-line">{l}</div>
          ))}
        </div>
  </button>
    </div>
  );
};

export const BrowserFavorites: React.FC<Props> = () => {
  const [tree, setTree] = useState<BrowserBookmarkNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ...existing code...

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      const text = typeof result === 'string' ? result : '';
      try {
        const parsed = parseChromeBookmarksHtml(text);
        setTree(parsed);
        // keep folders collapsed by default
        setExpanded({});
      } catch (err) {
        // ignore parse errors
        console.error(err);
      }
    };
    reader.readAsText(f);
  }

  return (
    <div className="browser-favorites">
      <div className="bf-controls">
        <label className="bf-file-label">
          <input ref={fileRef} type="file" accept="text/html" onChange={onFile} />
          <span className="bf-file-cta">Import Chrome Bookmarks HTML</span>
        </label>
      </div>
      <div className="bf-tree" role="tree">
        {tree.length === 0 ? (
          <div className="bf-empty">No bookmarks loaded. Import a Chrome bookmarks HTML file.</div>
        ) : (
          tree.map((n) => (
            <TreeNode key={n.id} node={n} open={!!expanded[n.id]} onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))} expanded={expanded} />
          ))
        )}
      </div>
    </div>
  );
};

export default BrowserFavorites;
