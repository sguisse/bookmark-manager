import React, { useEffect, useState, useRef } from 'react';
import { SidebarService } from '../../services/sidebarService';
import { SidebarConfig } from '../../types/sidebar';

export const SidebarManager: React.FC = () => {
const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig | null>(null);

useEffect(() => {
    // Try to load from localStorage first
    try {
      const raw: SidebarConfig | null = SidebarService.loadConfig();
      if (raw) {
        setSidebarConfig(raw);
      }
    } catch (err) {
      // ignore and fall back to default
      console.warn('Failed to load sidebar config from storage, using default', err);
    }

  }, []);

return (
    <div>
      <h3>Sidebar Manager</h3>
      <pre>{JSON.stringify(sidebarConfig, null, 2)}</pre>
    </div>
  );
};
