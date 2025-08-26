import { Badge } from './app';

export interface SidebarConfig {
  lastSelectedItemId: string | null;
  // all items use unified SidebarItem interface
  sidebarItems: SidebarItem[];
  creationDate: Date | null;
  lastUpdateDate: Date | null;
  viewMode?: SidebarViewMode;
  // optional footer items rendered at the bottom of the sidebar
  footerItems?: SidebarItem[];
}

export enum SidebarViewMode {
  Visible = 'visible',
  OnlyIcons = 'only-icons',
  Hidden = 'hidden'
}

export enum SidebarItemType {
  Category = 'category',
  MenuGroup = 'menu-group',
  MenuItem = 'menu-item'
}

export interface SidebarItem {
  id: string;
  title: string;
  icon?: string;
  type: SidebarItemType;

  // For Categories and MenuGroups
  children?: SidebarItem[];
  expanded?: boolean;

  // For MenuItems - flexLayoutId reference
  flexLayoutId?: string;
  // For MenuItems - optional badge display
  badge?: Badge;
}

// Type aliases for backward compatibility and clarity
export type SidebarCategory = SidebarItem & { type: SidebarItemType.Category };
export type SidebarMenuGroup = SidebarItem & { type: SidebarItemType.MenuGroup };
export type SidebarMenuItem = SidebarItem & { type: SidebarItemType.MenuItem };
