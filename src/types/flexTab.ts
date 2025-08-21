export interface FlexTabConfig {
  id: string;
  title: string;
  color?: string;
  bgcolor?: string;
  icon?: string;
  component: FlexTabComponent;
  creationDate?: Date;
  lastUpdateDate?: Date;
}

// add enum for component types

export enum FlexTabComponent {
  Bookmarks = "bookmarks",
  Markdown = "markdown",
  Html = "html",
  Welcome = "welcome",
  // add more as needed
}

export interface FlexTabFormData {
  id: string;
  title?: string;
  color?: string;
  bgcolor?: string;
  icon?: string;
  component?: FlexTabComponent;
  creationDate?: Date;
  lastUpdateDate?: Date;
}
