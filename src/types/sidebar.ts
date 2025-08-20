export interface SidebarConfig {
  menuItems: MenuItem[];
}

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  flexLayoutId?: string;
  children?: MenuItem[];
}
