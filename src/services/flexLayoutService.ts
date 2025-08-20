import { IJsonModel } from 'flexlayout-react';

//const STORAGE_KEY = 'flexlayout-config-{ID}';

export type FlexLayoutConfig = IJsonModel;

export class FlexLayoutService {
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

  /**
   * Validate FlexLayout configuration structure
   */
  static isValidConfig(config: any): config is FlexLayoutConfig {
    if (!config || typeof config !== 'object') return false;
    if (!config.global || !config.layout) return false;
    return true;
  }


}
