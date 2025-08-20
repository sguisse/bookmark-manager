export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  favicon?: string;
}

export interface BookmarkGroup {
  id: string;
  title: string;
  color: string;
  bookmarks: Bookmark[];
  collapsed?: boolean;
}

export interface BookmarkConfig {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  groups: BookmarkGroup[];
  layoutConfig?: any;
}

export interface BookmarkFormData {
  title: string;
  url: string;
  description: string;
  tags: string[];
  groupId: string;
}
