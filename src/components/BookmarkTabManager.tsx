import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useBookmarks } from '../contexts/BookmarkContext';
import { DraggableGroup } from './DraggableGroup';
import { BookmarkForm } from './BookmarkForm';
import { GroupForm } from './GroupForm';
import { BookmarkGroup, Bookmark } from '../types/bookmark';

export const BookmarkTabManager: React.FC = () => {
  const {
    groups,
    reorderGroups,
    moveBookmark,
    deleteGroup
  } = useBookmarks();

  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BookmarkGroup | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<{ bookmark: Bookmark; groupId: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (type === 'group') {
      // Réorganiser les groupes
      reorderGroups(source.index, destination.index);
    } else if (type === 'bookmark') {
      // Déplacer un bookmark
      moveBookmark(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      );
    }
  };

  const handleEditGroup = (group: BookmarkGroup) => {
    setEditingGroup(group);
    setShowGroupForm(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe et tous ses bookmarks ?')) {
      deleteGroup(groupId);
    }
  };

  const handleAddBookmark = (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowBookmarkForm(true);
  };

  return (
    <div className="bookmark-manager">


      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="groups" type="group">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="groups-container"
              style={{ padding: '20px' }}
            >
              {groups.map((group, index) => (
                <DraggableGroup
                  key={group.id}
                  group={group}
                  index={index}
                  onEdit={handleEditGroup}
                  onDelete={handleDeleteGroup}
                  onAddBookmark={handleAddBookmark}
                />
              ))}
              {provided.placeholder}

              {groups.length === 0 && (
                <div className="empty-state">
                  <h3>Aucun groupe de bookmarks</h3>
                  <p>Commencez par créer votre premier groupe de bookmarks</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowGroupForm(true)}
                  >
                    Créer un groupe
                  </button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
    </div>
  );
};
