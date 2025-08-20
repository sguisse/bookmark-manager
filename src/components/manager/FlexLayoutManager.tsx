import React, { useEffect, useState, useRef } from 'react';
import { FlexLayoutConfig, FlexLayoutService } from '../../services/flexLayoutService';

interface FlexLayoutManagerProps {}

const STORAGE_KEY = 'bookmark-manager-config-flexlayout';

export const FlexLayoutManager: React.FC<FlexLayoutManagerProps> = () => {
  const [layout, setLayout] = useState<FlexLayoutConfig | null>(null);

  useEffect(() => {
    // Try to load from localStorage first
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (FlexLayoutService.isValidConfig(parsed)) {
          setLayout(parsed as FlexLayoutConfig);
          return;
        }
      }
    } catch (err) {
      // ignore and fall back to default
      console.warn('Failed to load flex layout from storage, using default', err);
    }

    // Fallback to default config
    setLayout(FlexLayoutService.getDefaultConfig());
  }, []);




  return (
    <div style={{ padding: 16 }}>
      <h3>Flex Layout Manager</h3>

      {layout ? (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12, borderRadius: 6 }}>{JSON.stringify(layout, null, 2)}</pre>
      ) : (
        <div>No layout configuration found.</div>
      )}
    </div>
  );
};
