import React, { useState } from 'react';
import { Menu, Settings } from 'lucide-react';
import { HeaderPanel } from './HeaderPanel';
import { Sidebar } from './Sidebar';
import { ControlPanel } from './ControlPanel';
import { BottomPanel } from './BottomPanel';
import { useFlexLayoutConfig } from '../../hooks/useFlexLayoutConfig';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);

  // Use the FlexLayout configuration hook
  const { exportConfig, importConfig, formatLastSaved } = useFlexLayoutConfig();

  const handleExportLayout = async () => {
    try {
      await exportConfig();
      console.log('FlexLayout configuration exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erreur lors de l\'exportation du layout');
    }
  };

  const handleImportLayout = async () => {
    try {
      await importConfig();
      console.log('FlexLayout configuration imported successfully');
      alert('Layout importé avec succès!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Erreur lors de l\'importation du layout');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            title={leftSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <Menu size={20} />
          </button>
        </div>
        <HeaderPanel
          onAddGroup={() => setShowGroupForm(true)}
          onExportLayout={handleExportLayout}
          onImportLayout={handleImportLayout}
        />
        <div className="header-right">
          <button
            className="panel-toggle"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title={rightPanelOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Left Sidebar */}
        <Sidebar open={leftSidebarOpen} onCollapse={() => setLeftSidebarOpen(false)} />

        {/* Center Content */}
        <main className="dashboard-content">
          {children}
        </main>

        {/* Right Panel */}
        <ControlPanel
          open={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          showGroupForm={showGroupForm}
          onCloseGroupForm={() => setShowGroupForm(false)}
        />
      </div>

      {/* Bottom Bar */}
      <BottomPanel formatLastSaved={formatLastSaved} />
    </div>
  );
};
