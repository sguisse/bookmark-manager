import React from 'react';
import { TreeView, useTree, RenderNodeOptions } from './';
import { TreeNode } from './types';
import { convertSidebarToTreeNodes, convertTreeNodesToSidebar } from './sidebarAdapter';
import { SidebarConfig, SidebarItemType } from '../../../types/sidebar';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SimpleSidebarTreeProps {
  sidebarConfig?: SidebarConfig;
  onSidebarChange?: (newConfig: SidebarConfig) => void;
  onSelectItem?: (nodeId: string) => void;
}

export const SimpleSidebarTree: React.FC<SimpleSidebarTreeProps> = ({
  sidebarConfig,
  onSidebarChange,
  onSelectItem
}) => {
  // Convert sidebar config to tree nodes
  const initialNodes = sidebarConfig ? convertSidebarToTreeNodes(sidebarConfig) : [];

  // Initialize tree state
  const {
    nodes,
    openNodes,
    selectedId,
    toggleNode,
    selectNode,
    moveItem
  } = useTree({
    nodes: initialNodes,
    initialOpenNodes: [], // Start with all collapsed
    initialSelectedId: null
  });

  // Handle drop operations
  const handleDrop = (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    console.log('Drop:', { draggedId, targetId, position });
    moveItem(draggedId, targetId, position);

    // Convert back to sidebar config and notify parent
    if (onSidebarChange) {
      const newConfig = convertTreeNodesToSidebar(nodes);
      onSidebarChange(newConfig);
    }
  };

  // Handle selection
  const handleSelect = (nodeId: string) => {
    selectNode(nodeId);
    onSelectItem?.(nodeId);
  };

  // Custom node renderer
  const renderNode = (node: TreeNode, options: RenderNodeOptions) => {
    const { isOpen, isDragging, hasChildren, isSelected } = options;
    const nodeType = node.data?.type;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isDragging ? 0.5 : 1,
          fontWeight: nodeType === SidebarItemType.Category ? 'bold' : 'normal',
          fontSize: nodeType === SidebarItemType.Category ? '12px' : '14px',
          textTransform: nodeType === SidebarItemType.Category ? 'uppercase' : 'none',
          letterSpacing: nodeType === SidebarItemType.Category ? '0.05em' : 'normal'
        }}
      >
        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        )}

        {/* Spacer for nodes without children */}
        {!hasChildren && <span style={{ width: '16px' }} />}

        {/* Icon */}
        {node.icon && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {node.icon.startsWith('http') ? (
              <img
                src={node.icon}
                alt=""
                style={{ width: 16, height: 16, objectFit: 'contain' }}
              />
            ) : (
              <DynamicIcon name={node.icon as any} size={16} />
            )}
          </div>
        )}

        {/* Text */}
        <span
          style={{
            flex: 1,
            color: isSelected ? '#1976d2' : 'inherit'
          }}
        >
          {node.text}
        </span>

        {/* Badge */}
        {node.data?.badge && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 6px',
              borderRadius: '999px',
              background: node.data.badge.color || '#3399ff',
              color: '#fff',
              fontSize: '10px',
              marginLeft: '8px'
            }}
          >
            {node.data.badge.label}
          </span>
        )}
      </div>
    );
  };

  // Custom validation for drops
  const canDrop = (draggedNode: TreeNode, targetNode: TreeNode | null): boolean => {
    const draggedType = draggedNode.data?.type;
    const targetType = targetNode?.data?.type;

    // Categories can only be dropped at root level or after other categories
    if (draggedType === SidebarItemType.Category) {
      return !targetNode || targetType === SidebarItemType.Category;
    }

    // MenuGroups can be dropped in Categories or after other MenuGroups
    if (draggedType === SidebarItemType.MenuGroup) {
      return !targetNode ||
             targetType === SidebarItemType.Category ||
             targetType === SidebarItemType.MenuGroup;
    }

    // MenuItems can be dropped anywhere
    if (draggedType === SidebarItemType.MenuItem) {
      return true;
    }

    return false;
  };

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#fafafa',
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#fff',
        fontWeight: 'bold'
      }}>
        Sidebar Tree Structure
      </div>
      <div style={{ padding: '8px' }}>
        <TreeView
          nodes={nodes}
          rootId={null}
          selectedId={selectedId}
          openNodes={openNodes}
          onDrop={handleDrop}
          onSelect={handleSelect}
          onToggle={toggleNode}
          renderNode={renderNode}
          canDrop={canDrop}
          className="sidebar-tree"
        />
      </div>
    </div>
  );
};
