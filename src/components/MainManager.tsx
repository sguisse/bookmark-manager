import React, { useState } from 'react';
import { BookmarkManager } from './BookmarkManager';
import { FlexLayoutManagerSimple } from './FlexLayoutManagerSimple';
import { Toolbar } from './Toolbar';
import { LayoutGrid, List } from 'lucide-react';

export const MainManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'drag-drop' | 'flex-layout'>('drag-drop');

  return (
    <div className="app">
      <div className="main-container">
        <div className="main-header">
          <h1 className="main-title">Gestionnaire de Bookmarks</h1>
          <div className="layout-switcher">
            <button
              className={`btn-icon ${layoutMode === 'drag-drop' ? 'active' : ''}`}
              onClick={() => setLayoutMode('drag-drop')}
              title="Mode Drag & Drop"
            >
              <List size={18} />
              Drag & Drop
            </button>
            <button
              className={`btn-icon ${layoutMode === 'flex-layout' ? 'active' : ''}`}
              onClick={() => setLayoutMode('flex-layout')}
              title="Mode FlexLayout"
            >
              <LayoutGrid size={18} />
              FlexLayout
            </button>
          </div>
        </div>

        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddBookmark={() => {/* Géré par les composants enfants */}}
          onAddGroup={() => {/* Géré par les composants enfants */}}
        />

        {layoutMode === 'drag-drop' ? (
          <BookmarkManager />
        ) : (
          <FlexLayoutManagerSimple searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
};
