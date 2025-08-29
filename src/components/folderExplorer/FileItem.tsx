import React, { useState } from 'react';
import path from 'path';

interface FileItemProps {
  item: {
    name: string;
    isDir: boolean;
    fullPath: string;
  };
  onNavigate: (fullPath: string) => void;
  onDelete: (name: string, isDir: boolean) => Promise<void>;
  onRename: (oldName: string, newName: string) => Promise<void>;
}

const FileItem: React.FC<FileItemProps> = ({ item, onNavigate, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const handleDoubleClick = () => {
    if (item.isDir) {
      onNavigate(item.fullPath);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sourcePath', item.fullPath);
  };

  const handleRename = () => {
    setIsEditing(true);
  };

  const handleSaveRename = async (e?: React.FormEvent | React.FocusEvent) => {
    e?.preventDefault();
    if (newName && newName !== item.name) {
      await onRename(item.name, newName);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Voulez-vous vraiment supprimer ${item.name} ?`)) {
      await onDelete(item.name, item.isDir);
    }
  };

  return (
    <div
      className={`file-item ${item.isDir ? 'folder' : 'file'}`}
      onDoubleClick={handleDoubleClick}
      draggable
      onDragStart={handleDragStart}
    >
      {isEditing ? (
        <form onSubmit={handleSaveRename}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleSaveRename}
            autoFocus
          />
        </form>
      ) : (
        <>
          <span className="file-icon">
            {item.isDir ? '📁' : '📄'}
          </span>
          <span className="file-name">{item.name}</span>
        </>
      )}
      <div className="file-actions">
        <button onClick={handleRename}>✏️</button>
        <button onClick={handleDelete}>🗑️</button>
      </div>
    </div>
  );
};

export default FileItem;
