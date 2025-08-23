import { FlexTabConfig } from "./flexTab";

export interface MarkdownTabConfig extends FlexTabConfig {
  content: string;
}

export interface MarkdownTabFormData {
  content?: string;
}
