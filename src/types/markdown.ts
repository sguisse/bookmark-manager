import { FlexLayoutTabConfig } from "./flexTab";

export interface MarkdownTabConfig extends FlexLayoutTabConfig {
  content: string;
}

export interface MarkdownTabFormData {
  content?: string;
}
