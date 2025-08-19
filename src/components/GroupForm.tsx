import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useBookmarks } from '../contexts/BookmarkContext';

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

interface GroupFormProps {
  initialData?: { id: string; title: string; color: string };
  onClose: () => void;
}

export const GroupForm: React.FC<GroupFormProps> = ({ initialData, onClose }) => {
  const { addGroup, updateGroup } = useBookmarks();
  const [title, setTitle] = useState(initialData?.title || '');
  const [color, setColor] = useState(initialData?.color || DEFAULT_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Le titre est requis.');
      return;
    }

    const groupData = { title: title.trim(), color, bookmarks: [] };

    if (initialData) {
      // Modification
      updateGroup(initialData.id, groupData);
    } else {
      // Ajout
      addGroup(groupData);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-animated" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Modifier le groupe' : 'Ajouter un groupe'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Titre du groupe *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nom du groupe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Couleur</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginTop: '8px'
            }}>
              {DEFAULT_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: colorOption,
                    border: color === colorOption ? '3px solid #fff' : '2px solid #404040',
                    cursor: 'pointer',
                    boxShadow: color === colorOption ? '0 0 0 2px #3b82f6' : 'none',
                  }}
                  title={colorOption}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
