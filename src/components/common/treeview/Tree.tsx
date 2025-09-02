import React, { useState } from 'react';
import { TreeProps } from './types';
import { getChildren } from './utils';

// Minimal Tree implementation used by the UI. We intentionally keep the API
// small to avoid unused prop warnings for now.
const Tree: React.FC<Pick<TreeProps, 'nodes' | 'rootId' | 'renderNode' | 'selectedId' | 'className'>> = ({ nodes, rootId = null, renderNode, selectedId, className }) => {
  const [openNodes] = useState<Set<string>>(new Set<string>());

  const renderBranch = (list: typeof nodes, parentId: string | null, depth = 0) => {
    const children = getChildren(list, parentId);
    return (
      <div>
        {children.map((n) => (
          <div key={n.id}>
            {renderNode ? renderNode(n, {
              depth,
              isOpen: openNodes.has(n.id),
              isDragging: false,
              isDropTarget: false,
              hasChildren: getChildren(list, n.id).length > 0,
              isSelected: selectedId === n.id
            }) : <div style={{ paddingLeft: depth * 16 }}>{n.text}</div>}
            {openNodes.has(n.id) && renderBranch(list, n.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className} role="tree">
      {renderBranch(nodes, rootId, 0)}
    </div>
  );
};

export default Tree;
