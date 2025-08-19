import React, { useMemo } from 'react';
import { BookmarkCard } from './BookmarkCard';
import { GroupHeader } from './GroupHeader';
import { BookmarkGroup, Bookmark } from '../types/bookmark';
import { useBookmarks } from '../contexts/BookmarkContext';

interface BookmarkListProps {
  searchQuery: string;
  onEditBookmark: (bookmark: Bookmark) => void;
  onEditGroup: (group: BookmarkGroup) => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  searchQuery,
  onEditBookmark,
  onEditGroup,
}) => {
  const { state } = useBookmarks();

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return state.config.groups;
    }

    const query = searchQuery.toLowerCase();
    return state.config.groups.map(group => ({
      ...group,
      bookmarks: group.bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.description?.toLowerCase().includes(query) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(query))
      )
    })).filter(group => group.bookmarks.length > 0 || group.title.toLowerCase().includes(query));
  }, [state.config.groups, searchQuery]);

  if (filteredGroups.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#888',
        textAlign: 'center',
        padding: '40px'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>
          {searchQuery ? 'Aucun résultat trouvé' : 'Aucun bookmark'}
        </div>
        <div style={{ fontSize: '14px' }}>
          {searchQuery
            ? 'Essayez avec d\'autres termes de recherche'
            : 'Commencez par ajouter votre premier bookmark'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '16px' }}>
      {filteredGroups.map(group => (
        <div key={group.id} style={{ marginBottom: '24px' }}>
          <GroupHeader group={group} onEdit={onEditGroup} />

          {!group.collapsed && (
            <div className="bookmark-grid" style={{ padding: '0 8px' }}>
              {group.bookmarks.map(bookmark => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  groupColor={group.color}
                  onEdit={onEditBookmark}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
