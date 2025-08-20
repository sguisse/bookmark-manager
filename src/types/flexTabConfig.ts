export interface FlexTabConfig {
  id: string;
  title: string;
  color: string;
  component: FlexTabComponent;
}

// add enum for component types

export enum FlexTabComponent {
  Bookmarks = "bookmarks",
  Markdown = "markdown",
  // add more as needed
}
