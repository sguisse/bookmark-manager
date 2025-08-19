import React, { useState } from 'react';
import { Search, Plus, FolderPlus, Download, Upload, Settings } from 'lucide-react';
import { useBookmarks } from '../contexts/BookmarkContext';
import { useNotifications } from '../contexts/NotificationContext';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddBookmark: () => void;
  onAddGroup: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onAddBookmark,
  onAddGroup,
}) => {
  const { exportData, importData, lastSaved } = useBookmarks();
  const notifications = useNotifications();
  const [isImporting, setIsImporting] = useState(false);

  const handleShowStorageInfo = () => {
    try {
      const stored = localStorage.getItem('bookmark-manager-config');
      const size = stored ? new Blob([stored]).size : 0;
      const sizeKB = (size / 1024).toFixed(2);

      // Estimation de l'usage du localStorage
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      const totalSizeKB = (totalSize / 1024).toFixed(2);

      const lastSaveInfo = lastSaved
        ? `Dernière sauvegarde: ${lastSaved.toLocaleString()}`
        : 'Aucune sauvegarde détectée';

      notifications.info(
        'Informations de stockage',
        `Taille des bookmarks: ${sizeKB} KB\nTotal localStorage: ${totalSizeKB} KB\n${lastSaveInfo}`
      );
    } catch (error) {
      console.error('Erreur d\'accès au storage:', error);
      notifications.error('Erreur', 'Impossible d\'accéder aux informations de stockage');
    }
  };

  const handleExport = () => {
    const dataStr = exportData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonData = event.target?.result as string;
            // Validation basique
            const config = JSON.parse(jsonData);
            if (config.version && config.groups && Array.isArray(config.groups)) {
              importData(jsonData);
              alert('Configuration importée avec succès !');
            } else {
              alert('Fichier de configuration invalide.');
            }
          } catch (error) {
            alert('Erreur lors de la lecture du fichier : ' + (error as Error).message);
          } finally {
            setIsImporting(false);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="toolbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#888',
            }}
          />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher dans les bookmarks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn btn-primary" onClick={onAddBookmark}>
          <Plus size={16} />
          Bookmark
        </button>

        <button className="btn btn-secondary" onClick={onAddGroup}>
          <FolderPlus size={16} />
          Groupe
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#404040', margin: '0 4px' }} />

        <button
          className="btn btn-secondary"
          onClick={handleExport}
          title="Exporter la configuration"
        >
          <Download size={16} />
          Exporter
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleImport}
          disabled={isImporting}
          title="Importer une configuration"
        >
          <Upload size={16} />
          {isImporting ? 'Import...' : 'Importer'}
        </button>

        <button
          className="btn btn-secondary storage-info-btn"
          onClick={handleShowStorageInfo}
          title="Informations de stockage"
        >
          <Settings size={16} />
          Info
          {lastSaved && (
            <span className="save-indicator">
              ● {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
