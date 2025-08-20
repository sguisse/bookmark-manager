import { Draggable } from 'react-beautiful-dnd';
import { BookmarkGroup } from '../types/bookmark';
import { DroppableGroup } from './DroppableGroup';

interface DraggableGroupProps {
  readonly group: BookmarkGroup;
  readonly index: number;
  readonly onEdit: (group: BookmarkGroup) => void;
  readonly onDelete: (id: string) => void;
  readonly onAddBookmark: (groupId: string) => void;
}

export function DraggableGroup({ group, index, onEdit, onDelete, onAddBookmark }: DraggableGroupProps) {
  return (
    <Draggable draggableId={`group-${group.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(1deg)`
              : provided.draggableProps.style?.transform,
            transition: 'opacity 0.2s ease',
            marginBottom: '16px'
          }}
        >
          <div
            {...provided.dragHandleProps}
            style={{
              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
              padding: '4px 8px',
              backgroundColor: snapshot.isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderRadius: '8px 8px 0 0',
              borderLeft: `4px solid ${group.color}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#374151',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'currentColor',
              borderRadius: '50%',
              opacity: 0.5
            }} />
            <span>{group.title}</span>
            <div style={{ fontSize: '12px', opacity: 0.6 }}>
              ({group.bookmarks.length} bookmark{group.bookmarks.length !== 1 ? 's' : ''})
            </div>
          </div>

          <DroppableGroup
            group={group}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddBookmark={onAddBookmark}
          />
        </div>
      )}
    </Draggable>
  );
}
