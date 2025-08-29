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
