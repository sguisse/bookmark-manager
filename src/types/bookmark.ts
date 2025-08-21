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
  collapsed?: boolean;
}


export interface BookmarksTabConfig extends FlexTabConfig {
  bookmarks: Bookmark[];
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
