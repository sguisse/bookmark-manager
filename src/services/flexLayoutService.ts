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
        tabSetEnableClose: false,
        tabSetEnableDrop: true,
        tabSetEnableDrag: true,
        tabEnableClose: false,
        tabEnableRename: true,
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
                name: "Welcome tab",
                component: "Welcome",
                config: {
                  component: "Welcome",
                  "color": "#ff0000",
                  "fontSize": "16px"
                }
              },
              {
                type: "tab",
                name: "Markdown tab",
                component: "Markdown",
                config: {
                  component: "Markdown",
                  "color": "#00ff00",
                  "content": "# Markdown Content",
                }
              },
              {
                type: "tab",
                name: "Bookmarks tab",
                component: "Bookmarks",
                config: {
                  component: "Bookmarks",
                  "color": "#00ff00",
                  "bookmarks": [
                    {
                      "id": "bm-1",
                      "title": "Vite 01",
                      "url": "https://vitejs.dev",
                      "description": "Next generation frontend tooling",
                      "tags": ["dev", "tooling"],
                      "createdAt": "2025-08-21T00:00:00.000Z",
                      "updatedAt": "2025-08-21T00:00:00.000Z",
                      "favicon": "https://vitejs.dev/logo.svg",
                      "category": "tools"
                    },
                    {
                      "id": "bm-2",
                      "title": "Vite 0",
                      "url": "https://vitejs.dev",
                      "description": "Next generation frontend tooling 02",
                      "tags": ["dev", "tooling"],
                      "createdAt": "2025-08-21T00:00:00.000Z",
                      "updatedAt": "2025-08-21T00:00:00.000Z",
                      "favicon": "https://vitejs.dev/logo.svg",
                      "category": "tools"
                    }
                  ],
                  "collapsed": false
                }
              }
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
