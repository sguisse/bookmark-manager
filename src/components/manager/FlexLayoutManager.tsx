import React, { useEffect, useState, useCallback } from 'react';
import { FlexLayoutConfig, FlexLayoutService } from '../../services/flexLayoutService';
import { useApplication } from '../../contexts/ApplicationContext';
import { Layout, Model, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { FlexTabComponent } from '../../types/flexTab';
import WelcomeTab from '../welcome/WelcomeTab';
import BookmarksTab from '../bookmark/BookmarksTab';
import MarkdownTab from '../markdown/MarkdownTab';
import { BookmarksTabConfig } from '../../types/bookmark';
import { MarkdownTabConfig } from '../../types/markdown';

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
    const config = node.getConfig();

    // Normalize component string to handle different casings/names (e.g. "Welcome" vs "welcome", "BookmarkGroup")
    const compKey = String(component || '').toLowerCase();

    // Map several possible component keys to the intended tab components
    if (compKey === 'welcosme') {
      return <WelcomeTab />;
    }

    if (compKey === 'markdown') {
      return <MarkdownTab config={config as MarkdownTabConfig} />;
    }

    if (compKey === 'bookmarks') {
      return <BookmarksTab config={config as BookmarksTabConfig} />;
    }

    // Fallback: render unknown component name + raw config
    return (
      <div style={{ padding: 12 }}>
        <div><strong>{String(component)}</strong> component not found !</div>
        <div style={{ marginTop: 8, fontSize: 16, color: '#444' }}>Here, it is his configuration :</div>
        <pre>
          {config && Object.keys(config).length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>{JSON.stringify(config)}</div>
          )}
          {(!config || Object.keys(config).length === 0) && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>No configuration found</div>
          )}
        </pre>
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
