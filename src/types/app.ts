import { SidebarItem } from "./sidebar";

export interface ApplicationConfig {
  lastSelectedMenuItem: SidebarItem;
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
  title?: string;
  icon?: string;
  color?: string;
  // background color for the badge
  bgColor?: string;
}
