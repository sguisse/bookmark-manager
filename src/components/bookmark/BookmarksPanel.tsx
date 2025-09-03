import React, { useEffect, useRef } from 'react';
import { TreeView, useTree, RenderNodeOptions } from '../common/treeview';
import { TreeNode } from '../common/treeview/types';
import { buildTreeFromBookmarks, buildBookmarksFromTree } from './bookmarksTreeAdapter';
import BookmarkTableRow from './BookmarksRenderer';
import BookmarkForm from './BookmarkForm';
import { Bookmark } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';

export type SelectionState = any;

interface BookmarksPanelProps {
  bookmarks: Bookmark[];
  selectionState: SelectionState;
  isBookmarkFormOpen: boolean;
  editingBookmark: Bookmark | null;
  onSelect: (id: string, index: number, e: React.MouseEvent) => void;
  onEdit: (b: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleCollapsed: (id: string) => void;
  onSubmit: (data: any, editingBookmark: Bookmark | null) => void;
  onCloseForm: () => void;
  // Optional: called when the tree order or expanded state changes
  onChange?: (updatedBookmarks: Bookmark[]) => void;
}

export default function BookmarksPanel(props: Readonly<BookmarksPanelProps>) {
  const {
    bookmarks,
    selectionState,
    isBookmarkFormOpen,
    editingBookmark,
    onSelect,
    onEdit,
    onDelete,
    onToggleCollapsed,
    onSubmit,
    onCloseForm,
    onChange
  } = props;

  const initialNodes: TreeNode[] = buildTreeFromBookmarks(bookmarks || []);
  const initialOpen = (bookmarks || []).filter(b => !(b.collapsed ?? true)).map(b => b.id);

  const { nodes, openNodes, selectedId, toggleNode, selectNode, moveItem, setNodes } = useTree({
    nodes: initialNodes,
    initialOpenNodes: initialOpen,
    initialSelectedId: null
  });

  // When bookmarks prop changes (controlled), refresh nodes
  useEffect(() => {
    setNodes(buildTreeFromBookmarks(bookmarks || []));
  }, [bookmarks, setNodes]);

  // Handle node move (reorder)
  const handleDrop = (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    const updatedNodes = moveItem(draggedId, targetId, position);
    const updatedBookmarks = buildBookmarksFromTree(updatedNodes);
    onChange?.(updatedBookmarks);
  };

  // Sync expanded state (openNodes) back to bookmarks.collapsed and call onChange
  const openSyncMounted = useRef(false);
  useEffect(() => {
    if (!openSyncMounted.current) {
      openSyncMounted.current = true;
      return;
    }

    const updated = buildBookmarksFromTree(nodes);
    const applyExpanded = (items: any[]) => {
      for (const it of items) {
        it.collapsed = !openNodes.has(it.id);
      }
    };
    applyExpanded(updated);
    onChange?.(updated);
  }, [openNodes, nodes, onChange]);

  const renderNode = (node: TreeNode, _options: RenderNodeOptions) => {
    const data = node.data as Bookmark | undefined;
    // _options contains isOpen/hasChildren/isSelected etc. We don't need it here.

    const idx = (bookmarks || []).findIndex(b => b.id === node.id);

    return (
      <div style={{ padding: 2 }}>
        {data ? (
          <BookmarkTableRow
            bookmark={data}
            isSelected={selectionState?.selectedIds?.includes(data.id)}
            onSelect={(id, e) => onSelect?.(id, idx, e)}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleCollapsed={() => { toggleNode(node.id); onToggleCollapsed(node.id); }}
          />
        ) : null}
      </div>
    );
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
        onSelect={(id) => {
          selectNode(id);
        }}
        onToggle={(id) => toggleNode(id)}
        renderNode={renderNode}
        canDrop={canDrop}
        className="bookmarks-tree"
      />

      {isBookmarkFormOpen && (
        <div className="modal-overlay">
          <button
            onClick={() => { onCloseForm(); }}
            aria-label="Close modal"
            className="modal-backdrop"
          />
          <div className="modal-content">
            <BookmarkForm
              bookmark={editingBookmark}
              mode={editingBookmark?.id ? FormDisplayMode.Edit : FormDisplayMode.Create}
              onSave={(d) => onSubmit(d, editingBookmark)}
              onCancel={() => { onCloseForm(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { BookmarksPanel };
