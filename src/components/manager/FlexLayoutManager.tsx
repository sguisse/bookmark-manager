import React, { useEffect, useState, useCallback } from 'react';
import { FlexLayoutConfig, FlexLayoutService } from '../../services/flexLayoutService';
import { useApplication } from '../../contexts/ApplicationContext';
import { Layout, Model, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { FlexTabComponent } from '../../types/flexTab';

interface FlexLayoutManagerProps {}


export const FlexLayoutManager: React.FC<FlexLayoutManagerProps> = () => {
  const [layout, setLayout] = useState<FlexLayoutConfig | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const { selectedMenuItem } = useApplication();

  // Load layout configuration when a menu item is selected
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

  // When a layout config is available, create a flexlayout Model
  useEffect(() => {
    if (!layout) {
      setModel(null);
      return;
    }

    try {
      const m = Model.fromJson(layout as any);
      setModel(m);
    } catch (err) {
      console.warn('Failed to create Model from layout', err);
      setModel(null);
    }
  }, [layout]);

  const factoryCallback = useCallback((node: TabNode) => {
    const component = node.getComponent();
    // Convert component to FlexTabComponent
    const flexTabComponent = component as FlexTabComponent;
    const config = node.getConfig();

    // Simple renderer: show component name and any config
    return (
      <div style={{ padding: 12 }}>
        <strong>{component}</strong> with config :
        {config && Object.keys(config).length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>{JSON.stringify(config)}</div>
        )}
      </div>
    );
  }, []);


  return (
    <div style={{ padding: 16 }}>
      <h3>Flex Layout Manager</h3>

      {model ? (
        <div style={{ height: 400 }}>
          <Layout
            model={model}
            factory={factoryCallback}
          />
        </div>
      ) : (
        <div>No layout configuration found.</div>
      )}
    </div>
  );
};
