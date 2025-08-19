import React, { useState } from 'react';
import { Menu, X, ChevronLeft, Settings } from 'lucide-react';
import { HeaderPanel } from './HeaderPanel';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

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
          <HeaderPanel />
        </div>
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
        <aside className={`dashboard-sidebar ${leftSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="sidebar-content">
            <nav className="sidebar-nav">
              <div className="sidebar-section">
                <h3>Navigation</h3>
                <ul>
                  <li><a href="#bookmarks" className="sidebar-link active">📚 Bookmarks</a></li>
                  <li><a href="#collections" className="sidebar-link">📁 Collections</a></li>
                  <li><a href="#tags" className="sidebar-link">🏷️ Tags</a></li>
                  <li><a href="#recent" className="sidebar-link">⏰ Récents</a></li>
                </ul>
              </div>
              <div className="sidebar-section">
                <h3>Outils</h3>
                <ul>
                  <li><a href="#import" className="sidebar-link">📥 Importer</a></li>
                  <li><a href="#export" className="sidebar-link">📤 Exporter</a></li>
                  <li><a href="#stats" className="sidebar-link">📊 Statistiques</a></li>
                </ul>
              </div>
            </nav>
          </div>
          {leftSidebarOpen && (
            <button
              className="sidebar-collapse"
              onClick={() => setLeftSidebarOpen(false)}
              title="Réduire le menu"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </aside>

        {/* Center Content */}
        <main className="dashboard-content">
          {children}
        </main>

        {/* Right Panel */}
        <aside className={`dashboard-right-panel ${rightPanelOpen ? 'panel-open' : 'panel-closed'}`}>
          <div className="panel-header">
            <h3>Panneau de contrôle</h3>
            <button
              className="panel-close"
              onClick={() => setRightPanelOpen(false)}
              title="Fermer le panneau"
            >
              <X size={16} />
            </button>
          </div>
          <div className="panel-content">
            <div className="panel-section">
              <h4>Actions rapides</h4>
              <button className="panel-button">Nouveau groupe</button>
              <button className="panel-button">Importer bookmarks</button>
              <button className="panel-button">Vider le cache</button>
            </div>
            <div className="panel-section">
              <h4>Statistiques</h4>
              <div className="stats-item">
                <span>Groupes: 0</span>
              </div>
              <div className="stats-item">
                <span>Bookmarks: 0</span>
              </div>
              <div className="stats-item">
                <span>Tags: 0</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Bar */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span className="status-indicator">Connecté</span>
          <span className="separator">•</span>
          <span className="sync-status">Synchronisé</span>
        </div>
        <div className="footer-right">
          <span className="version">v1.0.0</span>
          <span className="separator">•</span>
          <span className="last-save">Sauvegarde automatique</span>
        </div>
      </footer>
    </div>
  );
};
