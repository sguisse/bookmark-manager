import React from 'react';

export const BottomBar: React.FC<{
  formatLastSaved: () => string;
}> = ({ formatLastSaved }) => (
  <footer className="dashboard-footer">
    <div className="footer-left">
      <span className="status-indicator">Connecté</span>
      <span className="separator">•</span>
      <span className="sync-status">Synchronisé</span>
    </div>
    <div className="footer-right">
      <span className="version">v1.0.0</span>
      <span className="separator">•</span>
      <span className="last-save">{formatLastSaved()}</span>
    </div>
  </footer>
);
