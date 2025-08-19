
import React, { useState } from 'react';
import { Menu, Settings } from 'lucide-react';
import { HeaderPanel } from './HeaderPanel';
import { Sidebar } from './Sidebar';
import { ControlPanel } from './ControlPanel';
import { BottomBar } from './BottomBar';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleExportLayout = () => {
    // Export FlexLayout model to JSON file for download
    console.log('Exporting layout...');
    alert('Export layout functionality coming soon!');
    setLastSaved(new Date()); // Update save time on export
  };

  const handleImportLayout = () => {
    // Import FlexLayout model from uploaded JSON file
    console.log('Importing layout...');
    alert('Import layout functionality coming soon!');
    setLastSaved(new Date()); // Update save time on import
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Jamais sauvegardé';
    return `Sauvé le ${lastSaved.toLocaleDateString('fr-FR')} à ${lastSaved.toLocaleTimeString('fr-FR')}`;
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
      <BottomBar formatLastSaved={formatLastSaved} />
    </div>
  );
};
