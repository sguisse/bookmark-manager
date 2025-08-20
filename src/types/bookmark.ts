import { FlexTabConfig } from "./flexTab";

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  favicon?: string;
  category?: string;
}


export interface BookmarksTabConfig extends FlexTabConfig {
  bookmarks: Bookmark[];
  collapsed?: boolean;
}


export interface BookmarkFormData {
  title: string;
  url: string;
  description: string;
  tags: string[];
  groupId: string;
}

export type BookmarkInput = {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  category?: string;
};
