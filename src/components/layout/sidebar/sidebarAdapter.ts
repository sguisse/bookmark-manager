import { TreeNode } from '../../common/treeview/types';
import { SidebarConfig, SidebarItem, SidebarItemType } from '../../../types/sidebar';

/**
 * Convert nested sidebar structure to flat TreeNode array
 */
export const convertSidebarToTreeNodes = (sidebarConfig: SidebarConfig): TreeNode[] => {
  const nodes: TreeNode[] = [];

  const processNode = (item: SidebarItem, parentId: string | null) => {
    const node: TreeNode = {
      id: item.id,
      parent: parentId,
      text: item.title,
      icon: item.icon,
      droppable: item.type === SidebarItemType.Category || item.type === SidebarItemType.MenuGroup,
      data: {
        type: item.type,
        badge: item.badge,
        flexLayoutId: item.flexLayoutId,
        expanded: item.expanded
      }
    };

    nodes.push(node);

    // Process children
    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        processNode(child, item.id);
      });
    }
  };

  sidebarConfig.sidebarItems?.forEach(item => {
    processNode(item, null);
  });

  return nodes;
};

/**
 * Convert flat TreeNode array back to nested sidebar structure
 */
export const convertTreeNodesToSidebar = (nodes: TreeNode[]): SidebarConfig => {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const rootNodes = nodes.filter(node => node.parent === null);

  const buildHierarchy = (nodeId: string): SidebarItem => {
    const node = nodeMap.get(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    const children = nodes.filter(n => n.parent === nodeId);
    const item: SidebarItem = {
      id: node.id,
      title: node.text,
      icon: node.icon,
      type: node.data?.type || SidebarItemType.MenuItem
    };

    // Add children if they exist
    if (children.length > 0) {
      item.children = children.map(child => buildHierarchy(child.id));
    }

    // Add type-specific properties
    if (node.data?.type === SidebarItemType.Category && node.data?.expanded !== undefined) {
      item.expanded = node.data.expanded;
    }

    if (node.data?.type === SidebarItemType.MenuGroup) {
      item.expanded = node.data?.expanded ?? false;
    }

    if (node.data?.type === SidebarItemType.MenuItem) {
      item.flexLayoutId = node.data?.flexLayoutId ?? '';
    }

    if (node.data?.badge) {
      item.badge = node.data.badge;
    }

    return item;
  };

  return {
    sidebarItems: rootNodes.map(node => buildHierarchy(node.id)),
    lastSelectedItemId: '',
    creationDate: new Date(),
    lastUpdateDate: new Date()
  };
};
