import { useState, useEffect, useCallback } from 'react';
import { FlexLayoutService, FlexLayoutConfig } from '../services/flexLayoutService';

export const useFlexLayoutConfig = () => {
  const [layoutConfig, setLayoutConfig] = useState<FlexLayoutConfig | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = FlexLayoutService.loadConfig();
    if (savedConfig) {
      setLayoutConfig(savedConfig);
      setLastSaved(new Date()); // Set last saved to current time if config exists
    } else {
      setLayoutConfig(FlexLayoutService.getDefaultConfig());
    }
  }, []);

  // Save configuration to service
  const saveConfig = useCallback((config: FlexLayoutConfig) => {
    FlexLayoutService.saveConfig(config);
    setLayoutConfig(config);
    setLastSaved(new Date());
  }, []);

  // Export current configuration
  const exportConfig = useCallback(async (): Promise<void> => {
    if (!layoutConfig) {
      throw new Error('No layout configuration available to export');
    }

    try {
      FlexLayoutService.exportLayout(layoutConfig);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [layoutConfig]);

  // Import configuration from file
  const importConfig = useCallback(async (): Promise<void> => {
    try {
      const importedConfig = await FlexLayoutService.importLayout();
      setLayoutConfig(importedConfig);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }, []);

  // Format last saved time
  const formatLastSaved = useCallback(() => {
    if (!lastSaved) return 'Jamais sauvegardé';
    return `Sauvé le ${lastSaved.toLocaleDateString('fr-FR')} à ${lastSaved.toLocaleTimeString('fr-FR')}`;
  }, [lastSaved]);

  return {
    layoutConfig,
    saveConfig,
    exportConfig,
    importConfig,
    formatLastSaved,
    lastSaved
  };
};
