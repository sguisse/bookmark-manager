export interface SidebarConfig {
  lastSelectedItemId: string | null;
  menuItems: SidebarMenuItem[];
  lastUpdateDate: string | null;
}

export interface SidebarMenuItem {
  id: string;
  title: string;
  icon?: string;
  flexLayoutId?: string;
  children?: SidebarMenuItem[];
}
