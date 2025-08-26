import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookmarkForm from './BookmarkForm';
import { Bookmark, BookmarkFormData, BookmarksTabConfig } from '../../types/bookmark';
import BookmarkTableRow from './BookmarksViewer';
import { useBookmarkDragDrop } from '../../contexts/BookmarkDragDropContext';
import { crossTabBookmarkService } from '../../services/CrossTabBookmarkService';

interface BookmarksTabProps {
  config?: BookmarksTabConfig;
  onConfigChange?: (cfg: BookmarksTabConfig) => void;
  nodeId?: string;
}

// Draggable bookmark row component (moved outside to prevent re-creation on renders)
interface DraggableBookmarkRowProps {
  bookmark: Bookmark;
  index: number;
  nodeId: string; // Add nodeId for cross-tab drag support
  tableRowViewMode: 'card' | 'row';
  draggedBookmark: Bookmark | null;
  dragOverIndex: number | null;
  dropPosition: 'before' | 'after';
  crossTabDragOverIndex: number | null; // Cross-tab drag state
  crossTabDropPosition: 'before' | 'after';
  globalDraggedBookmark: Bookmark | null; // Global drag state
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onToggleCollapsed: (bookmarkId: string) => void;
  onDragStart: (bookmark: Bookmark) => void;
  onDragEnd: () => void;
  onDragOver: (index: number, position: 'before' | 'after') => void;
  onDrop: (targetIndex: number, position: 'before' | 'after') => void;
  onDragOverIndexChange: (index: number | null) => void;
}

function DraggableBookmarkRow({
  bookmark,
  index,
  nodeId,
  tableRowViewMode,
  draggedBookmark,
  dragOverIndex,
  dropPosition,
  crossTabDragOverIndex,
  crossTabDropPosition,
  globalDraggedBookmark,
  onEdit,
  onDelete,
  onToggleCollapsed,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragOverIndexChange
}: Readonly<DraggableBookmarkRowProps>) {
  // Check if this row is being dragged over (either local or cross-tab)
  const isDraggedOver = dragOverIndex === index || crossTabDragOverIndex === index;
  const currentDropPosition = crossTabDragOverIndex === index ? crossTabDropPosition : dropPosition;

  // Check if this is the dragged item (either local or cross-tab)
  const isDragged = draggedBookmark?.id === bookmark.id;

  // Get the current dragged bookmark (prioritize local, then global)
  const currentDraggedBookmark = draggedBookmark || globalDraggedBookmark;

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-label={`Drag to reorder bookmark: ${bookmark.title}`}
      style={{ position: 'relative' }}
      draggable
      onDragStart={(e) => {
        onDragStart(bookmark);

        // Create custom drag image with minimal content
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
          position: fixed;
          top: -1000px;
          left: -1000px;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.95);
          color: white;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;

        // Add icon and title to drag image
        const icon = bookmark.icon || '🌐';
        if (bookmark.icon && (bookmark.icon.startsWith('http') || bookmark.icon.startsWith('data:'))) {
          dragImage.innerHTML = `<img src="${bookmark.icon}" style="width: 16px; height: 16px; border-radius: 2px;"> ${bookmark.title}`;
        } else {
          dragImage.innerHTML = `<span style="font-size: 16px;">${icon}</span> ${bookmark.title}`;
        }

        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 20, 20);

        // Clean up drag image after a short delay
        setTimeout(() => {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        }, 100);

        // Set both simple and cross-tab drag data
        e.dataTransfer.setData('text/plain', bookmark.id);
        e.dataTransfer.setData('application/x-bookmark-cross-tab',
          crossTabBookmarkService.createDragData(bookmark, nodeId, index)
        );
        e.dataTransfer.effectAllowed = 'move';
        console.log('[DraggableBookmarkRow] Drag started for:', bookmark.title, 'from node:', nodeId);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const elementHeight = rect.height;
        const position = mouseY < elementHeight / 2 ? 'before' : 'after';
        onDragOver(index, position);
      }}
      onDrop={(e) => {
        e.preventDefault();
        console.log('[DraggableBookmarkRow] Drop event received at index:', index);
        onDrop(index, currentDropPosition);
      }}
      onDragLeave={(e) => {
        // Only clear if leaving the element boundary, not child elements
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          onDragOverIndexChange(null);
        }
      }}
      onKeyDown={(e) => {
        // Handle keyboard navigation for accessibility
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Could implement keyboard-based reordering here
        }
      }}
    >
      {/* Drop preview before */}
      {isDraggedOver && currentDropPosition === 'before' && currentDraggedBookmark && (
        <div
          style={{
            position: 'relative',
            margin: '3px 0',
            opacity: 0.6,
            transform: 'scale(0.98)',
            border: '2px dashed #3b82f6',
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.05)',
            padding: '8px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#3b82f6',
            fontSize: '14px',
            fontWeight: 500
          }}>
            <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', opacity: 0.7 }}>
                {globalDraggedBookmark ? '�' : '�📄'}
              </span>
            </div>
            <span>{currentDraggedBookmark.title}</span>
            {globalDraggedBookmark && <span style={{ fontSize: '12px', opacity: 0.7 }}>(from other tab)</span>}
          </div>
        </div>
      )}

      {/* Actual bookmark */}
      <div
        style={{
          opacity: isDragged ? 0.5 : 1,
          transform: isDragged ? 'rotate(2deg)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <BookmarkTableRow
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleCollapsed={onToggleCollapsed}
          view={tableRowViewMode}
          isDragging={isDragged}
        />
      </div>

      {/* Drop preview after */}
      {isDraggedOver && currentDropPosition === 'after' && currentDraggedBookmark && (
        <div
          style={{
            position: 'relative',
            margin: '3px 0',
            opacity: 0.6,
            transform: 'scale(0.98)',
            border: '2px dashed #3b82f6',
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.05)',
            padding: '8px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#3b82f6',
            fontSize: '14px',
            fontWeight: 500
          }}>
            <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', opacity: 0.7 }}>
                {globalDraggedBookmark ? '🔄' : '📄'}
              </span>
            </div>
            <span>{currentDraggedBookmark.title}</span>
            {globalDraggedBookmark && <span style={{ fontSize: '12px', opacity: 0.7 }}>(from other tab)</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookmarksTabManager(props: Readonly<BookmarksTabProps> = {}) {
  const { config, onConfigChange, nodeId } = props;
  const [isBookmarkFormOpen, setIsBookmarkFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // Get global drag-drop context
  const { dragState, startDrag, endDrag, isExternalDrag } = useBookmarkDragDrop();

  const bookmarks = config?.bookmarks || [];
  const [tableRowViewMode, setTableRowViewMode] = useState<'card' | 'row'>(config?.viewMode || 'row');

  // Local drag and drop state for internal reordering
  const [draggedBookmark, setDraggedBookmark] = useState<Bookmark | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');

  // Cross-tab drag state
  const [crossTabDragOverIndex, setCrossTabDragOverIndex] = useState<number | null>(null);
  const [crossTabDropPosition, setCrossTabDropPosition] = useState<'before' | 'after'>('after');

  // State for tracking drag over empty container
  const [isDragOverEmptyContainer, setIsDragOverEmptyContainer] = useState(false);

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkFormOpen(true);
  };

  // Handle individual bookmark collapsed toggle
  const handleToggleCollapsed = (bookmarkId: string) => {
    if (!onConfigChange) return;

    const updatedBookmarks = bookmarks.map(b =>
      b.id === bookmarkId
        ? { ...b, collapsed: !(b.collapsed ?? true) }
        : b
    );

    onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updatedBookmarks });
  };

  // Try to open all URLs with a best-effort strategy:
  // 1) Attempt to open placeholder windows synchronously during the user gesture.
  // 2) If none could be created, open a helper window that asks the user to click
  //    to allow opening multiple tabs (usable when popups are blocked).
  // 3) Fallback to direct window.open for any remaining URLs.
  const openAllUrls = (urls: string[]) => {
    if (!urls || urls.length === 0) return;

    console.log('Opening all URLs as tabs in current window...');

    try {
      // Simple approach: Open all URLs as tabs in the current browser window
      // No separate windows, no complex logic - just open each URL with small delays
      urls.forEach((url, index) => {
        setTimeout(() => {
          try {
            // Open each URL in a new tab (_blank) in the current window
            window.open(url, '_blank', 'noopener,noreferrer');
            console.log('Opened URL in new tab:', url);
          } catch (err) {
            console.warn('Failed to open URL:', url, err);
          }
        }, index * 100); // 100ms delay between each to avoid popup blocking
      });

      console.log(`Scheduled ${urls.length} URLs to open as tabs`);
    } catch (err) {
      console.warn('openAllUrls failed:', err);
    }
  };

  const handleDelete = (bookmarkId: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    if (onConfigChange) {
      onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    } else {
      console.log('Delete bookmark', bookmarkId);
    }
  };

  // Enhanced drag and drop functions for cross-tab support
  const handleDragStart = (bookmark: Bookmark) => {
    console.log('[BookmarksTabManager] Starting drag for bookmark:', bookmark.title, 'in node:', nodeId);

    // Set local drag state
    setDraggedBookmark(bookmark);

    // Set global drag state for cross-tab support
    const bookmarkIndex = bookmarks.findIndex(b => b.id === bookmark.id);
    if (nodeId) {
      startDrag(bookmark, nodeId, bookmarkIndex);
    }
  };

  const handleDragEnd = () => {
    console.log('[BookmarksTabManager] Ending drag in node:', nodeId);

    // Clear local drag state
    setDraggedBookmark(null);
    setDragOverIndex(null);
    setDropPosition('after');

    // Clear cross-tab drag state
    setCrossTabDragOverIndex(null);
    setCrossTabDropPosition('after');

    // Clear empty container drag state
    setIsDragOverEmptyContainer(false);

    // Clear global drag state
    endDrag();
  };

  const handleDragOver = (index: number, position: 'before' | 'after') => {
    if (!nodeId) return;

    // Check if this is a cross-tab drag
    if (isExternalDrag(nodeId)) {
      console.log('[BookmarksTabManager] Cross-tab drag over at index:', index, 'position:', position);
      setCrossTabDragOverIndex(index);
      setCrossTabDropPosition(position);
      // Clear empty container state when dragging over specific items
      setIsDragOverEmptyContainer(false);
    } else if (draggedBookmark) {
      // Internal drag within same tab
      setDragOverIndex(index);
      setDropPosition(position);
    }
  };

  const handleDrop = (targetIndex: number, position: 'before' | 'after') => {
    if (!nodeId || !onConfigChange) return;

    console.log('[BookmarksTabManager] Drop event at index:', targetIndex, 'position:', position, 'in node:', nodeId);

    // Check if this is a cross-tab drop
    if (isExternalDrag(nodeId) && dragState.draggedBookmark && dragState.sourceNodeId) {
      console.log('[BookmarksTabManager] Handling cross-tab drop');

      // Use the stored cross-tab drag state for accurate positioning
      const finalIndex = crossTabDragOverIndex ?? targetIndex;
      const finalPosition = crossTabDragOverIndex !== null ? crossTabDropPosition : position;

      console.log('[BookmarksTabManager] Cross-tab drop - using stored state - index:', finalIndex, 'position:', finalPosition);

      // Calculate insertion index
      let insertIndex = finalPosition === 'before' ? finalIndex : finalIndex + 1;

      // Create a copy of the bookmark for the new tab
      const newBookmark = {
        ...dragState.draggedBookmark,
        id: uuidv4(), // Generate new ID to avoid conflicts
        createdDate: new Date(),
        lastModifiedDate: new Date()
      };

      // Insert the bookmark at the target position
      const newBookmarks = [...bookmarks];
      newBookmarks.splice(insertIndex, 0, newBookmark);

      // Update the config with the new bookmark
      onConfigChange({
        ...(config || {} as BookmarksTabConfig),
        bookmarks: newBookmarks
      });

      // Request removal from source tab using the service
      crossTabBookmarkService.requestMove(
        dragState.draggedBookmark,
        dragState.sourceNodeId,
        nodeId,
        finalIndex,
        finalPosition
      );

      // Clear states
      setCrossTabDragOverIndex(null);
      setCrossTabDropPosition('after');
      endDrag();
      return;
    }

    // Handle internal drop (same tab reordering)
    if (!draggedBookmark) return;

    const draggedIndex = bookmarks.findIndex(b => b.id === draggedBookmark.id);
    if (draggedIndex === -1) return;

    const newBookmarks = [...bookmarks];

    // Remove dragged item
    const [draggedItem] = newBookmarks.splice(draggedIndex, 1);

    // Calculate new insertion index
    let insertIndex: number;
    if (draggedIndex < targetIndex) {
      insertIndex = position === 'before' ? targetIndex - 1 : targetIndex;
    } else {
      insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    }

    // Insert at new position
    newBookmarks.splice(insertIndex, 0, draggedItem);

    onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });

    setDraggedBookmark(null);
    setDragOverIndex(null);
    setDropPosition('after');
  };

  const handleSubmit = (data: BookmarkFormData) => {
    // if editingBookmark is set, update existing
    if (editingBookmark) {
      const updated = bookmarks.map(b => b.id === editingBookmark.id ? { ...b, ...data } : b);
      onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
      setEditingBookmark(null);
      setIsBookmarkFormOpen(false);
      return;
    }

    // create new
    const newBookmark: Bookmark = {
      id: uuidv4(),
      title: data.title || '',
      url: data.url || '',
      description: data.description,
      tags: data.tags || [],
      collapsed: true, // Set collapsed by default
      createdDate: new Date(),
      lastModifiedDate: new Date()
    };

    const updated = [...bookmarks, newBookmark];
    onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
    setIsBookmarkFormOpen(false);
    setEditingBookmark(null);
  };

  // Listen for toolbar events dispatched from FlexLayoutManager for this node
  useEffect(() => {
    // Sync local state with config when it changes
    if (config?.viewMode && config.viewMode !== tableRowViewMode) {
      setTableRowViewMode(config.viewMode);
    }
  }, [config?.viewMode, tableRowViewMode]);

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
          // open add-bookmark form
          setEditingBookmark(null);
          setIsBookmarkFormOpen(true);
        }
      } catch (err) {
        console.warn('toolbar event handler error', err);
      }
    };

    const toggleAllTableRowsViewHandler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
          console.log('[BookmarksTabManager] Toggle handler triggered, current view:', tableRowViewMode);

          const newViewMode = tableRowViewMode === 'card' ? 'row' : 'card';
          console.log('[BookmarksTabManager] Switching to view:', newViewMode);

          setTableRowViewMode(newViewMode);

          // When toggling to table view (row), set all bookmarks to collapsed (true)
          // When toggling to card view, set all bookmarks to not collapsed (false)
          if (onConfigChange) {
            const updatedBookmarks = bookmarks.map(b => ({
              ...b,
              collapsed: newViewMode === 'row'
            }));

            // Save both the view mode and updated bookmarks to config
            onConfigChange({
              ...(config || {} as BookmarksTabConfig),
              viewMode: newViewMode,
              bookmarks: updatedBookmarks
            });
          }
        }
      } catch (err) {
        console.warn('toggle view handler error', err);
      }
    };

    window.addEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
    window.addEventListener('flexlayout:bookmarks:toggle-table-row-view', toggleAllTableRowsViewHandler as EventListener);

    const openAllHandler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ nodeId: string }>;
        if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
          const urls = bookmarks.map(b => b.url).filter(Boolean);
          if (urls.length === 0) return;
          openAllUrls(urls);
        }
      } catch (err) {
        console.warn('open-all handler error', err);
      }
    };

    window.addEventListener('flexlayout:bookmarks:open-all-urls', openAllHandler as EventListener);

    // Cross-tab bookmark transfer event listeners
    const crossTabRemoveHandler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ bookmarkId: string; sourceNodeId: string }>;
        if (ce?.detail?.sourceNodeId === nodeId && onConfigChange) {
          console.log('[BookmarksTabManager] Removing bookmark for cross-tab transfer:', ce.detail.bookmarkId);

          // Remove the bookmark from this tab
          const updatedBookmarks = bookmarks.filter(b => b.id !== ce.detail.bookmarkId);
          onConfigChange({
            ...(config || {} as BookmarksTabConfig),
            bookmarks: updatedBookmarks
          });
        }
      } catch (err) {
        console.warn('cross-tab remove handler error', err);
      }
    };

    window.addEventListener('bookmark:cross-tab:remove', crossTabRemoveHandler as EventListener);

    return () => {
      window.removeEventListener('flexlayout:bookmarks:toolbar', handler as EventListener);
      window.removeEventListener('flexlayout:bookmarks:toggle-table-row-view', toggleAllTableRowsViewHandler as EventListener);
      window.removeEventListener('flexlayout:bookmarks:open-all-urls', openAllHandler as EventListener);
      window.removeEventListener('bookmark:cross-tab:remove', crossTabRemoveHandler as EventListener);
    };
  }, [nodeId, bookmarks, tableRowViewMode, config, onConfigChange]);

  return (
    <section
      className="p-0"
      aria-label="Bookmark drop zone"
      onDragOver={(e) => {
        // Allow drops on the entire tab area for cross-tab support
        if (isExternalDrag(nodeId || '')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';

          // Show drop preview for empty container
          if (bookmarks.length === 0 || crossTabDragOverIndex === null) {
            setIsDragOverEmptyContainer(true);
          }
        }
      }}
      onDragLeave={(e) => {
        // Clear empty container drag state when leaving the container
        if (isExternalDrag(nodeId || '')) {
          // Only clear if we're actually leaving the container, not just moving to child elements
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          ) {
            setIsDragOverEmptyContainer(false);
          }
        }
      }}
      onDrop={(e) => {
        // Handle drops on empty areas (append to end)
        if (isExternalDrag(nodeId || '') && dragState.draggedBookmark && onConfigChange) {
          e.preventDefault();
          console.log('[BookmarksTabManager] Handling drop on tab container');

          // For drops on container (not specific bookmark), add to end
          // But check if we have stored cross-tab drag state for more accurate positioning
          let insertIndex = bookmarks.length;

          if (crossTabDragOverIndex !== null) {
            // If we have stored drag over state, use it for more accurate positioning
            insertIndex = crossTabDropPosition === 'before' ? crossTabDragOverIndex : crossTabDragOverIndex + 1;
            console.log('[BookmarksTabManager] Using stored drag state for container drop - index:', insertIndex);
          }

          // Add to the calculated position
          const newBookmark = {
            ...dragState.draggedBookmark,
            id: uuidv4(),
            createdDate: new Date(),
            lastModifiedDate: new Date()
          };

          const newBookmarks = [...bookmarks];
          newBookmarks.splice(insertIndex, 0, newBookmark);

          onConfigChange({
            ...(config || {} as BookmarksTabConfig),
            bookmarks: newBookmarks
          });

          // Request removal from source tab
          if (dragState.sourceNodeId) {
            crossTabBookmarkService.requestMove(
              dragState.draggedBookmark,
              dragState.sourceNodeId,
              nodeId || '',
              crossTabDragOverIndex ?? bookmarks.length,
              crossTabDropPosition
            );
          }

          // Clear states
          setCrossTabDragOverIndex(null);
          setCrossTabDropPosition('after');
          setIsDragOverEmptyContainer(false);
          endDrag();
        }
      }}
    >
      {bookmarks.length === 0 ? (
        <div className="text-secondary p-4 text-center">
          {isDragOverEmptyContainer && dragState.draggedBookmark ? (
            <div
              style={{
                margin: '10px',
                padding: '16px',
                border: '2px dashed #3b82f6',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: '#3b82f6',
                fontSize: '16px',
                fontWeight: 500
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px', opacity: 0.8 }}>🔄</span>
                </div>
                <span>{dragState.draggedBookmark.title}</span>
                <span style={{ fontSize: '14px', opacity: 0.7 }}>(from other tab)</span>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                Drop here to add to this tab
              </div>
            </div>
          ) : (
            'No bookmarks'
          )}
        </div>
      ) : (
        <div>

          <div className={`grid bookmark-grid-container ${tableRowViewMode === 'card' ? 'card-view' : ''}`} style={{ gap: tableRowViewMode === 'row' ? '2px' : '5px' }}>
            {bookmarks.map((b, index) => (
              <DraggableBookmarkRow
                key={b.id}
                bookmark={b}
                index={index}
                nodeId={nodeId || ''}
                tableRowViewMode={tableRowViewMode}
                draggedBookmark={draggedBookmark}
                dragOverIndex={dragOverIndex}
                dropPosition={dropPosition}
                crossTabDragOverIndex={crossTabDragOverIndex}
                crossTabDropPosition={crossTabDropPosition}
                globalDraggedBookmark={dragState.draggedBookmark}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleCollapsed={handleToggleCollapsed}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragOverIndexChange={setDragOverIndex}
              />
            ))}
          </div>
        </div>
      )}
      {isBookmarkFormOpen && (
        <div className="modal-overlay">
          <button
            onClick={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
            aria-label="Close modal"
            className="modal-backdrop"
          />
          <div className="modal-content">
            <BookmarkForm
              bookmark={editingBookmark}
              onSave={(d) => handleSubmit(d)}
              onCancel={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
