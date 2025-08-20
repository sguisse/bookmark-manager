import React from 'react';
import { FlexLayoutManagerSimple } from './FlexLayoutManagerSimple';
import { DashboardLayout } from './layout/DashboardLayout';

export const MainManager: React.FC = () => {
  return (
    <div className="app">
      <DashboardLayout>
        <FlexLayoutManagerSimple searchQuery="" />
      </DashboardLayout>
    </div>
  );
};
