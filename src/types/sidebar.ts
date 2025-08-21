export interface SidebarConfig {
  lastSelectedItemId: string | null;
  menuItems: SidebarMenuItem[];
  creationDate: Date | null;
  lastUpdateDate: Date | null;
}

export interface SidebarMenuItem {
  id: string;
  title: string;
  icon?: string;
  flexLayoutId?: string;
  children?: SidebarMenuItem[];
}
