import React, { useState, useMemo } from 'react';
import { Layout, Model, TabNode } from 'flexlayout-react';
import { useBookmarks } from '../contexts/BookmarkContext';
import { BookmarkGroup, Bookmark } from '../types/bookmark';
import { DroppableGroupBookmarkList } from './DroppableGroupBookmarkList';
import { HeaderPanel } from './layout/HeaderPanel';
import { BookmarkForm } from './BookmarkForm';
import { GroupForm } from './GroupForm';
import { Plus } from 'lucide-react';
import { FlexLayoutService } from '../services/flexLayoutService';
import 'flexlayout-react/style/light.css';

interface FlexLayoutManagerProps {
  searchQuery: string;
}

export const FlexLayoutManager: React.FC<FlexLayoutManagerProps> = ({ searchQuery }) => {
  const {
    groups,
    deleteGroup,
    deleteBookmark,
    notifySaved
  } = useBookmarks();

  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BookmarkGroup | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<{ bookmark: Bookmark; groupId: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Function to handle expand/collapse all cards in a group
  const handleExpandCollapseAll = (groupId: string, expand: boolean) => {
    // Dispatch a custom event that bookmark cards can listen to
    const event = new CustomEvent('toggleAllCards', {
      detail: { groupId, expand }
    });
    window.dispatchEvent(event);
  };

  // Use saved config if present, otherwise use default layout
  const model = useMemo(() => {
    const savedConfig = FlexLayoutService.loadConfig();
    if (savedConfig) {
      return Model.fromJson(savedConfig);
    }

    // Get base default config from service
    const defaultConfig = FlexLayoutService.getDefaultConfig();

    // Customize layout children based on current groups
    defaultConfig.layout.children =
      groups.length === 0
        ? [
            {
              type: 'tabset',
              weight: 100,
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
        : groups.map((group) => ({
            type: 'tabset',
            id: `tabset-${group.id}`,
            weight: 100 / groups.length,
            children: [
              {
                type: 'tab',
                id: `tab-${group.id}`,
                name: group.title,
                component: 'BookmarkGroup',
                config: { groupId: group.id }
              }
            ]
          }));

    return Model.fromJson(defaultConfig);
  }, [groups]);

  // Save layout config to localStorage and notify UI when model changes
  React.useEffect(() => {
    FlexLayoutService.saveConfig(model.toJson());
    notifySaved();
  }, [model, notifySaved]);

  // Handle layout actions and save when changes occur
  const onAction = (action: any) => {
    console.log('[FlexLayout] Action:', action.type, action);

    // Save layout when changes are made (but not during drag)
    if (action.type?.match(/move|model|add|remove|close|rename|split|drag/i)) {
      if (!action.type.includes('drag')) {
        console.log('[FlexLayout] Saving layout after action:', action.type);
        // The save will be handled by the useEffect above when model changes
        setTimeout(() => {
          FlexLayoutService.saveConfig(model.toJson());
          notifySaved();
        }, 0);
      }
    }
    return action;
  };

  // Personnalisation des onglets - ajouter la couleur du groupe
  const onRenderTab = (node: TabNode, renderValues: any) => {
    const config = node.getConfig();
    const groupId = config?.groupId;
    const group = groups.find(g => g.id === groupId);

    if (node.getComponent() === 'BookmarkGroup' && group) {
      // Ajouter la couleur du groupe avant le contenu de l'onglet
      renderValues.leading = (
        <div
          className="group-color"
          style={{
            backgroundColor: group.color,
            width: '4px',
            height: '16px',
            borderRadius: '2px',
            marginRight: '8px',
            display: 'inline-block'
          }}
        />
      );
    }
  };

  // Personnalisation des tabsets - ajouter les boutons d'action dans la toolbar
  const onRenderTabSet = (tabSetNode: any, renderValues: any) => {
    const selectedTabNode = tabSetNode.getSelectedNode();

    if (selectedTabNode && selectedTabNode.getComponent() === 'BookmarkGroup') {
      const config = selectedTabNode.getConfig();
      const groupId = config?.groupId;
      const group = groups.find(g => g.id === groupId);

      if (group) {
        // Ajouter les boutons d'action à la toolbar du tabset
        renderValues.buttons = renderValues.buttons || [];

        // Bouton ouvrir tous les liens du groupe
        renderValues.buttons.push(
          <button
            key="open-all-urls"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              group.bookmarks.forEach(bm => {
                if (bm.url) {
                  window.open(bm.url, '_blank', 'noopener,noreferrer');
                }
              });
            }}
            title="Ouvrir tous les liens du groupe"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: '1em', height: '1em', display: 'flex', alignItems: 'center' }}
            >
              <path d="M14 3h7v7" />
              <path d="M5 12v-3a4 4 0 0 1 4-4h7" />
              <path d="M3 21h18" />
            </svg>
          </button>
        );

        // Expand all cards button
        renderValues.buttons.push(
          <button
            key="expand-all"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleExpandCollapseAll(group.id, true);
            }}
            title="Développer toutes les cartes"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: '1em', height: '1em', display: 'flex', alignItems: 'center' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        );

        // Collapse all cards button
        renderValues.buttons.push(
          <button
            key="collapse-all"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleExpandCollapseAll(group.id, false);
            }}
            title="Réduire toutes les cartes"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: '1em', height: '1em', display: 'flex', alignItems: 'center' }}
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
        );

        renderValues.buttons.push(
          <button
            key="add-bookmark"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedGroupId(group.id);
              setEditingBookmark(null);
              setShowBookmarkForm(true);
            }}
            title="Ajouter un bookmark"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: '1em', height: '1em', display: 'flex', alignItems: 'center' }}
            >
              <path d="M5 12h14M12 5v14" />
            </svg>
          </button>
        );

        renderValues.buttons.push(
          <button
            key="edit-group"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setEditingGroup(group);
              setShowGroupForm(true);
            }}
            title="Éditer le groupe"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: '1em', height: '1em', display: 'flex', alignItems: 'center' }}
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        );

        renderValues.buttons.push(
          <button
            key="delete-group"
            className="flexlayout__tab_toolbar_button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe et tous ses bookmarks ?')) {
                deleteGroup(group.id);
              }
            }}
            title="Supprimer le groupe"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: '1em', height: '1em', display: 'flex', alignItems: 'center' }}
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        );
      }
    }
  };

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
            <DroppableGroupBookmarkList
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
                  // Save after delete
                  setTimeout(() => {
                    FlexLayoutService.saveConfig(model.toJson());
                    notifySaved();
                  }, 0);
                }
              }}
            />
          </div>
        );
      }

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
          onRenderTab={onRenderTab}
          onRenderTabSet={onRenderTabSet}
          onAction={onAction}
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
            // Save after add/edit
            setTimeout(() => {
              FlexLayoutService.saveConfig(model.toJson());
              notifySaved();
            }, 0);
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
            // Save after add/edit
            setTimeout(() => {
              FlexLayoutService.saveConfig(model.toJson());
              notifySaved();
            }, 0);
          }}
        />
      )}
    </>
  );
};
