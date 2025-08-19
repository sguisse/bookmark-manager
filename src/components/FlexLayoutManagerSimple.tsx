import React, { useState, useMemo } from 'react';
import { Layout, Model, TabNode, IJsonModel } from 'flexlayout-react';
import { useBookmarks } from '../contexts/BookmarkContext';
import { BookmarkGroup, Bookmark } from '../types/bookmark';
import { GroupBookmarkList } from './GroupBookmarkList';
import { BookmarkForm } from './BookmarkForm';
import { GroupForm } from './GroupForm';
import { Plus, Settings, X } from 'lucide-react';
import 'flexlayout-react/style/light.css';

interface FlexLayoutManagerProps {
  searchQuery: string;
}

export const FlexLayoutManagerSimple: React.FC<FlexLayoutManagerProps> = ({ searchQuery }) => {
  const {
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
    addBookmark,
    updateBookmark,
    deleteBookmark
  } = useBookmarks();

  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BookmarkGroup | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<{ bookmark: Bookmark; groupId: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Configuration du layout basée sur les groupes
  const model = useMemo(() => {
    const layoutConfig: IJsonModel = {
      global: {
        tabSetEnableClose: false,
        tabSetEnableDrop: true,
        tabSetEnableDrag: true,
        tabEnableClose: false,
        tabEnableRename: true,
        tabSetMinWidth: 250,
        tabSetMinHeight: 200
      },
      borders: [
        {
          type: 'border',
          location: 'bottom',
          size: 50,
          children: [
            {
              type: 'tab',
              id: 'controls',
              name: 'Contrôles',
              component: 'Controls',
              enableClose: false
            }
          ]
        }
      ],
      layout: {
        type: 'row',
        weight: 100,
        children: groups.length === 0 ? [
          {
            type: "tabset",
            children: [
              {
                type: "tab",
                id: 'welcome',
                name: 'Bienvenue',
                component: 'Welcome'
              }
            ]
          }
        ] : groups.map((group) => ({
          type: "tabset",
          id: `tabset-${group.id}`,
          weight: 100 / groups.length,
          children: [
            {
              type: "tab",
              id: `tab-${group.id}`,
              name: group.title,
              component: 'BookmarkGroup',
              config: { groupId: group.id }
            }
          ]
        }))
      }
    };

    return Model.fromJson(layoutConfig);
  }, [groups]);

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    const config = node.getConfig();

    switch (component) {
      case 'BookmarkGroup': {
        const groupId = config?.groupId;
        const group = groups.find(g => g.id === groupId);

        if (!group) return <div>Groupe non trouvé</div>;

        const filteredBookmarks = group.bookmarks.filter(bookmark =>
          bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <div className="flex-layout-group">
            <div className="group-header">
              <div
                className="group-color"
                style={{ backgroundColor: group.color }}
              />
              <h3>{group.title}</h3>
              <div className="group-actions">
                <button
                  className="btn-icon"
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setEditingBookmark(null);
                    setShowBookmarkForm(true);
                  }}
                  title="Ajouter un bookmark"
                >
                  <Plus size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => {
                    setEditingGroup(group);
                    setShowGroupForm(true);
                  }}
                  title="Éditer le groupe"
                >
                  <Settings size={16} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe et tous ses bookmarks ?')) {
                      deleteGroup(group.id);
                    }
                  }}
                  title="Supprimer le groupe"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <GroupBookmarkList
              bookmarks={filteredBookmarks}
              groupId={group.id}
              onEdit={(bookmark) => {
                setEditingBookmark({ bookmark, groupId: group.id });
                setSelectedGroupId('');
                setShowBookmarkForm(true);
              }}
              onDelete={(bookmarkId) => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce bookmark ?')) {
                  deleteBookmark(group.id, bookmarkId);
                }
              }}
            />
          </div>
        );
      }

      case 'Controls':
        return (
          <div className="layout-controls">
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingGroup(null);
                setShowGroupForm(true);
              }}
            >
              <Plus size={16} />
              Nouveau Groupe
            </button>
            <span className="controls-info">
              Faites glisser les onglets pour réorganiser les groupes • Redimensionnez les panneaux
            </span>
          </div>
        );

      case 'Welcome':
        return (
          <div className="welcome-message">
            <h2>Bienvenue dans votre gestionnaire de bookmarks</h2>
            <p>Créez votre premier groupe pour commencer</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingGroup(null);
                setShowGroupForm(true);
              }}
            >
              <Plus size={16} />
              Créer un groupe
            </button>
          </div>
        );

      default:
        return <div>Composant non reconnu: {component}</div>;
    }
  };

  return (
    <>
      <div className="flex-layout-container">
        <Layout
          model={model}
          factory={factory}
        />
      </div>

      {/* Modals */}
      {showBookmarkForm && (
        <BookmarkForm
          initialData={editingBookmark ? {
            title: editingBookmark.bookmark.title,
            url: editingBookmark.bookmark.url,
            description: editingBookmark.bookmark.description,
            tags: editingBookmark.bookmark.tags,
            groupId: editingBookmark.groupId
          } : {
            groupId: selectedGroupId
          }}
          bookmarkId={editingBookmark?.bookmark.id}
          onClose={() => {
            setShowBookmarkForm(false);
            setEditingBookmark(null);
            setSelectedGroupId('');
          }}
        />
      )}

      {showGroupForm && (
        <GroupForm
          initialData={editingGroup ? {
            id: editingGroup.id,
            title: editingGroup.title,
            color: editingGroup.color
          } : undefined}
          onClose={() => {
            setShowGroupForm(false);
            setEditingGroup(null);
          }}
        />
      )}
    </>
  );
};
