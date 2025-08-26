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
  selectedId?: string | null;
  onDrop: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  onSelect?: (nodeId: string) => void;
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
