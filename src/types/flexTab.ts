import { BaseAuditing } from "./app";

export interface FlexLayoutTabConfig extends BaseAuditing {
  id: string;
  title: string;
  color?: string;
  bgColor?: string;
  markColor?: string;
  tabBgColor?: string;
  icon?: string;
  component: FlexLayoutTabComponent;
}

export enum FlexLayoutTabComponent {
  Bookmarks = "bookmarks",
  Markdown = "markdown",
  Web = "web",
  Html = "html",
  BrowserFavorites = "browser_favorites",
  // add more as needed
}

export interface FlexLayoutTabFormData extends BaseAuditing {
  id: string;
  title?: string;
  color?: string;
  bgColor?: string;
  markColor?: string;
  tabBgColor?: string;
  icon?: string;
  component?: FlexLayoutTabComponent;
}
