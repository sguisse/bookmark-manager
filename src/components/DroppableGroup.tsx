import { Droppable } from 'react-beautiful-dnd';
import { BookmarkGroup } from '../types/bookmark';
import { DraggableBookmarkCard } from './DraggableBookmarkCard';
import { GroupHeader } from './GroupHeader';

interface DroppableGroupProps {
  readonly group: BookmarkGroup;
  readonly onEdit: (group: BookmarkGroup) => void;
  readonly onDelete: (id: string) => void;
  readonly onAddBookmark: (groupId: string) => void;
}

export function DroppableGroup({ group, onEdit, onDelete, onAddBookmark }: DroppableGroupProps) {
  return (
    <div className="bookmark-group">
      <GroupHeader
        group={group}
        onEdit={onEdit}
        onAddBookmark={onAddBookmark}
      />

      <Droppable droppableId={group.id} type="bookmark">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`bookmark-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            style={{
              minHeight: '100px',
              padding: '8px',
              backgroundColor: snapshot.isDraggingOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderRadius: '8px',
              border: snapshot.isDraggingOver ? '2px dashed #3b82f6' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            {group.bookmarks.map((bookmark, index) => (
              <DraggableBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                index={index}
                groupId={group.id}
              />
            ))}
            {provided.placeholder}

            {group.bookmarks.length === 0 && (
              <div className="empty-group-message">
                <p>Aucun bookmark dans ce groupe</p>
                <p className="text-sm text-gray-500">Glissez des bookmarks ici ou utilisez le bouton + pour en ajouter</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
