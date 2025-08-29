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

const TreeNode: React.FC<{ node: BrowserBookmarkNode; open: boolean; onToggle: (id: string) => void; expanded: Record<string, boolean>; selected?: boolean; onSelect?: (id: string, e: React.MouseEvent) => void; selectedIds?: string[]; getNodesByIds?: (ids: string[]) => BrowserBookmarkNode[] }> = ({ node, open, onToggle, expanded, selected, onSelect, selectedIds, getNodesByIds }) => {
  const tooltipLines: string[] = [];
  const dateStr = formatAddDate(node.createdDate);
  if (dateStr) tooltipLines.push(dateStr);
  if (node.url) tooltipLines.push(node.url || '');

  // tooltip follows mouse cursor: track position and visibility per node
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimerRef = React.useRef<number | null>(null);

  const showTooltip = (e: React.MouseEvent | React.FocusEvent) => {
    // schedule tooltip after 1 second
    if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current);
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
    tooltipTimerRef.current = window.setTimeout(() => setTooltipVisible(true), 1000);
  };

  const moveTooltip = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) {
      window.clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
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
            className={"bf-node-label bf-folder-toggle" + (selected ? ' bf-node-selected' : '')}
            onClick={(e) => {
              const meta = (e as React.MouseEvent).metaKey || (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).altKey || (e as React.MouseEvent).shiftKey;
              if (meta) {
                // when modifier keys are used allow selection of the folder (selection will be resolved later to leaf nodes)
                if (onSelect) onSelect(node.id, e as unknown as React.MouseEvent);
              } else {
                // normal click toggles expansion
                onToggle(node.id);
              }
            }}
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
              <TreeNode key={c.id} node={c} open={!!expanded[c.id]} onToggle={onToggle} expanded={expanded} selected={!!(selectedIds?.includes(c.id))} onSelect={onSelect} selectedIds={selectedIds} getNodesByIds={getNodesByIds} />
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
        className={"bf-node-label" + (selected ? ' bf-node-selected' : '')}
        onMouseEnter={showTooltip}
        onFocus={showTooltip}
        onMouseMove={moveTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
        onClick={(e) => {
          if (onSelect) onSelect(node.id, e);
        }}
        draggable={true}
        onDragStart={(e) => {
          try {
            // If multiple selected and this node is part of selection, drag all selected bookmarks
            const sel = (selectedIds && selectedIds.length > 0) ? selectedIds : [node.id];
            // try to obtain node objects for selected ids via helper if provided
            let payloadNodes: any[] = [];
            if (getNodesByIds) {
              payloadNodes = getNodesByIds(sel).filter(Boolean).map(n => ({ id: n.id, title: n.title, url: n.url, icon: n.icon, createdDate: n.createdDate, lastModifiedDate: n.lastModifiedDate, description: n.description }));
            }
            if (payloadNodes.length === 0) payloadNodes = [{ id: node.id, title: node.title, url: node.url }];

            const payload = JSON.stringify({ nodes: payloadNodes });
            e.dataTransfer?.setData('application/x-bookmarks', payload);
            e.dataTransfer?.setData('text/plain', payloadNodes.map((p: any) => p.url || p.title).join('\n'));

            // show a small drag badge indicating number of items being dragged using setDragImage
            try {
              const count = payloadNodes.length;
              const badge = document.createElement('div');
              badge.className = 'bf-drag-badge';
              badge.textContent = String(count);
              // basic inline style to ensure visibility if CSS not loaded
              badge.style.position = 'absolute';
              badge.style.top = '0px';
              badge.style.left = '0px';
              badge.style.padding = '6px 8px';
              badge.style.borderRadius = '999px';
              badge.style.background = 'var(--color-primary)';
              badge.style.color = 'white';
              badge.style.fontWeight = '600';
              badge.style.zIndex = '99999';
              badge.style.fontSize = '12px';
              document.body.appendChild(badge);
              // use the badge as drag image
              if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                e.dataTransfer.setDragImage(badge, 16, 16);
              }
              // remove badge after a short delay; keep slightly longer to ensure drag image used
              setTimeout(() => { try { document.body.removeChild(badge); } catch (err) { console.warn('Failed to remove temp drag badge', err); } }, 500);
            } catch (err) {
              // Log drag image failures (non-fatal)
              // eslint-disable-next-line no-console
              console.warn('Failed to create drag image badge', err);
            }

            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
          } catch (err) {
            console.warn('Failed to set drag data for bookmark', err);
          }
        }}
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
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

  // Flatten visible nodes into an ordered list (pre-order) but only include leaf bookmark nodes
  const flattenVisibleLeafNodes = (nodes: BrowserBookmarkNode[], expandedMap: Record<string, boolean>): BrowserBookmarkNode[] => {
    const out: BrowserBookmarkNode[] = [];
    const walk = (arr: BrowserBookmarkNode[]) => {
      for (const n of arr) {
        if (!n.isFolder) {
          out.push(n);
        } else if (expandedMap[n.id] && n.children) {
          // if folder is expanded, visit children
          walk(n.children);
        }
      }
    };
    walk(nodes);
    return out;
  };

  // Find a node by id in the tree
  const findNodeById = (nodes: BrowserBookmarkNode[], id: string): BrowserBookmarkNode | undefined => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNodeById(n.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Collect visible leaf ids starting from a node (respect expanded map)
  const collectVisibleLeafIdsFromNode = (node: BrowserBookmarkNode, expandedMap: Record<string, boolean>): string[] => {
    const out: string[] = [];
    const walk = (n: BrowserBookmarkNode) => {
      if (!n) return;
      if (!n.isFolder) {
        out.push(n.id);
        return;
      }
      if (expandedMap[n.id] && n.children) {
        for (const c of n.children) walk(c);
      }
    };
    walk(node);
    return out;
  };

  // Selection handling: support Ctrl/Meta/Alt to toggle, Shift to select range
  const handleSelect = (id: string, e: React.MouseEvent) => {
    const meta = e.metaKey || e.ctrlKey || e.altKey;
    const shift = e.shiftKey;

    // Resolve incoming id into one or more leaf ids (folders -> visible leaf descendants)
    const node = findNodeById(tree, id);
    let targetLeafIds: string[] = [];
    if (!node) return;
    if (node.isFolder) {
      targetLeafIds = collectVisibleLeafIdsFromNode(node, expanded);
    } else {
      targetLeafIds = [id];
    }
    if (targetLeafIds.length === 0) return;

    setSelectedIds(prev => {
      // If shift, select range between lastSelectedId and first target id
      if (shift && lastSelectedId != null) {
        const visible = flattenVisibleLeafNodes(tree, expanded);
        const ids = visible.map(v => v.id);
        const a = ids.indexOf(lastSelectedId);
        const b = ids.indexOf(targetLeafIds[0]);
        if (a >= 0 && b >= 0) {
          const [start, end] = a < b ? [a, b] : [b, a];
          const range = ids.slice(start, end + 1);
          setLastSelectedId(targetLeafIds[0]);
          return Array.from(new Set([...prev, ...range]));
        }
      }

      // If meta (ctrl/cmd/alt), toggle each id in the target set
      if (meta) {
        const anyMissing = targetLeafIds.some(t => !prev.includes(t));
        let next: string[];
        if (anyMissing) {
          next = Array.from(new Set([...prev, ...targetLeafIds]));
        } else {
          next = prev.filter(x => !targetLeafIds.includes(x));
        }
        setLastSelectedId(targetLeafIds[0]);
        return next;
      }

      // default single selection (replace)
      setLastSelectedId(targetLeafIds[0]);
        return [targetLeafIds[0]];
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
            lastModifiedDate: new Date()
          } : null);
          // persist updated favorites
          try {
            const updated = {
              ...currentFavorites,
              filePath,
              bookmarksTree: parsed,
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
            <TreeNode key={n.id} node={n} open={!!expanded[n.id]} onToggle={(id) => toggleNodeExpanded(id)} expanded={expanded} selected={!!selectedIds.includes(n.id)} onSelect={handleSelect} selectedIds={selectedIds} getNodesByIds={(ids) => ids.map(i => findNodeById(tree, i)).filter(Boolean) as BrowserBookmarkNode[]} />
          ))
        )}
      </div>
    </div>
  );
};

export default BrowserFavoritesManager;
