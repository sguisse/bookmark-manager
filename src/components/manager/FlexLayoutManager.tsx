import React, { useEffect, useState } from 'react';
import { FlexLayoutConfig, FlexLayoutService } from '../../services/flexLayoutService';
import { useApplication } from '../../contexts/ApplicationContext';

interface FlexLayoutManagerProps {}


export const FlexLayoutManager: React.FC<FlexLayoutManagerProps> = () => {
  const [layout, setLayout] = useState<FlexLayoutConfig | null>(null);
  const { selectedMenuItem } = useApplication();

  useEffect(() => {
    if (selectedMenuItem) {
      const id = selectedMenuItem.id;
      console.log('menuItem selected :', id);
      // attempt to load layout for this id
      try {
        const config = FlexLayoutService.loadConfig(id);
        if (config) {
          setLayout(config);
        }
      } catch (err) {
        console.warn('Error loading layout for selected menu item', err);
      }
    }
  }, [selectedMenuItem]);


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
