import { SidebarConfig, SidebarViewMode, SidebarItemType } from "../types/sidebar";

export class SidebarService {

  static readonly STORAGE_KEY = 'app-fusion-sidebar';

  /**
   * Get default Sidebar configuration
   */
  static getDefaultConfig(): SidebarConfig {
    const currentDate = new Date();

    return {
      lastSelectedItemId: 'bookmarks',
      createdDate: currentDate,
      lastModifiedDate: currentDate,
      viewMode: SidebarViewMode.Visible,
      footerItems: [
        { id: 'help', type: SidebarItemType.MenuItem, title: 'Help', icon: 'help-circle', flexLayoutId: 'app-fusion-flexlayout-help' },
        { id: 'about', type: SidebarItemType.MenuItem, title: 'About', icon: 'info', flexLayoutId: 'app-fusion-flexlayout-about' }
      ],
      sidebarItems: [
        {
          id: 'main-cat',
          type: SidebarItemType.Category,
          title: 'Main',
          flexLayoutId: 'app-fusion-flexlayout-main',
          children: [
            {
              id: 'bookmarks',
              type: SidebarItemType.MenuItem,
              title: 'Bookmarks',
              icon: 'bookmark',
              flexLayoutId: 'app-fusion-flexlayout-bookmarks',
              badge: { id: 'bookmarks-new', title: 'new', color: '#3399ff' }
            },
            {
              id: 'groups',
              type: SidebarItemType.MenuItem,
              title: 'Groups',

              flexLayoutId: 'app-fusion-flexlayout-groups'
            }
          ]
        },
        {
          id: 'Decathlon-cat',
          type: SidebarItemType.Category,
          title: 'Decathlon',
          flexLayoutId: 'app-fusion-flexlayout-decathlon',
          children: [
            {
              id: 'Architecture',
              flexLayoutId: 'app-fusion-flexlayout-architecture',
              type: SidebarItemType.MenuGroup,
              title: 'Architecture',
              expanded: true,
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
