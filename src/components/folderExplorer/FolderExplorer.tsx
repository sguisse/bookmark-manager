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
