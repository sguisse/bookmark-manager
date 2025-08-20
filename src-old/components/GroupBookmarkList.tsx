import React from 'react';
import { BookmarkCard } from './BookmarkCard';
import { Bookmark } from '../types/bookmark';

interface GroupBookmarkListProps {
  bookmarks: Bookmark[];
  groupId: string;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
}

export const GroupBookmarkList: React.FC<GroupBookmarkListProps> = ({
  bookmarks,
  groupId,
  onEdit,
  onDelete,
}) => {
  if (bookmarks.length === 0) {
    return (
      <div className="empty-bookmarks">
        <p>Aucun bookmark dans ce groupe</p>
      </div>
    );
  }

  return (
    <div className="group-bookmarks-list">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          groupId={groupId}
          onEdit={() => onEdit(bookmark)}
        />
      ))}
    </div>
  );
};
