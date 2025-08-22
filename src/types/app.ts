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
