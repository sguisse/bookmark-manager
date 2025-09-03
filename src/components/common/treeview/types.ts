export interface TreeNode {
  id: string;
  parent: string | null;
  text: string;
  icon?: string;
  droppable?: boolean;
  data?: any;
}

export interface TreeProps {
  nodes: TreeNode[];
  rootId: string | null;
  /** Single selected id (backwards-compatible) */
  selectedId?: string | null;
  /** Multi-selection set (preferred when using multi-select) */
  selectedIds?: Set<string>;
  onDrop: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  /** onSelect receives the clicked node id and optional mouse event (for multi-select modifiers) */
  onSelect?: (nodeId: string, e?: React.MouseEvent) => void;
  onToggle?: (nodeId: string) => void;
  renderNode?: (node: TreeNode, options: RenderNodeOptions) => React.ReactNode;
  canDrop?: (draggedNode: TreeNode, targetNode: TreeNode | null) => boolean;
  openNodes?: Set<string>;
  className?: string;
}

export interface RenderNodeOptions {
  depth: number;
  isOpen: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  hasChildren: boolean;
  isSelected: boolean;
}

export interface DragItem {
  id: string;
  type: string;
  node: TreeNode;
}

export interface DropPosition {
  targetId: string;
  position: 'before' | 'after' | 'inside';
  parentId: string | null;
}
