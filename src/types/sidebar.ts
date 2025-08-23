import { Badge } from './app';

export interface SidebarConfig {
  lastSelectedItemId: string | null;
  // allow categories, groups or items at top-level
  sidebarItems: Array<SidebarCategory | SidebarMenuGroup | SidebarMenuItem>;
  creationDate: Date | null;
  lastUpdateDate: Date | null;
  viewMode?: SidebarViewMode;
  // allow UI state flags persisted (optional)
  collapsed?: boolean;
  visible?: boolean;
  // optional footer items rendered at the bottom of the sidebar
  footerItems?: BaseSidebarItem[];
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

export interface BaseSidebarItem {
  id: string;
  title: string;
  icon?: string;
  type: SidebarItemType;
}

export interface SidebarCategory extends BaseSidebarItem {
  type: SidebarItemType.Category;
  // categories can contain menu groups or menu items
  children: Array<SidebarMenuGroup | SidebarMenuItem>;

}

export interface SidebarMenuGroup extends BaseSidebarItem {
  type: SidebarItemType.MenuGroup;
  expanded: boolean;
  children: SidebarMenuItem[];
}

export interface SidebarMenuItem extends BaseSidebarItem {
  type: SidebarItemType.MenuItem;
  flexLayoutId: string;
  // optional badge to display alongside the title
  badge?: Badge;
}
