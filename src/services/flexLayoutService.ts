import { IJsonModel } from 'flexlayout-react';

export type FlexLayoutConfig = IJsonModel;

export class FlexLayoutService {

  static readonly STORAGE_KEY_PREFIX = 'app-fusion-flexlayout-{MENU_ITEM_ID}';

  /**
   * Get default FlexLayout configuration
   */
  static getDefaultConfig(): FlexLayoutConfig {
    return {
      global: {
        tabSetEnableClose: true,
        tabSetEnableMaximize: true,
        tabSetEnableDrop: true,
        tabSetEnableDrag: true,
        tabEnableClose: true,
        tabEnableRename: false,
        tabSetMinWidth: 250,
        tabSetMinHeight: 200,
      },
      borders: [],
      layout: {
        type: "row",
        weight: 100,
        children: [
          {
            type: "tabset",
            weight: 100,
            children: [
              {
                type: "tab",
                name: "Bookmarks tab",
                component: "Bookmarks",
                config: {
                  component: "Bookmarks",
                  "title": "Bookmarks tab",
                  "bgcolor": "#2d76eb",
                  "createdDate": "2025-08-21T00:00:00.000Z",
                  "createdBy": "user-1",
                  "lastModifiedDate": "2025-08-22T10:00:00.000Z",
                  "lastModifiedBy": "user-2",
                  "bookmarks": [
                    {
                      "id": "bm-1",
                      "title": "Vite 01",
                      "icon": "https://vitejs.dev/logo.svg",
                      "url": "https://vitejs.dev",
                      "description": "Next generation frontend tooling",
                      "tags": ["dev", "tooling"],
                      "createdDate": "2025-08-21T00:00:00.000Z",
                      "createdBy": "user-1",
                      "lastModifiedDate": "2025-08-22T10:00:00.000Z",
                      "lastModifiedBy": "user-2"
                    },
                    {
                      "id": "bm-2",
                      "title": "Google",
                      "color": "#4285F4",
                      "icon": "https://www.google.com/favicon.ico",
                      "url": "https://www.google.com",
                      "description": "Search the world's information",
                      "tags": ["search", "tooling"],
                      "createdDate": "2025-08-21T00:00:00.000Z",
                      "createdBy": "user-3",
                      "lastModifiedDate": "2025-08-22T08:00:00.000Z",
                      "lastModifiedBy": "user-4"
                    },
                    {
                      "id": "bm-3",
                      "title": "Flexlayout React",
                      "color": "#f46e42ff",
                      "icon": "🔥",
                      "url": "https://www.npmjs.com/package/flexlayout-react",
                      "description": "Build the future of web applications",
                      "tags": ["component", "react"],
                      "createdDate": "2025-08-21T00:00:00.000Z",
                      "createdBy": "user-5",
                      "lastModifiedDate": "2025-08-22T09:00:00.000Z",
                      "lastModifiedBy": "user-6"
                    }
                  ]
                }
              },
              {
                type: "tab",
                name: "Markdown tab",
                component: "Markdown",
                config: {
                  component: "Markdown",
                  "title": "Markdown tab",
                  "color": "#ff0000",
                  "fontSize": "16px",
                  "content": "### Welcome to this application",
                  "createdDate": "2025-08-21T00:00:00.000Z",
                  "createdBy": "user-1",
                  "lastModifiedDate": "2025-08-22T10:00:00.000Z",
                  "lastModifiedBy": "user-2"
                }
              },
              {
                type: "tab",
                name: "Web tab",
                component: "Web",
                config: {
                  "component": "Web",
                  "title": "Web tab",
                  "color": "#00ff00",
                  "url": "https://www.google.com",
                  "icon": "https://www.google.com/favicon.ico",
                  "createdDate": "2025-08-21T00:00:00.000Z",
                  "createdBy": "user-1",
                  "lastModifiedDate": "2025-08-22T10:00:00.000Z",
                  "lastModifiedBy": "user-2"
                }
              },
            ]
          }
        ]
      }
    };
  }

  // Load FlexLayout configuration from local storage for the selected menu item
  static loadConfig(menuItemId: string): FlexLayoutConfig | null {
    const config = localStorage.getItem(FlexLayoutService.STORAGE_KEY_PREFIX.replace('{MENU_ITEM_ID}', menuItemId));
    if (config) {
      try {
        let parsedConfig = JSON.parse(config);
        return parsedConfig;
      } catch (error) {
        console.error("Failed to parse flex layout config:", error);
      }
    }
    return FlexLayoutService.getDefaultConfig();
  }

  // Save FlexLayout configuration to local storage for the selected menu item
  static saveConfig(menuItemId: string, config: FlexLayoutConfig): void {
    const configString = JSON.stringify(config);
    localStorage.setItem(FlexLayoutService.STORAGE_KEY_PREFIX.replace('{MENU_ITEM_ID}', menuItemId), configString);
  }

  /**
   * Validate FlexLayout configuration structure
   */
  static isValidConfig(config: any): config is FlexLayoutConfig {
    if (!config || typeof config !== 'object') return false;
    if (!config.global || !config.layout) return false;
    return true;
  }


}
