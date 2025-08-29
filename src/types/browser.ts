import { BaseAuditing } from "./app";

export interface BrowserBookmarkNode extends BaseAuditing {
  id: string;
  title: string;
  url?: string;
  isFolder: boolean;
  children?: BrowserBookmarkNode[];
  addDate?: number | null;
  lastModified?: number | null;
  icon?: string | null;
  description?: string | null;
  attributes?: Record<string, string>;
  order?: number;
  path?: string[]; // optional
  isExpanded?: boolean;
}

export interface BrowserFavorites extends BaseAuditing {
  id: string;
  filePath: string;
  bookmarksTree: BrowserBookmarkNode[];
}

export interface BrowserFavoritesFormData {
  filePath: string;
  bookmarksTree: BrowserBookmarkNode[];
}
