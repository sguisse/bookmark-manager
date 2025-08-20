import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Plus } from 'lucide-react';
import { BookmarkGroup } from '../types/bookmark';
import { useBookmarks } from '../contexts/BookmarkContext';

interface GroupHeaderProps {
  group: BookmarkGroup;
  onEdit: (group: BookmarkGroup) => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({ group, onEdit }) => {
  const { dispatch } = useBookmarks();

  const handleToggleCollapse = () => {
    dispatch({ type: 'TOGGLE_GROUP_COLLAPSED', payload: group.id });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(group);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${group.title}" et tous ses bookmarks ?`)) {
      dispatch({ type: 'DELETE_GROUP', payload: group.id });
    }
  };

  return (
    <div className="group-header" onClick={handleToggleCollapse}>
      <div className="group-title">
        {group.collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        <div
          className="group-color"
          style={{ backgroundColor: group.color }}
        />
        <span>{group.title}</span>
        <div className="group-count">
          {group.bookmarks.length}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="action-button"
          onClick={handleEdit}
          title="Modifier le groupe"
        >
          <Edit size={16} />
        </button>
        {group.id !== 'default' && (
          <button
            className="action-button delete"
            onClick={handleDelete}
            title="Supprimer le groupe"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
