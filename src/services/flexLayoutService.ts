import { IJsonModel } from 'flexlayout-react';

export type FlexLayoutConfig = IJsonModel;

export class FlexLayoutService {
  private static readonly STORAGE_KEY = 'bookmark-manager-config-flexlayout';
  private static readonly FILE_NAME = 'bookmark-manager-config-flexlayout.json';

  /**
   * Export FlexLayout configuration to JSON file
   */
  static exportLayout(config: FlexLayoutConfig): void {
    try {
      const jsonString = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = this.FILE_NAME;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      // Save to localStorage as backup
      localStorage.setItem(this.STORAGE_KEY, jsonString);

      console.log('FlexLayout configuration exported successfully');
    } catch (error) {
      console.error('Error exporting FlexLayout configuration:', error);
      throw new Error('Failed to export layout configuration');
    }
  }

  /**
   * Import FlexLayout configuration from JSON file
   */
  static importLayout(): Promise<FlexLayoutConfig> {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const jsonString = e.target?.result as string;
              const config = JSON.parse(jsonString) as FlexLayoutConfig;

              // Validate the configuration structure
              if (!this.isValidConfig(config)) {
                reject(new Error('Invalid FlexLayout configuration format'));
                return;
              }

              // Save to localStorage
              localStorage.setItem(this.STORAGE_KEY, jsonString);

              console.log('FlexLayout configuration imported successfully');
              resolve(config);
            } catch (parseError) {
              console.error('JSON parsing error:', parseError);
              reject(new Error('Failed to parse JSON file'));
            }
          };

          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };

          reader.readAsText(file);
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      } catch (error) {
        console.error('Import error:', error);
        reject(new Error('Failed to import layout configuration'));
      }
    });
  }

  /**
   * Get saved configuration from localStorage
   */
  static loadConfig(): FlexLayoutConfig | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved) as FlexLayoutConfig;
        console.log('Configuration chargée depuis config flexlayout:', config);
        return this.isValidConfig(config) ? config : null;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving saved configuration:', error);
      return null;
    }
  }

  /**
   * Save configuration to localStorage
   */
  static saveConfig(config: FlexLayoutConfig): void {
    try {
      const jsonString = JSON.stringify(config, null, 2);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
      console.log('Configuration sauvegardée dans config flexlayout:', config);
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  }

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
        tabSetMinHeight: 200
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
                name: "Main",
                component: "BookmarkList"
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
  private static isValidConfig(config: any): config is FlexLayoutConfig {
    if (!config || typeof config !== 'object') return false;

    // Check required properties
    if (!config.global || !config.borders || !config.layout) return false;

    // Check global properties
    if (typeof config.global.tabEnableClose !== 'boolean' ||
        typeof config.global.tabEnableRename !== 'boolean' ||
        typeof config.global.tabEnableDrag !== 'boolean' ||
        typeof config.global.borderBarSize !== 'number') return false;

    // Check borders array
    if (!Array.isArray(config.borders)) return false;

    // Check layout structure
    if (!config.layout.type || !config.layout.children || !Array.isArray(config.layout.children)) return false;

    return true;
  }
}
