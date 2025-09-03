import React, { useRef } from 'react';
import { TreeNode as TreeNodeType, DragItem, DropPosition, RenderNodeOptions } from './types';
import { getChildren, canDropDefault } from './utils';

interface TreeNodeProps {
  node: TreeNodeType;
  nodes: TreeNodeType[];
  depth: number;
  isOpen: boolean;
  isSelected: boolean;
  openNodes: Set<string>;
  selectedId?: string | null;
  selectedIds?: Set<string>;
  onToggle?: (nodeId: string) => void;
  onSelect?: (nodeId: string, e?: React.MouseEvent) => void;
  onDrop: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  canDrop?: (draggedNode: TreeNodeType, targetNode: TreeNodeType | null) => boolean;
  renderNode?: (node: TreeNodeType, options: RenderNodeOptions) => React.ReactNode;
  draggedItem: DragItem | null;
  setDraggedItem: (item: DragItem | null) => void;
  dragOverTarget: DropPosition | null;
  setDragOverTarget: (target: DropPosition | null) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  nodes,
  depth,
  isOpen,
  openNodes,
  selectedId,
  selectedIds,
  onToggle,
  onSelect,
  onDrop,
  canDrop,
  renderNode,
  draggedItem,
  setDraggedItem,
  dragOverTarget,
  setDragOverTarget
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const children = getChildren(nodes, node.id);
  const hasChildren = children.length > 0;
  const isDragging = draggedItem?.id === node.id;

  const handleDragStart = (e: React.DragEvent) => {
    const dragItem: DragItem = {
      id: node.id,
      type: 'tree-node',
      node
    };

    setDraggedItem(dragItem);
    e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggedItem || draggedItem.id === node.id) return;

    e.preventDefault();
    e.stopPropagation();

    // Calculate drop position based on mouse position
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseY = e.clientY - rect.top;
    const nodeHeight = rect.height;
    const threshold = 0.25;

    let position: 'before' | 'after' | 'inside';

    if (mouseY < nodeHeight * threshold) {
      position = 'before';
    } else if (mouseY > nodeHeight * (1 - threshold)) {
      position = 'after';
    } else {
      position = 'inside';
    }

    // Validate drop position
    const targetNode = position === 'inside' ? node : null;
    const canDropHere = canDrop
      ? canDrop(draggedItem.node, targetNode)
      : canDropDefault(nodes, draggedItem.node, targetNode);

    if (!canDropHere) {
      return;
    }

    // Can only drop inside droppable nodes
    if (position === 'inside' && !node.droppable) {
      position = 'after';
    }

    const dropTarget: DropPosition = {
      targetId: node.id,
      position,
      parentId: position === 'inside' ? node.id : node.parent
    };

    setDragOverTarget(dropTarget);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving this node (not entering a child)
    if (nodeRef.current && !nodeRef.current.contains(e.relatedTarget as Node)) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem || !dragOverTarget || dragOverTarget.targetId !== node.id) return;

    onDrop(draggedItem.id, dragOverTarget.targetId, dragOverTarget.position);
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleClick = () => {
    // Keyboard activation (no mouse event) — treat as single select
    onSelect?.(node.id);
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(node.id, e);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(node.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Determine if this node is a drop target
  const isDropTarget = dragOverTarget?.targetId === node.id;
  const dropPosition = dragOverTarget?.position;

  // Calculate background color
  let backgroundColor = 'transparent';
  let borderRadius = '0px';
  // Compute effective selection: prefer multi-selection when provided
  const effectiveIsSelected = selectedIds ? selectedIds.has(node.id) : (selectedId === node.id);
  if (effectiveIsSelected) {
    backgroundColor = '#e3f2fd';
    borderRadius = '4px';
  } else if (isDropTarget && dropPosition === 'inside') {
    backgroundColor = '#f3e5f5';
    borderRadius = '4px';
  }

  // Render options for custom renderer
  const renderOptions: RenderNodeOptions = {
    depth,
    isOpen,
    isDragging,
    isDropTarget,
    hasChildren,
    isSelected: effectiveIsSelected
  };

  return (
    <>
      {/* Drop indicator before */}
      {isDropTarget && dropPosition === 'before' && (
        <div
          style={{
            height: '2px',
            backgroundColor: '#3b82f6',
            marginLeft: `${depth * 16}px`,
            marginBottom: '1px'
          }}
        />
      )}

      <div
        ref={nodeRef}
        role="treeitem"
        tabIndex={0}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
  onClick={handleMouseClick}
        onKeyDown={handleKeyDown}
  aria-selected={effectiveIsSelected}
        aria-expanded={hasChildren ? isOpen : undefined}
        style={{
          paddingLeft: `${depth * 16}px`,
          padding: '2px 0px',
          cursor: 'pointer',
          opacity: isDragging ? 0.5 : 1,
          backgroundColor,
          borderRadius,
          border: isDropTarget && dropPosition === 'inside' ? '1px dashed #9c27b0' : 'none',
          userSelect: 'none',
          outline: 'none'
        }}
      >
        {renderNode ? (
          renderNode(node, renderOptions)
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {hasChildren && (
              <button
                onClick={handleToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isOpen ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <span style={{ width: '16px' }} />}
            <span>{node.text}</span>
          </div>
        )}
      </div>

      {/* Drop indicator after */}
      {isDropTarget && dropPosition === 'after' && (
        <div
          style={{
            height: '2px',
            backgroundColor: '#3b82f6',
            marginLeft: `${depth * 16}px`,
            marginTop: '1px',
            marginBottom: '1px'
          }}
        />
      )}

      {/* Render children */}
      {isOpen && hasChildren && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              nodes={nodes}
              depth={depth + 1}
              isOpen={openNodes.has(child.id)}
              isSelected={selectedId === child.id}
              openNodes={openNodes}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onDrop={onDrop}
              canDrop={canDrop}
              renderNode={renderNode}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
              dragOverTarget={dragOverTarget}
              setDragOverTarget={setDragOverTarget}
            />
          ))}
        </div>
      )}
    </>
  );
};
