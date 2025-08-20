export interface SidebarConfig {
  lastSelectedItemId: string | null;
  menuItems: MenuItem[];
  lastUpdateDate: string | null;
}

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  flexLayoutId?: string;
  children?: MenuItem[];
}
