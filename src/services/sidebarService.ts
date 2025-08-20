import { MenuItem, SidebarConfig } from "../types/sidebar";

const STORAGE_KEY = 'app-fusion-sidebar';

export class SidebarService {
  /**
   * Get default Sidebar configuration
   */
  static getDefaultConfig(): SidebarConfig {
    return {
      menuItems: [
        {
          id: 'bookmarks',
          title: 'Bookmarks',
          icon: 'bookmark',
          flexLayoutId: 'flexlayout-config-bookmarks'
        },
        {
          id: 'groups',
          title: 'Groups',
          icon: 'group',
          flexLayoutId: 'flexlayout-config-groups'
        },
        {
          id: 'settings',
          title: 'Settings sgu',
          icon: 'settings',
          children: [
            {
          id: 'child',
          title: 'child',
          icon: 'child',
          flexLayoutId: 'flexlayout-config-child'
        }
          ]
        }
      ]
    };
  }

  // Load Sidebar configuration from local storage
  static loadConfig(): SidebarConfig | null {
    const config  = localStorage.getItem(STORAGE_KEY);
    if (config) {
      try {
        let parsedConfig = JSON.parse(config);
        return parsedConfig;
      } catch (error) {
        console.error("Failed to parse sidebar config:", error);
      }
    } else {
          let defaultConfig = this.getDefaultConfig();
          this.saveConfig(defaultConfig);
          return defaultConfig;
    }

    return null;
  }

  // Save Sidebar configuration to local storage
  static saveConfig(config: SidebarConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  // Open the selected flex layout
  static openSelectedFlexLayout(menuItem: MenuItem): void {
    console.log('Opening flex layout for menu item:', menuItem.flexLayoutId);
  }


}
