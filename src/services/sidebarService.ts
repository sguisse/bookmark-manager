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
        let parsedConfig: any = JSON.parse(config);

        // Rehydrate date strings into Date objects for consistency
        const reviveDates = (obj: any) => {
          if (!obj || typeof obj !== 'object') return obj;
          if (obj.createdDate && typeof obj.createdDate === 'string') obj.createdDate = new Date(obj.createdDate);
          if (obj.lastModifiedDate && typeof obj.lastModifiedDate === 'string') obj.lastModifiedDate = new Date(obj.lastModifiedDate);
          // For nested sidebar items
          if (Array.isArray(obj.sidebarItems)) {
            const walk = (items: any[]) => {
              for (const it of items) {
                if (it.createdDate && typeof it.createdDate === 'string') it.createdDate = new Date(it.createdDate);
                if (it.lastModifiedDate && typeof it.lastModifiedDate === 'string') it.lastModifiedDate = new Date(it.lastModifiedDate);
                if (it.children && Array.isArray(it.children)) walk(it.children);
                if (it.badge && typeof it.badge === 'object') {
                  if (it.badge.createdDate && typeof it.badge.createdDate === 'string') it.badge.createdDate = new Date(it.badge.createdDate);
                  if (it.badge.lastModifiedDate && typeof it.badge.lastModifiedDate === 'string') it.badge.lastModifiedDate = new Date(it.badge.lastModifiedDate);
                }
              }
            };
            walk(obj.sidebarItems);
          }

        };

        reviveDates(parsedConfig);
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
    const json = JSON.stringify(config);
    console.log(json)
    localStorage.setItem(SidebarService.STORAGE_KEY, json);
  }

}
