import React, { useState } from 'react';
import { BrowserBookmarkNode, BrowserFavorites, BrowserFavoritesFormData } from '../../types/browser';
import { FormDisplayMode } from '../../types/app';
import BrowserFavoritesForm from './BrowserFavoritesForm';

import '../../styles/index.css';
import { BrowserFavoritesService } from '../../services/BrowserFavoritesService';

type Props = {};

function formatAddDate(d?: Date | null) {
  if (!d) return '';
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
  const dateStr = formatAddDate(node.createdDate);
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

export const BrowserFavoritesManager: React.FC<Props> = () => {
  const [tree, setTree] = useState<BrowserBookmarkNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [currentFavorites, setCurrentFavorites] = useState<BrowserFavorites | null>(null);
  const formMode = FormDisplayMode.Edit; // Always in edit mode since form is always visible

  // Build a mapping of nodeId => true for nodes which have isExpanded set
  const buildExpandedMapFromTree = (nodes: BrowserBookmarkNode[]): Record<string, boolean> => {
    const map: Record<string, boolean> = {};
    const walk = (arr: BrowserBookmarkNode[]) => {
      for (const n of arr) {
        if (n.isExpanded) map[n.id] = true;
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    return map;
  };

  // On mount, try to load saved BrowserFavorites from storage to initialize form and tree
  React.useEffect(() => {
    try {
      const stored = BrowserFavoritesService.loadFromStorage();
      if (stored) {
        setCurrentFavorites(stored);
        setTree(stored.bookmarksTree || []);
        // rebuild expanded mapping from stored bookmarksTree isExpanded flags
        setExpanded(buildExpandedMapFromTree(stored.bookmarksTree || []));
      }
    } catch (err) {
      // ignore
      // eslint-disable-next-line no-console
      console.warn('Failed to load stored BrowserFavorites', err);
    }
  }, []);

  // (removed buildNodePath — we now use node.isExpanded flags directly)

  // Toggle a node's isExpanded flag in the tree, update expanded map and persist
  const toggleNodeExpanded = (nodeId: string) => {
    const updateNodes = (nodes: BrowserBookmarkNode[]): BrowserBookmarkNode[] => {
      return nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, isExpanded: !n.isExpanded };
        }
        if (n.children) {
          return { ...n, children: updateNodes(n.children) };
        }
        return n;
      });
    };

    setTree(prev => {
      const next = updateNodes(prev);
      // rebuild expanded mapping from tree isExpanded flags
      setExpanded(buildExpandedMapFromTree(next));

      // persist updated tree (with isExpanded) if we have currentFavorites
      if (currentFavorites) {
        try {
          const updatedFav: BrowserFavorites = {
            ...currentFavorites,
            bookmarksTree: next,
            lastModifiedDate: new Date()
          };
          setCurrentFavorites(updatedFav);
          BrowserFavoritesService.saveToStorage(updatedFav);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to persist expanded state', err);
        }
      }

      return next;
    });
  };

  const loadBookmarksFile = (file: File, filePath: string) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      const text = typeof result === 'string' ? result : '';
      try {
        const parsed = BrowserFavoritesService.parseChromeBookmarksHtml(text);
        setTree(parsed);
        // keep folders collapsed by default
        setExpanded({});

        // Update current favorites with the new file
        if (currentFavorites) {
          setCurrentFavorites(prev => prev ? {
            ...prev,
            filePath,
            bookmarksTree: parsed,
            nodesOpened: [],
            lastModifiedDate: new Date()
          } : null);
          // persist updated favorites
          try {
            const updated = {
              ...currentFavorites,
              filePath,
              bookmarksTree: parsed,
              nodesOpened: [],
              lastModifiedDate: new Date()
            } as BrowserFavorites;
            BrowserFavoritesService.saveToStorage(updated);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to save BrowserFavorites after loading file', err);
          }
        } else {
          // if no currentFavorites existed, create and persist one
          const newFav: BrowserFavorites = {
            id: `bf-${Date.now()}`,
            filePath,
            bookmarksTree: parsed,
            createdDate: new Date(),
            lastModifiedDate: new Date()
          };
          setCurrentFavorites(newFav);
          try {
            BrowserFavoritesService.saveToStorage(newFav);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to save new BrowserFavorites after loading file', err);
          }
        }
      } catch (err) {
        // ignore parse errors
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleFormSave = (formData: BrowserFavoritesFormData, file?: File) => {
    if (currentFavorites) {
      // Update existing browser favorites
      const updatedFavorites: BrowserFavorites = {
        ...currentFavorites,
        filePath: formData.filePath,
        bookmarksTree: tree,
        lastModifiedDate: new Date()
      };
      setCurrentFavorites(updatedFavorites);

      // persist updated favorites
      try {
        BrowserFavoritesService.saveToStorage(updatedFavorites);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save BrowserFavorites on form save', err);
      }

      // If a new file was provided, load it
      if (file) {
        loadBookmarksFile(file, formData.filePath);
      }
    } else {
      // Create new browser favorites (when none exists yet)
      const newFavorites: BrowserFavorites = {
        id: `bf-${Date.now()}`,
        filePath: formData.filePath,
        bookmarksTree: [],
        createdDate: new Date(),
        lastModifiedDate: new Date()
      };
      setCurrentFavorites(newFavorites);

      // persist new favorites
      try {
        BrowserFavoritesService.saveToStorage(newFavorites);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save new BrowserFavorites on form save', err);
      }

      // If a file was provided, load it
      if (file) {
        loadBookmarksFile(file, formData.filePath);
      }
    }
    // Keep the form open after saving for potential further use
    // setIsFormOpen(false); // Commented out to keep form open
  };

  const handleFormCancel = () => {
    // Don't close the form, just keep it open for further use
    // User can manually collapse it using the toggle button if desired
  };

  return (
    <div className="browser-favorites">

      <BrowserFavoritesForm
        browserFavorites={currentFavorites}
        mode={formMode}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />

      <div className="bf-file-uploaded" style={{ marginTop: '16px' }}>
        {currentFavorites?.filePath && (
          <div className="bf-file-info">
            <strong>Loaded File:</strong> {currentFavorites.filePath}
          </div>
        )}
      </div>

      <div className="bf-tree" role="tree" style={{ marginTop: '16px' }}>
        {tree.length === 0 ? (
          <div className="bf-empty">No bookmarks loaded. Import a Chrome bookmarks HTML file.</div>
        ) : (
          tree.map((n) => (
            <TreeNode key={n.id} node={n} open={!!expanded[n.id]} onToggle={(id) => toggleNodeExpanded(id)} expanded={expanded} />
          ))
        )}
      </div>
    </div>
  );
};

export default BrowserFavoritesManager;
