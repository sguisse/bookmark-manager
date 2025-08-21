import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { SidebarMenuItem } from '../types/sidebar';

type ApplicationContextValue = {
  selectedMenuItem: SidebarMenuItem | null;
  setSelectedMenuItem: (item: SidebarMenuItem | null) => void;
};

const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMenuItem, setSelectedMenuItem] = useState<SidebarMenuItem | null>(null);
  const value = useMemo(() => ({ selectedMenuItem, setSelectedMenuItem }), [selectedMenuItem]);
  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = (): ApplicationContextValue => {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error('useApplication must be used within ApplicationProvider');
  return ctx;
};
