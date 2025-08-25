import { BaseAuditing } from "./app";
import { FlexLayoutTabConfig } from "./flexTab";

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


export interface BookmarksTabConfig extends FlexLayoutTabConfig {
  bookmarks: Bookmark[];
  viewMode?: 'card' | 'row';
}


export interface BookmarkFormData {
  title: string;
  color?: string;
  icon?: string;
  url: string;
  description?: string;
  tags?: string[];
}
