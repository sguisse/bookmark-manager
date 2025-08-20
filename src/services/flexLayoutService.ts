import { IJsonModel } from 'flexlayout-react';

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

  /**
   * Create layout configuration for bookmark groups
   */
  static createLayoutForGroups(groups: any[]): FlexLayoutConfig {
    const defaultConfig = this.getDefaultConfig();

    if (groups.length === 0) {
      defaultConfig.layout.children = [
        {
          type: 'tabset',
          weight: 100,
          children: [
            {
              type: 'tab',
              id: 'welcome',
              name: 'Welcome',
              component: 'Welcome'
            }
          ]
        }
      ];
    } else {
      defaultConfig.layout.children = groups.map((group) => ({
        type: 'tabset',
        id: `tabset-${group.id}`,
        weight: 100 / groups.length,
        children: [
          {
            type: 'tab',
            id: `tab-${group.id}`,
            name: group.title,
            component: 'BookmarkGroup',
            config: { groupId: group.id }
          }
        ]
      }));
    }

    return defaultConfig;
  }
}
