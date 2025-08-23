import { FlexLayoutTabConfig } from './flexTab';

export interface WebTabConfig extends FlexLayoutTabConfig {
  url?: string;
}

export interface WebTabFormData {
  url?: string;
}
