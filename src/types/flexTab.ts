import { BaseAuditing } from "./app";

export interface FlexTabConfig extends BaseAuditing {
  id: string;
  title: string;
  color?: string;
  bgcolor?: string;
  icon?: string;
  component: FlexTabComponent;
}

export enum FlexTabComponent {
  Bookmarks = "bookmarks",
  Markdown = "markdown",
  Web = "web",
  Html = "html",
  // add more as needed
}

export interface FlexTabFormData extends BaseAuditing {
  id: string;
  title?: string;
  color?: string;
  bgcolor?: string;
  icon?: string;
  component?: FlexTabComponent;
}
