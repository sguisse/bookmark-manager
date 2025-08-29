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
