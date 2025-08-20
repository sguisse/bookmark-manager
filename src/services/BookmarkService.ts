import { BookmarkConfig } from '../types/bookmark';

const STORAGE_KEY = 'bookmark-manager-config';

export class BookmarkService {
  /**
   * Load the entire bookmark config (including layoutConfig) from localStorage
   */
  static loadConfig(): BookmarkConfig | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const config = JSON.parse(raw);
        config.createdAt = new Date(config.createdAt);
        config.updatedAt = new Date(config.updatedAt);
        // Convert dates in groups/bookmarks
        config.groups.forEach((group: any) => {
          group.bookmarks.forEach((bookmark: any) => {
            bookmark.createdAt = new Date(bookmark.createdAt);
            bookmark.updatedAt = new Date(bookmark.updatedAt);
          });
        });
        return config;
      }
    } catch (error) {
      console.error('[BookmarkService] Error loading config:', error);
    }
    return null;
  }

  /**
   * Save the entire bookmark config (including layoutConfig) to localStorage
   */
  static saveConfig(config: BookmarkConfig): void {
    try {
      const configToSave = {
        ...config,
        updatedAt: new Date()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
      console.log('[BookmarkService] Config saved');
    } catch (error) {
      console.error('[BookmarkService] Error saving config:', error);
    }
  }

  /**
   * Export configuration as JSON file
   */
  static exportConfig(config: BookmarkConfig): void {
    try {
      const jsonString = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'bookmark-manager-config.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[BookmarkService] Error exporting config:', error);
      throw new Error('Failed to export configuration');
    }
  }

  /**
   * Import configuration from JSON file
   */
  static importConfig(): Promise<BookmarkConfig> {
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
              const config = JSON.parse(jsonString) as BookmarkConfig;

              // Convert date strings back to Date objects
              config.createdAt = new Date(config.createdAt);
              config.updatedAt = new Date(config.updatedAt);
              config.groups.forEach(group => {
                group.bookmarks.forEach(bookmark => {
                  bookmark.createdAt = new Date(bookmark.createdAt);
                  bookmark.updatedAt = new Date(bookmark.updatedAt);
                });
              });

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
        reject(new Error('Failed to import configuration'));
      }
    });
  }
}
