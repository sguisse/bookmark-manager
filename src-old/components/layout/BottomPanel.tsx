import React from 'react';
import { useBookmarks } from '../../contexts/BookmarkContext';

export const BottomPanel: React.FC = () => {
  const { lastSaved } = useBookmarks();

  const format = (d: Date | null) => {
    if (!d) return 'Pas encore sauvegardé';
    return new Date(d).toLocaleString();
  };

  return (
    <footer className="dashboard-footer">
      <div className="footer-left">
        <span className="status-indicator">Connecté</span>
        <span className="separator">•</span>
        <span className="sync-status">Synchronisé</span>
      </div>
      <div className="footer-right">
        <span className="version">v1.0.0</span>
        <span className="separator">•</span>
        <span className="last-save">{format(lastSaved)}</span>
      </div>
    </footer>
  );
};
