import React from 'react';
import { X } from 'lucide-react';
import { GroupForm } from './GroupForm';

export const ControlPanel: React.FC<{
  open: boolean;
  onClose: () => void;
  showGroupForm: boolean;
  onCloseGroupForm: () => void;
}> = ({ open, onClose, showGroupForm, onCloseGroupForm }) => (
  <aside className={`dashboard-right-panel ${open ? 'panel-open' : 'panel-closed'}`}>
    <div className="panel-header">
      <h3>Panneau de contrôle</h3>
      <button
        className="panel-close"
        onClick={onClose}
        title="Fermer le panneau"
      >
        <X size={16} />
      </button>
    </div>
    <div className="panel-content">
      <div className="panel-section">
        <h4>Actions rapides</h4>
        <button className="panel-button">Importer bookmarks</button>
        <button className="panel-button">Vider le cache</button>
      </div>
      {showGroupForm && (
        <GroupForm onClose={onCloseGroupForm} />
      )}
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
);
