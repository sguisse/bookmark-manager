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
                name: "Welcome",
                component: "Welcome"
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

  /**
   * Validate FlexLayout configuration structure
   */
  static isValidConfig(config: any): config is FlexLayoutConfig {
    if (!config || typeof config !== 'object') return false;
    if (!config.global || !config.layout) return false;
    return true;
  }


}
