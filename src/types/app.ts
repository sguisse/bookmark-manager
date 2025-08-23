import { SidebarMenuItem } from "./sidebar";

export interface ApplicationConfig {
  lastSelectedMenuItem: SidebarMenuItem;
}

export enum FormDisplayMode {
  Create = "create",
  Edit = "edit",
  View = "view",
  Delete = "delete"
}

export interface BaseAuditing {
  createdBy?: string;
  createdDate?: Date;
  lastModifiedBy?: string;
  lastModifiedDate?: Date;
}

export interface Badge {
  id: string;
  label: string;
  color?: string;
  // optional icon to display alongside the label
  icon?: string;
}
