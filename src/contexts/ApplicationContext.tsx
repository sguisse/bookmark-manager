import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { SidebarItem } from '../types/sidebar';

type ApplicationContextValue = {
  selectedMenuItem: SidebarItem | null;
  setSelectedMenuItem: (item: SidebarItem | null) => void;
};

const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMenuItem, setSelectedMenuItem] = useState<SidebarItem | null>(null);
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
