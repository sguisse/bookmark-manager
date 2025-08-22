import { BaseAuditing } from "./app";

export interface FlexTabConfig extends BaseAuditing {
  id: string;
  title: string;
  color?: string;
  bgcolor?: string;
  icon?: string;
  component: FlexTabComponent;
}

// add enum for component types

export enum FlexTabComponent {
  Bookmarks = "bookmarks",
  Markdown = "markdown",
  Html = "html",
  Welcome = "welcome",
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
