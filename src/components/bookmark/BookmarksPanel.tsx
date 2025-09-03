import React from 'react';
import BookmarkForm from './BookmarkForm';
import BookmarkTableRow from './BookmarksRenderer';
import { Bookmark } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';

export type SelectionState = any;

interface BookmarksPanelProps {
  bookmarks: Bookmark[];
  selectionState: SelectionState;
  isBookmarkFormOpen: boolean;
  editingBookmark: Bookmark | null;
  onSelect: (id: string, index: number, e: React.MouseEvent) => void;
  onEdit: (b: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleCollapsed: (id: string) => void;
  onSubmit: (data: any, editingBookmark: Bookmark | null) => void;
  onCloseForm: () => void;
}

export default function BookmarksPanel(props: Readonly<BookmarksPanelProps>) {
  const {
    bookmarks,
    selectionState,
    isBookmarkFormOpen,
    editingBookmark,
    onSelect,
    onEdit,
    onDelete,
    onToggleCollapsed,
    onSubmit,
    onCloseForm
  } = props;

  return (
    <div className="p-0">
      {bookmarks.length === 0 ? (
        <div className="text-secondary p-4 text-center">No bookmarks</div>
      ) : (
        <div className="grid" style={{ gap: '5px' }}>
          {bookmarks.map((b, i) => (
            <BookmarkTableRow key={b.id}
                              bookmark={b}
                              onSelect={(id, e) => onSelect(id, i, e)}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onToggleCollapsed={onToggleCollapsed}
                              isSelected={selectionState?.selectedIds?.includes(b.id)} />
          ))}
        </div>
      )}
      {isBookmarkFormOpen && (
        <div className="modal-overlay">
          <button
            onClick={() => { onCloseForm(); }}
            aria-label="Close modal"
            className="modal-backdrop"
          />
          <div className="modal-content">
            <BookmarkForm
              bookmark={editingBookmark}
              mode={editingBookmark?.id ? FormDisplayMode.Edit : FormDisplayMode.Create}
              onSave={(d) => onSubmit(d, editingBookmark)}
              onCancel={() => { onCloseForm(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { BookmarksPanel };
