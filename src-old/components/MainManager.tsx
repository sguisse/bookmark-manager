import React from 'react';
import { FlexLayoutManager } from './FlexLayoutManager';
import { DashboardLayout } from './layout/DashboardLayout';

export const MainManager: React.FC = () => {
  return (
    <div className="app">
      <DashboardLayout>
        <FlexLayoutManager searchQuery="" />
      </DashboardLayout>
    </div>
  );
};
