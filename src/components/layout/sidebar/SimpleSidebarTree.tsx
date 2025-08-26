import React, { useState, useEffect } from 'react';
import { TreeView, useTree, RenderNodeOptions } from '../../common/treeview';
import { TreeNode } from '../../common/treeview/types';
import { convertSidebarToTreeNodes, convertTreeNodesToSidebar } from './sidebarAdapter';
import { SidebarConfig, SidebarItemType } from '../../../types/sidebar';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';

interface SimpleSidebarTreeProps {
  sidebarConfig?: SidebarConfig;
  onSidebarChange?: (newConfig: SidebarConfig) => void;
  onSelectItem?: (nodeId: string) => void;
  onEditItem?: (nodeId: string) => void;
  onDeleteItem?: (nodeId: string) => void;
}

export const SimpleSidebarTree: React.FC<SimpleSidebarTreeProps> = ({
  sidebarConfig,
  onSidebarChange,
  onSelectItem,
  onEditItem,
  onDeleteItem
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Convert sidebar config to tree nodes
  const initialNodes = sidebarConfig ? convertSidebarToTreeNodes(sidebarConfig) : [];

  // Extract initially expanded nodes from sidebar config
  const getInitialExpandedNodes = (): string[] => {
    const expandedIds: string[] = [];
    const traverse = (items: any[]) => {
      items.forEach(item => {
        if (item.expanded) {
          expandedIds.push(item.id);
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    if (sidebarConfig?.sidebarItems) {
      traverse(sidebarConfig.sidebarItems);
    }
    return expandedIds;
  };

  // Initialize tree state
  const {
    nodes,
    openNodes,
    selectedId,
    toggleNode,
    selectNode,
    moveItem,
    setNodes
  } = useTree({
    nodes: initialNodes,
    initialOpenNodes: getInitialExpandedNodes(),
    initialSelectedId: sidebarConfig?.lastSelectedItemId || null
  });

  // Update nodes when sidebar config changes
  useEffect(() => {
    if (sidebarConfig) {
      const updatedNodes = convertSidebarToTreeNodes(sidebarConfig);

      // Check if there are new nodes compared to current nodes
      const currentNodeIds = new Set(nodes.map(node => node.id));
      const newNodes = updatedNodes.filter(node => !currentNodeIds.has(node.id));

      // Update the tree nodes
      setNodes(updatedNodes);

      // If there's a new node, select it by default
      if (newNodes.length > 0) {
        const newestNode = newNodes[newNodes.length - 1]; // Select the last added node
        selectNode(newestNode.id);
        onSelectItem?.(newestNode.id);
      }
    }
  }, [sidebarConfig, setNodes, nodes, selectNode, onSelectItem]);

  // Handle drop operations
  const handleDrop = (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    console.log('Drop:', { draggedId, targetId, position });

    // Move the item and get the updated nodes
    const updatedNodes = moveItem(draggedId, targetId, position);

    // Convert back to sidebar config and notify parent with the fresh data
    if (onSidebarChange && updatedNodes) {
      const newConfig = convertTreeNodesToSidebar(updatedNodes);
      onSidebarChange(newConfig);
    }
  };

  // Handle selection
  const handleSelect = (nodeId: string) => {
    selectNode(nodeId);
    onSelectItem?.(nodeId);
  };

  // Handle toggle operations (expand/collapse) with config persistence
  const handleToggle = (nodeId: string) => {
    // Toggle the node in the tree state
    toggleNode(nodeId);

    // Save the expanded state to the sidebar config
    if (onSidebarChange && sidebarConfig) {
      const isCurrentlyOpen = openNodes.has(nodeId);
      const newExpandedState = !isCurrentlyOpen;

      // Update the sidebar config with the new expanded state
      const updateExpandedState = (items: any[]): any[] => {
        return items.map(item => {
          if (item.id === nodeId) {
            return { ...item, expanded: newExpandedState };
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateExpandedState(item.children) };
          }
          return item;
        });
      };

      const updatedConfig = {
        ...sidebarConfig,
        sidebarItems: updateExpandedState(sidebarConfig.sidebarItems),
        lastUpdateDate: new Date()
      };

      onSidebarChange(updatedConfig);
    }
  };

  // Handle delete operations with confirmation
  const handleDelete = (nodeId: string) => {
    if (onDeleteItem) {
      const confirmDelete = window.confirm('Are you sure you want to delete this item and all its children?');
      if (confirmDelete) {
        onDeleteItem(nodeId);
      }
    }
  };

  // Handle edit operations
  const handleEdit = (nodeId: string) => {
    if (onEditItem) {
      onEditItem(nodeId);
    }
  };

  // Custom node renderer
  const renderNode = (node: TreeNode, options: RenderNodeOptions) => {
    const { isOpen, isDragging, hasChildren, isSelected } = options;
    const nodeType = node.data?.type;
    const isHovered = hoveredNodeId === node.id;

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
          letterSpacing: nodeType === SidebarItemType.Category ? '0.05em' : 'normal',
          position: 'relative',
          padding: '4px 8px',
          margin: '1px 0',
          borderRadius: '4px'
        }}
        onMouseEnter={() => setHoveredNodeId(node.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
      >
        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(node.id);
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

        {/* Hover Actions */}
        {isHovered && (
          <div style={{
            display: 'flex',
            gap: '4px',
            marginLeft: '8px'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(node.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                color: '#666'
              }}
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(node.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                color: '#d32f2f'
              }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Custom validation for drops
  const canDrop = (draggedNode: TreeNode, targetNode: TreeNode | null): boolean => {
    const draggedType = draggedNode.data?.type;
    const targetType = targetNode?.data?.type;

    /*
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
    */

    return true;
  };

  return (

      <div style={{ padding: '2px' }}>
        <TreeView
          nodes={nodes}
          rootId={null}
          selectedId={selectedId}
          openNodes={openNodes}
          onDrop={handleDrop}
          onSelect={handleSelect}
          onToggle={handleToggle}
          renderNode={renderNode}
          canDrop={canDrop}
          className="sidebar-tree"
        />
      </div>
  );
};
