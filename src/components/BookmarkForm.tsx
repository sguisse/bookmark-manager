import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BookmarkFormData } from '../types/bookmark';
import { useBookmarks } from '../contexts/BookmarkContext';

interface BookmarkFormProps {
  initialData?: Partial<BookmarkFormData>;
  bookmarkId?: string;
  onClose: () => void;
}

export const BookmarkForm: React.FC<BookmarkFormProps> = ({
  initialData,
  bookmarkId,
  onClose,
}) => {
  const { groups, addBookmark, updateBookmark } = useBookmarks();
  const [formData, setFormData] = useState<BookmarkFormData>({
    title: initialData?.title || '',
    url: initialData?.url || '',
    description: initialData?.description || '',
    tags: initialData?.tags || [],
    groupId: initialData?.groupId || groups[0]?.id || '',
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.url.trim()) {
      alert('Le titre et l\'URL sont requis.');
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      alert('L\'URL n\'est pas valide.');
      return;
    }

    const bookmarkData = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description.trim(),
      tags: formData.tags.filter(tag => tag.trim()),
    };

    if (bookmarkId) {
      // Modification
      const group = groups.find(g => g.bookmarks.some(b => b.id === bookmarkId));
      if (group) {
        updateBookmark(group.id, bookmarkId, bookmarkData);
      }
    } else {
      // Ajout
      addBookmark(formData.groupId, bookmarkData);
    }

    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-animated" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {bookmarkId ? 'Modifier le bookmark' : 'Ajouter un bookmark'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre du bookmark"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL *</label>
            <input
              type="url"
              className="form-input"
              value={formData.url}
              onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description optionnelle"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Groupe</label>
            <select
              className="form-select"
              value={formData.groupId}
              onChange={e => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
            >
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ajouter un tag"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Plus size={16} />
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="bookmark-tags">
                {formData.tags.map((tag) => (
                  <span key={tag} className="bookmark-tag" style={{ cursor: 'pointer' }}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        marginLeft: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {bookmarkId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
