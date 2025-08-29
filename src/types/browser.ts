import { BaseAuditing } from "./app";

export interface BrowserFavorites extends BaseAuditing {
  id: string;
  filePath: string;
  nodesOpened: string[]; // array of node ids that are opened/expanded
}

export interface BrowserFavoritesFormData {
  filePath: string;
}
