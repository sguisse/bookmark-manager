import { SidebarConfig, SidebarViewMode, SidebarItemType } from "../types/sidebar";

export class SidebarService {

  static readonly STORAGE_KEY = 'app-fusion-sidebar';

  /**
   * Get default Sidebar configuration
   */
  static getDefaultConfig(): SidebarConfig {
    return {
      lastSelectedItemId: 'bookmarks',
      creationDate: null,
      lastUpdateDate: null,
      viewMode: SidebarViewMode.Visible,
      footerItems: [
        { id: 'help', type: SidebarItemType.MenuItem, title: 'Help', icon: 'help-circle' },
        { id: 'about', type: SidebarItemType.MenuItem, title: 'About', icon: 'info' }
      ],
      sidebarItems: [
        {
          id: 'main-cat',
          type: SidebarItemType.Category,
          title: 'Main',
          children: [
            {
              id: 'bookmarks',
              type: SidebarItemType.MenuItem,
              title: 'Bookmarks',
              icon: 'bookmark',
              flexLayoutId: 'app-fusion-flexlayout-bookmarks',
              badge: { id: 'bookmarks-new', label: 'new', color: 'blue' }
            },
            {
              id: 'groups',
              type: SidebarItemType.MenuItem,
              title: 'Groups',
              icon: 'group',
              flexLayoutId: 'app-fusion-flexlayout-groups'
            }
          ]
        },
        {
          id: 'management-cat',
          type: SidebarItemType.Category,
          title: 'Management',
          children: [
            {
              id: 'settings',
              type: SidebarItemType.MenuGroup,
              title: 'Settings',
              icon: 'settings',
              expanded: false,
              children: [
                {
                  id: 'profile',
                  type: SidebarItemType.MenuItem,
                  title: 'Profile',
                  icon: 'user',
                  flexLayoutId: 'app-fusion-flexlayout-profile'
                },
                {
                  id: 'preferences',
                  type: SidebarItemType.MenuItem,
                  title: 'Preferences',
                  icon: 'sliders',
                  flexLayoutId: 'app-fusion-flexlayout-preferences'
                }
              ]
            }
          ]
        }
      ],
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
