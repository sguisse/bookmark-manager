import { BaseAuditing } from "./app";
import { FlexTabConfig } from "./flexTab";

export interface Bookmark extends BaseAuditing {
  id: string;
  title: string;
  color?: string;
  icon?: string;
  url: string;
  description?: string;
  tags?: string[];
  collapsed?: boolean;
}


export interface BookmarksTabConfig extends FlexTabConfig {
  bookmarks: Bookmark[];
}


export interface BookmarkFormData {
  title: string;
  color?: string;
  icon?: string;
  url: string;
  description?: string;
  tags?: string[];
}

export type BookmarkInput = {
  title: string;
  color?: string;
  icon?: string;
  url: string;
  description?: string;
  tags?: string[];
};
