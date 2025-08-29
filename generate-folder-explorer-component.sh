#!/bin/bash

# Créer les répertoires
mkdir -p src/components/folderExplorer/utils

# Créer les fichiers TSX
cat > src/components/folderExplorer/AddressBar.tsx <<EOF
import React, { useState } from 'react';

interface AddressBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ currentPath, onNavigate }) => {
  const [path, setPath] = useState(currentPath);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <form onSubmit={handleSubmit} className="address-bar-container">
      <input
        type="text"
        value={path}
        onChange={handleChange}
        className="address-bar-input"
        placeholder="Entrez un chemin d'accès..."
      />
      <button type="submit" className="address-bar-button">Go</button>
    </form>
  );
};

export default AddressBar;
EOF

cat > src/components/folderExplorer/FileItem.tsx <<EOF
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
    if (window.confirm(\`Voulez-vous vraiment supprimer \${item.name} ?\`)) {
      await onDelete(item.name, item.isDir);
    }
  };

  return (
    <div
      className={\`file-item \${item.isDir ? 'folder' : 'file'}\`}
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
EOF

cat > src/components/folderExplorer/FileList.tsx <<EOF
import React from 'react';
import path from 'path';
import FileItem from './FileItem';
import { moveFile } from './utils/fileSystem';

interface FileListProps {
  files: {
    name: string;
    isDir: boolean;
    fullPath: string;
  }[];
  currentPath: string;
  onNavigate: (fullPath: string) => void;
  onDelete: (name: string, isDir: boolean) => Promise<void>;
  onRename: (oldName: string, newName: string) => Promise<void>;
}

const FileList: React.FC<FileListProps> = ({ files, currentPath, onNavigate, onDelete, onRename }) => {
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const sourcePath = e.dataTransfer.getData('sourcePath');
    const destinationDir = currentPath;

    if (sourcePath && sourcePath !== destinationDir) {
      try {
        await moveFile(sourcePath, path.join(destinationDir, path.basename(sourcePath)));
        onNavigate(currentPath);
      } catch (error) {
        console.error('Failed to move file:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="file-list-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {files.length > 0 ? (
        files.map((file, index) => (
          <FileItem
            key={index}
            item={file}
            onNavigate={onNavigate}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))
      ) : (
        <div className="no-files">Ce dossier est vide.</div>
      )}
    </div>
  );
};

export default FileList;
EOF

cat > src/components/folderExplorer/FolderExplorer.tsx <<EOF
import React, { useState, useEffect } from 'react';
import path from 'path';
import { listDirectory, deleteItem, renameItem } from './utils/fileSystem';
import AddressBar from './AddressBar';
import FileList from './FileList';
import TreeView from './TreeView';
import SearchBar from './SearchBar';

interface FolderExplorerProps {
  initialPath?: string;
}

const FolderExplorer: React.FC<FolderExplorerProps> = ({ initialPath }) => {
  const [currentPath, setCurrentPath] = useState(initialPath || path.parse(process.cwd()).root);
  const [files, setFiles] = useState<{ name: string; isDir: boolean; fullPath: string; }[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<{ name: string; isDir: boolean; fullPath: string; }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadContent = async (dirPath: string) => {
    const items = await listDirectory(dirPath);
    setFiles(items);
    setCurrentPath(dirPath);
  };

  useEffect(() => {
    loadContent(currentPath);
  }, [currentPath]);

  useEffect(() => {
    const filtered = files.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [searchQuery, files]);

  const handleNavigate = (newPath: string) => {
    loadContent(newPath);
  };

  const handleDelete = async (fileName: string, isDir: boolean) => {
    const filePath = path.join(currentPath, fileName);
    const success = await deleteItem(filePath, isDir);
    if (success) {
      loadContent(currentPath);
    }
  };

  const handleRename = async (oldName: string, newName: string) => {
    const oldPath = path.join(currentPath, oldName);
    const newPath = path.join(currentPath, newName);
    const success = await renameItem(oldPath, newPath);
    if (success) {
      loadContent(currentPath);
    }
  };

  return (
    <div className="folder-explorer-container">
      <AddressBar currentPath={currentPath} onNavigate={handleNavigate} />
      <SearchBar onSearch={setSearchQuery} />
      <div className="main-content">
        <div className="side-panel">
          <TreeView initialPath={path.parse(currentPath).root} onNavigate={handleNavigate} />
        </div>
        <div className="file-panel">
          <FileList
            files={filteredFiles}
            currentPath={currentPath}
            onNavigate={handleNavigate}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        </div>
      </div>
    </div>
  );
};

export default FolderExplorer;
EOF

cat > src/components/folderExplorer/SearchBar.tsx <<EOF
import React from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="Rechercher..."
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;
EOF

cat > src/components/folderExplorer/TreeView.tsx <<EOF
import React, { useState, useEffect } from 'react';
import { listDirectory } from './utils/fileSystem';
import path from 'path';

interface TreeNodeProps {
  dirPath: string;
  onNavigate: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ dirPath, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subdirs, setSubdirs] = useState<{ name: string; isDir: boolean; fullPath: string; }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchDirs = async () => {
        const items = await listDirectory(dirPath);
        setSubdirs(items.filter(item => item.isDir));
      };
      fetchDirs();
    }
  }, [isOpen, dirPath]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = () => {
    onNavigate(dirPath);
  };

  return (
    <div className="tree-node">
      <span onClick={handleToggle} className="toggle-icon">
        {subdirs.length > 0 && (isOpen ? '▼' : '▶')}
      </span>
      <span onClick={handleNavigate} className="folder-name">
        📁 {path.basename(dirPath)}
      </span>
      {isOpen && (
        <div className="sub-nodes">
          {subdirs.map((subDir, index) => (
            <TreeNode
              key={index}
              dirPath={subDir.fullPath}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeViewProps {
  initialPath: string;
  onNavigate: (path: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ initialPath, onNavigate }) => {
  return (
    <div className="tree-view-container">
      <TreeNode dirPath={initialPath} onNavigate={onNavigate} />
    </div>
  );
};

export default TreeView;
EOF

cat > src/components/folderExplorer/utils/fileSystem.tsx <<EOF
import { readdir, rename, unlink, rmdir, stat } from 'fs/promises';
import path from 'path';

export const listDirectory = async (directoryPath: string) => {
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    return entries.map(dirent => ({
      name: dirent.name,
      isDir: dirent.isDirectory(),
      fullPath: path.join(directoryPath, dirent.name)
    }));
  } catch (error) {
    console.error(\`Failed to read directory: \${directoryPath}\`, error);
    return [];
  }
};

export const deleteItem = async (itemPath: string, isDir: boolean) => {
  try {
    if (isDir) {
      await rmdir(itemPath, { recursive: true });
    } else {
      await unlink(itemPath);
    }
    return true;
  } catch (error) {
    console.error(\`Failed to delete item: \${itemPath}\`, error);
    return false;
  }
};

export const renameItem = async (oldPath: string, newPath: string) => {
  try {
    await rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error(\`Failed to rename item: \${oldPath} to \${newPath}\`, error);
    return false;
  }
};

export const moveFile = async (sourcePath: string, destinationPath: string) => {
  try {
    await rename(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error(\`Failed to move file: \${sourcePath} to \${destinationPath}\`, error);
    return false;
  }
};

export const getFileContent = async (filePath: string) => {
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isDirectory()) {
      // Lire les 1000 premiers caractères pour un aperçu
      const content = await readdir(filePath, { encoding: 'utf-8', start: 0, end: 1000 });
      return content.toString();
    }
    return null;
  } catch (error) {
    console.error(\`Failed to read file content: \${filePath}\`, error);
    return null;
  }
};
EOF

echo "La structure des répertoires et les fichiers TSX ont été générés avec succès."
