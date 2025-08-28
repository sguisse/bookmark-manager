import { Badge, BaseAuditing } from './app';

export interface SidebarConfig extends BaseAuditing {
  // id of the last selected item in the sidebar
  lastSelectedItemId: string | null;
  // all items use unified SidebarItem interface
  sidebarItems: SidebarItem[];

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

export interface SidebarItem extends BaseAuditing {
  id: string;
  // Imply style and behavior of the item
  type: SidebarItemType;

  title: string;
  icon?: string;
  color?: string;
  bgColor?: string;

  // This is the reference of flexLayout configuration to be rendered when this item is selected
  flexLayoutId: string;

  // Indicates if the item is expanded to show its children (if any)
  expanded?: boolean;

  tags?: string[];
  badge?: Badge;

  children?: SidebarItem[];
}
