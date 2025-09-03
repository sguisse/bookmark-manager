import React, { useState } from 'react';
import { TreeNode } from './TreeNode';
import { TreeProps, DragItem, DropPosition } from './types';
import { getChildren } from './utils';

export const TreeView: React.FC<TreeProps> = ({
  nodes,
  rootId = null,
  selectedId,
  selectedIds,
  onDrop,
  onSelect,
  onToggle,
  renderNode,
  canDrop,
  openNodes = new Set(),
  className = ''
}) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DropPosition | null>(null);

  // Get root nodes
  const rootNodes = getChildren(nodes, rootId);

  return (
    <div
      className={`tree-view ${className}`}
      role="tree"
      style={{
        userSelect: 'none',
        outline: 'none'
      }}
    >
      {rootNodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          nodes={nodes}
          depth={0}
          isOpen={openNodes.has(node.id)}
          isSelected={selectedId === node.id}
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
      {rootNodes.length === 0 && (
        <div style={{ padding: '8px', color: '#666', fontStyle: 'italic' }}>
          No items to display
        </div>
      )}
    </div>
  );
};
