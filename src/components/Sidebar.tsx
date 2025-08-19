import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const Sidebar: React.FC<{
  open: boolean;
  onCollapse: () => void;
}> = ({ open, onCollapse }) => (
  <aside className={`dashboard-sidebar ${open ? 'sidebar-open' : 'sidebar-closed'}`}>
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
    {open && (
      <button
        className="sidebar-collapse"
        onClick={onCollapse}
        title="Réduire le menu"
      >
        <ChevronLeft size={16} />
      </button>
    )}
  </aside>
);
