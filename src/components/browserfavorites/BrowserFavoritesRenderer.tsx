import React, { useEffect, useState, useRef } from 'react';
import { TreeView, useTree, RenderNodeOptions } from '../common/treeview';
import { TreeNode } from '../common/treeview/types';
import { BrowserBookmarkNode, BrowserFavorites } from '../../types/browser';
import { BrowserFavoritesService } from '../../services/BrowserFavoritesService';
import { convertBrowserToTreeNodes, convertTreeNodesToBrowser, getInitialOpenNodeIds } from './browserFavoritesTreeAdapter';
import Image from '../common/image/Image';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  bookmarksTree?: BrowserBookmarkNode[];
  onChange?: (updatedTree: BrowserBookmarkNode[]) => void;
  onSelect?: (id: string) => void;
  className?: string;
}

const Icon: React.FC<{ icon?: string | null; isFolder?: boolean }> = ({ icon, isFolder }) => {
  if (icon && /^data:image\//i.test(icon || '')) {
    return <img src={icon!} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />;
  }
  return <span aria-hidden>{isFolder ? '📁' : '🔖'}</span>;
};

export const BrowserFavoritesRenderer: React.FC<Props> = ({ bookmarksTree: propsTree, onChange, onSelect, className }) => {
  const [bookmarksTree, setBookmarksTree] = useState<BrowserBookmarkNode[]>(propsTree ?? []);
  const [currentFavorites, setCurrentFavorites] = useState<BrowserFavorites | null>(null);

  // Load persisted favorites on mount only when no controlled tree is provided
  useEffect(() => {
    if (propsTree !== undefined) return;
    try {
      const stored = BrowserFavoritesService.loadFromStorage();
      if (stored) {
        setCurrentFavorites(stored);
        setBookmarksTree(stored.bookmarksTree || []);
      }
    } catch (err) {
      // ignore
      // eslint-disable-next-line no-console
      console.warn('Failed to load BrowserFavorites', err);
    }
  }, [propsTree]);

  // If parent controls the tree, synchronize local state
  useEffect(() => {
    if (propsTree !== undefined) setBookmarksTree(propsTree);
  }, [propsTree]);

  // Convert to TreeView nodes and initialize useTree
  const initialNodes = convertBrowserToTreeNodes(bookmarksTree || []);
  const initialOpen = getInitialOpenNodeIds(bookmarksTree || []);

  const { nodes, openNodes, selectedId, toggleNode, selectNode, moveItem, setNodes } = useTree({
    nodes: initialNodes,
    initialOpenNodes: initialOpen,
    initialSelectedId: null
  });

  // When external bookmarksTree updates (e.g., load file), refresh nodes
  useEffect(() => {
    const nodes = convertBrowserToTreeNodes(bookmarksTree || []);
    setNodes(nodes);
  }, [bookmarksTree]);

  // Persist tree after node move
  const handleDrop = (
    draggedIds: string | string[],
    targetId: string | null,
    position: 'before' | 'after' | 'inside'
  ) => {
    const updatedNodes = moveItem(draggedIds, targetId, position);
    // convert back to hierarchical browser nodes
    const updatedTree = convertTreeNodesToBrowser(updatedNodes);
    // Only update state / persist if the tree actually changed (avoid feedback loops)
    const same = JSON.stringify(updatedTree) === JSON.stringify(bookmarksTree);
    if (!same) {
      setBookmarksTree(updatedTree);

      // If parent provided an onChange handler, call it and do not persist here
      if (onChange) {
        onChange(updatedTree);
        return;
      }

      // persist locally when uncontrolled
      if (currentFavorites) {
        const updated: BrowserFavorites = {
          ...currentFavorites,
          bookmarksTree: updatedTree,
          lastModifiedDate: new Date()
        };
        setCurrentFavorites(updated);
        try {
          BrowserFavoritesService.saveToStorage(updated);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to persist BrowserFavorites after move', err);
        }
      }
    }
  };

  // Keep expanded state (isExpanded) in the BrowserBookmarkNode tree in sync with openNodes
  // Skip the initial run (initialOpen is used to initialize the UI)
  const openSyncMounted = useRef(false);
  useEffect(() => {
    if (!openSyncMounted.current) {
      openSyncMounted.current = true;
      return;
    }

    // Reconstruct hierarchical tree from the flat nodes and set isExpanded flags
    const updatedTree = convertTreeNodesToBrowser(nodes);

    const applyExpanded = (items: any[]) => {
      for (const it of items) {
        it.isExpanded = openNodes.has(it.id);
        if (it.children && it.children.length) applyExpanded(it.children);
      }
    };
    applyExpanded(updatedTree);
    // Avoid updating/persisting if nothing changed to prevent an update loop
    const same = JSON.stringify(updatedTree) === JSON.stringify(bookmarksTree);
    if (!same) {
      setBookmarksTree(updatedTree);

      // If parent provided an onChange handler, call it and do not persist here
      if (onChange) {
        onChange(updatedTree);
        return;
      }

      // persist locally when uncontrolled
      if (currentFavorites) {
        const updated: BrowserFavorites = {
          ...currentFavorites,
          bookmarksTree: updatedTree,
          lastModifiedDate: new Date()
        };
        setCurrentFavorites(updated);
        try {
          BrowserFavoritesService.saveToStorage(updated);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to persist BrowserFavorites after expand/collapse', err);
        }
      }
    }
  }, [openNodes, nodes, onChange, currentFavorites]);

  // Render node similar to BrowserFavoritesManager but using the TreeNode shape
  const renderNode = (node: TreeNode, options: RenderNodeOptions) => {
    const { isOpen, hasChildren, isSelected } = options;
    const data = node.data as BrowserBookmarkNode | undefined;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 2px', borderRadius: 4 }}>
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }} style={{ background: 'none', border: 'none', padding: 2 }}>
            {isOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ) : (
          <span style={{ width: 20 }} />
        )}

        {data?.icon ? <Image value={data.icon} size={16} rounded /> : <Icon isFolder={!!data?.isFolder} />}

        <span style={{ flex: 1, color: isSelected ? '#1976d2' : 'inherit' }}>{node.text}</span>
      </div>
    );
  };

  const handleSelect = (id: string) => {
    selectNode(id);
    onSelect?.(id);
  };

  const canDrop = (_dragged: TreeNode, _target: TreeNode | null) => true;

  return (
    <div style={{ padding: 2 }}>
      <TreeView
        nodes={nodes}
        rootId={null}
        selectedId={selectedId || undefined}
        openNodes={openNodes}
        onDrop={handleDrop}
        onSelect={handleSelect}
        onToggle={(id) => toggleNode(id)}
        renderNode={renderNode}
        canDrop={canDrop}
        className={className || 'browser-favorites-tree'}
      />
    </div>
  );
};

export default BrowserFavoritesRenderer;
