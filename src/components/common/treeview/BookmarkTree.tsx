import React from 'react';
import { TreeNode } from './types';

export const DragHandle: React.FC<{ onDragStart?: (e: React.DragEvent) => void; onDragEnd?: (e: React.DragEvent) => void; children?: React.ReactNode }> = ({ onDragStart, onDragEnd, children }) => {
  return (
    <button
      type="button"
      aria-label="drag-handle"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ width: 16, height: 16, marginRight: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', flex: '0 0 16px', background: 'none', border: 'none', padding: 0 }}
    >
      {children ?? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="5" cy="5" r="1.5" fill="currentColor" />
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="5" cy="19" r="1.5" fill="currentColor" />
          <circle cx="12" cy="5" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="19" r="1.5" fill="currentColor" />
        </svg>
      )}
    </button>
  );
};

const BookmarkTree: React.FC<{ nodes: TreeNode[]; renderRow: (node: TreeNode) => React.ReactNode }> = ({ nodes, renderRow }) => {
  return (
    <div>
      {nodes.map(n => (
        <div key={n.id} style={{ display: 'flex', alignItems: 'center' }}>
          {renderRow(n)}
        </div>
      ))}
    </div>
  );
};

export default BookmarkTree;
