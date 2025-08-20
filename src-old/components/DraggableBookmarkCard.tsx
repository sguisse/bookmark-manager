import { Draggable } from 'react-beautiful-dnd';
import { Bookmark } from '../types/bookmark';
import { BookmarkCard } from './BookmarkCard';

interface DraggableBookmarkCardProps {
  readonly bookmark: Bookmark;
  readonly index: number;
  readonly groupId: string;
}

export function DraggableBookmarkCard({ bookmark, index, groupId }: DraggableBookmarkCardProps) {
  return (
    <Draggable draggableId={bookmark.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(2deg)`
              : provided.draggableProps.style?.transform,
            transition: 'opacity 0.2s ease'
          }}
        >
          <BookmarkCard bookmark={bookmark} groupId={groupId} />
        </div>
      )}
    </Draggable>
  );
}
