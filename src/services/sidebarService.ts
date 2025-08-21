import { SidebarMenuItem, SidebarConfig } from "../types/sidebar";

export class SidebarService {

  static readonly STORAGE_KEY = 'app-fusion-sidebar';

  /**
   * Get default Sidebar configuration
   */
  static getDefaultConfig(): SidebarConfig {
    return {
      lastSelectedItemId: "bookmarks",
      lastUpdateDate: null,
      menuItems: [
        {
          id: 'bookmarks',
          title: 'Bookmarks',
          icon: 'bookmark',
          flexLayoutId: 'app-fusion-flexlayout-bookmarks'
        },
        {
          id: 'groups',
          title: 'Groups',
          icon: 'group',
          flexLayoutId: 'app-fusion-flexlayout-groups'
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
              flexLayoutId: 'app-fusion-flexlayout-child'
            }
          ]
        }
      ]
    };
  }

  // Load Sidebar configuration from local storage
  static loadConfig(): SidebarConfig | null {
    const config  = localStorage.getItem(SidebarService.STORAGE_KEY);
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
    localStorage.setItem(SidebarService.STORAGE_KEY, JSON.stringify(config));
  }

}
