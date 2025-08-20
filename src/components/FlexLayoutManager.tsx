import React, { useState, useRef, useMemo } from 'react';
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

export const FlexLayoutManager: React.FC<FlexLayoutManagerProps> = ({ searchQuery }) => {
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
    const tabsets = groups.map((group) => ({
      type: "tabset" as const,
      id: `tabset-${group.id}`,
      children: [
        {
          type: "tab" as const,
          id: `tab-${group.id}`,
          name: group.title,
          component: 'BookmarkGroup',
          config: { groupId: group.id }
        }
      ],
      minWidth: 250,
      minHeight: 200
    }));

    const getLayoutChildren = () => {
      if (groups.length === 0) {
        return [
          {
            type: "tabset" as const,
            children: [
              {
                type: "tab" as const,
                id: 'welcome',
                name: 'Bienvenue',
                component: 'Welcome'
              }
            ]
          }
        ];
      }

      if (groups.length === 1) {
        return [tabsets[0]];
      }

      if (groups.length <= 2) {
        return tabsets;
      }

      return [
        {
          type: "row" as const,
          weight: 60,
          children: tabsets.slice(0, 2)
        },
        {
          type: "row" as const,
          weight: 40,
          children: tabsets.slice(2)
        }
      ];
    };

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
          size: 40,
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
        children: getLayoutChildren()
      }
    };

    return Model.fromJson(layoutConfig);
  }, [groups]);

  // Configuration initiale du layout FlexLayout basée sur les groupes
  const createLayoutModel = (): IJsonModel => {
    const tabsets = groups.map((group, index) => ({
      type: 'tabset',
      id: `tabset-${group.id}`,
      children: [
        {
          type: 'tab',
          id: `tab-${group.id}`,
          name: group.title,
          component: 'BookmarkGroup',
          config: { groupId: group.id }
        }
      ],
      // Positionnement par défaut en grille
      weight: index < 2 ? 50 : 25, // Première ligne plus grande
      minWidth: 250,
      minHeight: 200
    }));

    return {
      global: {
        tabSetEnableClose: false,
        tabSetEnableDrop: true,
        tabSetEnableDrag: true,
        tabSetEnableTabStrip: true,
        tabEnableClose: false,
        tabEnableRename: true,
        tabSetMinWidth: 250,
        tabSetMinHeight: 200,
        borderEnableAutoHide: false
      },
      borders: [
        {
          type: 'border',
          location: 'bottom',
          size: 40,
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
        children: groups.length > 0 ? (
          groups.length === 1 ? [tabsets[0]] :
          groups.length <= 2 ? tabsets :
          [
            {
              type: 'row',
              weight: 60,
              children: tabsets.slice(0, 2)
            },
            {
              type: 'row',
              weight: 40,
              children: tabsets.slice(2)
            }
          ]
        ) : [
          {
            type: 'tabset',
            children: [
              {
                type: 'tab',
                id: 'welcome',
                name: 'Bienvenue',
                component: 'Welcome'
              }
            ]
          }
        ]
      }
    };
  };

  const [model] = useState(() => Model.fromJson(createLayoutModel()));

  // Re-créer le model quand les groupes changent
  React.useEffect(() => {
    const newModel = Model.fromJson(createLayoutModel());
    if (layoutRef.current) {
      layoutRef.current.doAction(Actions.updateModelAttributes(newModel.toJson()));
    }
  }, [groups.length]);

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
          (bookmark.description && bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
              onEdit={(bookmark) => {
                setEditingBookmark({ bookmark, groupId: group.id });
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
              Faites glisser les onglets pour réorganiser les groupes
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

  const onAction = (action: Action): Action | undefined => {
    console.log('FlexLayout Action:', action);

    // Gérer le renommage des onglets
    if (action.type === 'rename_tab') {
      const tabId = action.data.node;
      const newName = action.data.text;

      // Extraire l'ID du groupe depuis l'ID de l'onglet
      const groupId = tabId.replace('tab-', '');
      const group = groups.find(g => g.id === groupId);

      if (group && newName !== group.title) {
        updateGroup(groupId, { title: newName });
      }
    }

    return action;
  };

  return (
    <>
      <div className="flex-layout-container">
        <Layout
          ref={layoutRef}
          model={model}
          factory={factory}
          onAction={onAction}
        />
      </div>

      {/* Modals */}
      {showBookmarkForm && (
        <BookmarkForm
          bookmark={editingBookmark?.bookmark}
          groupId={selectedGroupId || editingBookmark?.groupId || ''}
          onSave={(bookmarkData) => {
            if (editingBookmark) {
              updateBookmark(editingBookmark.groupId, editingBookmark.bookmark.id, bookmarkData);
            } else {
              addBookmark(selectedGroupId, bookmarkData);
            }
            setShowBookmarkForm(false);
            setEditingBookmark(null);
            setSelectedGroupId('');
          }}
          onCancel={() => {
            setShowBookmarkForm(false);
            setEditingBookmark(null);
            setSelectedGroupId('');
          }}
        />
      )}

      {showGroupForm && (
        <GroupForm
          group={editingGroup}
          onSave={(groupData) => {
            if (editingGroup) {
              updateGroup(editingGroup.id, groupData);
            } else {
              addGroup(groupData);
            }
            setShowGroupForm(false);
            setEditingGroup(null);
          }}
          onCancel={() => {
            setShowGroupForm(false);
            setEditingGroup(null);
          }}
        />
      )}
    </>
  );
};
