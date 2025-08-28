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
        borderEnableAutoHide: true,
        splitterSize: 3,
        tabSetMinWidth: 20,
        tabSetMinHeight: 50,
      },
      borders: [
        {
          "type": "border",
          "location": "left",
          "children": [	]
        },
        {
          "type": "border",
          "location": "right",
          "children": [	]
        },
        {
          "type": "border",
          "location": "top",
          "children": [	]
        },
        {
          "type": "border",
          "location": "bottom",
          "children": [	]
        },
      ],
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
                id: "b17563f4-d8c3-4c88-9bbc-54302807c6e9",
                name: "Markdown tab",
                component: "Markdown",
                config: {
                  id: "b17563f4-d8c3-4c88-9bbc-54302807c6e9",
                  component: "Markdown",
                  "title": "Welcome",
                  "fontSize": "16px",
                  "content": "### Welcome to this application \n\n * You are in a Markdown tab view, you can define many more views type click on the '+' in tab header",
                  "createdDate": "2025-08-21T00:00:00.000Z",
                  "createdBy": "user-1",
                  "lastModifiedDate": "2025-08-22T10:00:00.000Z",
                  "lastModifiedBy": "user-2"
                }
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Get debug sample FlexLayout configuration
   */
  static getDebugConfig(): FlexLayoutConfig {
    return {
      global: {
        tabSetEnableClose: true,
        tabSetEnableMaximize: true,
        tabSetEnableDrop: true,
        tabSetEnableDrag: true,
        tabEnableClose: true,
        tabEnableRename: false,
        borderEnableAutoHide: true,
        splitterSize: 3,
        tabSetMinWidth: 20,
        tabSetMinHeight: 50,
      },
      borders: [
        {
          "type": "border",
          "location": "left",
          "children": [	]
        },
        {
          "type": "border",
          "location": "right",
          "children": [	]
        },
        {
          "type": "border",
          "location": "top",
          "children": [	]
        },
        {
          "type": "border",
          "location": "bottom",
          "children": [	]
        },
      ],
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
                id: "b17563f4-d8c3-4c88-9bbc-54302807c6e7",
                name: "Bookmarks tab",
                component: "Bookmarks",
                config: {
                  id: "b17563f4-d8c3-4c88-9bbc-54302807c6e7",
                  component: "Bookmarks",
                  "title": "Bookmarks tab",
                  "bgColor": "#2d76eb",
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
                id: "b17563f4-d8c3-4c88-9bbc-54302807c6e9",
                name: "Markdown tab",
                component: "Markdown",
                config: {
                  id: "b17563f4-d8c3-4c88-9bbc-54302807c6e9",
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
                id: "b17563f4-d8c3-4c88-9bbc-54302807c1e7",
                name: "Web tab",
                component: "Web",
                config: {
                  id: "b17563f4-d8c3-4c88-9bbc-54302807c1e7",
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
