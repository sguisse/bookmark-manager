import { TreeNode } from './types';
import { SidebarConfig, SidebarCategory, SidebarMenuGroup, SidebarMenuItem, SidebarItemType } from '../../../types/sidebar';

/**
 * Convert nested sidebar structure to flat TreeNode array
 */
export const convertSidebarToTreeNodes = (sidebarConfig: SidebarConfig): TreeNode[] => {
  const nodes: TreeNode[] = [];

  const processNode = (item: SidebarCategory | SidebarMenuGroup | SidebarMenuItem, parentId: string | null) => {
    const node: TreeNode = {
      id: item.id,
      parent: parentId,
      text: item.title,
      icon: item.icon,
      droppable: item.type === SidebarItemType.Category || item.type === SidebarItemType.MenuGroup,
      data: {
        type: item.type,
        badge: 'badge' in item ? item.badge : undefined
      }
    };

    nodes.push(node);

    // Process children
    if ('children' in item && item.children) {
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

  const buildHierarchy = (nodeId: string): SidebarCategory | SidebarMenuGroup | SidebarMenuItem => {
    const node = nodeMap.get(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    const children = nodes.filter(n => n.parent === nodeId);
    const baseItem = {
      id: node.id,
      title: node.text,
      icon: node.icon
    };

    if (node.data?.type === SidebarItemType.Category) {
      return {
        ...baseItem,
        type: SidebarItemType.Category,
        children: children.map(child => buildHierarchy(child.id)) as (SidebarMenuGroup | SidebarMenuItem)[]
      } as SidebarCategory;
    } else if (node.data?.type === SidebarItemType.MenuGroup) {
      return {
        ...baseItem,
        type: SidebarItemType.MenuGroup,
        children: children.map(child => buildHierarchy(child.id)) as SidebarMenuItem[],
        badge: node.data?.badge,
        expanded: false
      } as SidebarMenuGroup;
    } else {
      return {
        ...baseItem,
        type: SidebarItemType.MenuItem,
        badge: node.data?.badge
      } as SidebarMenuItem;
    }
  };

  return {
    sidebarItems: rootNodes.map(node => buildHierarchy(node.id)) as SidebarCategory[],
    lastSelectedItemId: '',
    creationDate: new Date(),
    lastUpdateDate: new Date()
  };
};
