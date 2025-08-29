import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookmarkForm from './BookmarkForm';
import { Bookmark, BookmarkFormData, BookmarksTabConfig } from '../../types/bookmark';
import { FormDisplayMode } from '../../types/app';
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
  onDrop: (targetIndex: number, position: 'before' | 'after', event: DragEvent | React.DragEvent) => void;
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

        // Check if this might be an external URL drop
        const hasUrlTypes = e.dataTransfer.types.includes('text/uri-list') ||
                           e.dataTransfer.types.includes('text/plain');

        // Set appropriate drop effect
        e.dataTransfer.dropEffect = hasUrlTypes ? 'copy' : 'move';

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const elementHeight = rect.height;
        const position = mouseY < elementHeight / 2 ? 'before' : 'after';
        onDragOver(index, position);
      }}
      onDrop={(e: React.DragEvent) => {
        e.preventDefault();
        console.log('[DraggableBookmarkRow] Drop event received at index:', index);
        onDrop(index, currentDropPosition, e);
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

  // When an external drop (from other apps) is received we open the create form
  // and remember the intended insertion point so the new bookmark is inserted
  // at the drop location when the user confirms.
  const [pendingExternalDropIndex, setPendingExternalDropIndex] = useState<number | null>(null);

  // State for tracking drag over empty container
  const [isDragOverEmptyContainer, setIsDragOverEmptyContainer] = useState(false);

  // Helper to extract a URL string from a DataTransfer object (if any)
  const extractUrlFromDataTransfer = (dt: DataTransfer | null | undefined): string | null => {
    if (!dt) return null;
    let url = '';
    try {
      if ((dt as any).getData) url = (dt as any).getData('text/uri-list') || '';
    } catch (err) {
      console.debug('No text/uri-list available on DataTransfer', err);
    }
    if (!url && (dt as any).getData) {
      const plain = (dt as any).getData('text/plain') || '';
      const trimmed = (plain || '').trim();
      try {
        if (trimmed) new URL(trimmed);
        url = trimmed;
      } catch (err) {
        console.debug('DataTransfer text/plain is not a valid URL', err);
      }
    }
    return url || null;
  };

  // Helper to convert image URL to base64 data URL
  const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Bookmark Manager)'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch favicon:', response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Ensure it's a proper data URL format
          if (result && result.startsWith('data:')) {
            resolve(result);
          } else {
            reject(new Error('Invalid data URL format'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    } catch (err) {
      console.warn('Failed to convert image to base64:', err);
      return null;
    }
  };

  // Helper to fetch title and favicon from URL
  const fetchUrlMetadata = async (url: string): Promise<{ title: string; favicon?: string; description?: string; keywords?: string }> => {
    try {
      console.log('Fetching metadata for URL:', url);

      // Use a CORS proxy or direct fetch (depending on CORS policy)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Bookmark Manager)'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch URL:', response.status, response.statusText);
        return { title: new URL(url).hostname };
      }

      const html = await response.text();

      // Parse HTML to extract title and favicon
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract title
      let title = doc.querySelector('title')?.textContent?.trim() || '';
      if (!title) {
        // Fallback to og:title or hostname
        title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
               new URL(url).hostname;
      }

      // Extract description
      let description = doc.querySelector('description')?.textContent?.trim() || '';
      if (!description) {
        // Fallback to og:description or empty
        description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
      }

      // Extract keywords
      let keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim() || '';


      // Extract favicon
      let faviconUrl = '';

      // Try different favicon selectors in order of preference
      const faviconSelectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
        'meta[property="og:image"]'
      ];

      for (const selector of faviconSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          faviconUrl = element.getAttribute('href') || element.getAttribute('content') || '';
          if (faviconUrl) break;
        }
      }

      // Make favicon URL absolute if it's relative
      if (faviconUrl && !faviconUrl.startsWith('http') && !faviconUrl.startsWith('data:')) {
        try {
          const baseUrl = new URL(url);
          if (faviconUrl.startsWith('//')) {
            faviconUrl = baseUrl.protocol + faviconUrl;
          } else if (faviconUrl.startsWith('/')) {
            faviconUrl = baseUrl.origin + faviconUrl;
          } else {
            faviconUrl = new URL(faviconUrl, url).href;
          }
        } catch (err) {
          console.warn('Failed to resolve favicon URL:', err);
          faviconUrl = '';
        }
      }

      // Fallback to default favicon path if none found
      if (!faviconUrl) {
        try {
          const baseUrl = new URL(url);
          faviconUrl = `${baseUrl.origin}/favicon.ico`;
        } catch (err) {
          console.warn('Failed to construct default favicon URL:', err);
        }
      }

      // Convert favicon to base64 data URL
      let faviconBase64 = '';
      if (faviconUrl && !faviconUrl.startsWith('data:')) {
        console.log('Converting favicon to base64:', faviconUrl);
        const base64Result = await convertImageToBase64(faviconUrl);
        if (base64Result) {
          faviconBase64 = base64Result;
          console.log('Successfully converted favicon to base64');
        }
      } else if (faviconUrl.startsWith('data:')) {
        // Already a data URL
        faviconBase64 = faviconUrl;
      }

      console.log('Extracted metadata:', { title, favicon: faviconBase64 ? 'base64 data' : 'none' });
      return { title, favicon: faviconBase64 || undefined, description, keywords };

    } catch (err) {
      console.warn('Failed to fetch URL metadata:', err);
      // Fallback to hostname as title
      try {
        return { title: new URL(url).hostname };
      } catch {
        return { title: url };
      }
    }
  };

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
  // Updated to handle external application drops (e.g. URLs dragged from Chrome).
  const handleDrop = (index: number, position: 'before' | 'after', event: React.DragEvent | DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Get the dataTransfer from either React or native event
    const dataTransfer = 'dataTransfer' in event ? event.dataTransfer : (event as any).dataTransfer;

    // Log transferred content for debugging
    console.log('Row drop - DataTransfer types:', Array.from(dataTransfer.types));
    console.log('Row drop - DataTransfer items:', dataTransfer.items ? Array.from(dataTransfer.items) : 'Not supported');

    // First check for external URL drop
    const externalUrl = extractUrlFromDataTransfer(dataTransfer);
    if (externalUrl) {
        console.log('Row drop - External URL detected:', externalUrl);
        const actualIndex = position === 'before' ? index : index + 1;
        setPendingExternalDropIndex(actualIndex);

        // Fetch URL metadata asynchronously
        fetchUrlMetadata(externalUrl).then(metadata => {
          setEditingBookmark({
              id: '',
              title: metadata.title,
              url: externalUrl,
              description: metadata.description || '',
              tags: metadata.keywords ? metadata.keywords.split(/[,\s]+/).filter(Boolean) : [],
              collapsed: true,
              icon: metadata.favicon,
              createdDate: new Date(),
              lastModifiedDate: new Date()
          });
        }).catch(err => {
          console.warn('Failed to fetch metadata, using defaults:', err);
          setEditingBookmark({
              id: '',
              title: '',
              url: externalUrl,
              description: '',
              tags: [],
              collapsed: true,
              createdDate: new Date(),
              lastModifiedDate: new Date()
          });
        });

        setIsBookmarkFormOpen(true);
        return;
    }

    // Check if this is a cross-tab drop
    if (nodeId && isExternalDrag(nodeId) && dragState.draggedBookmark && dragState.sourceNodeId) {
      console.log('[BookmarksTabManager] Handling cross-tab drop');

      // Use the stored cross-tab drag state for accurate positioning
      const finalIndex = crossTabDragOverIndex ?? index;
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
      if (onConfigChange) {
        onConfigChange({
          ...(config || {} as BookmarksTabConfig),
          bookmarks: newBookmarks
        });
      }

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
    if (draggedIndex < index) {
      insertIndex = position === 'before' ? index - 1 : index;
    } else {
      insertIndex = position === 'before' ? index : index + 1;
    }

    // Insert at new position
    newBookmarks.splice(insertIndex, 0, draggedItem);

    if (onConfigChange) {
      onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    }

    setDraggedBookmark(null);
    setDragOverIndex(null);
    setDropPosition('after');
  };


  const handleSubmit = (data: BookmarkFormData) => {
    // if editingBookmark is set and has an id, update existing
    if (editingBookmark?.id) {
      const updated = bookmarks.map(b => b.id === editingBookmark.id ? { ...b, ...data } : b);
      onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
      setEditingBookmark(null);
      setIsBookmarkFormOpen(false);
      return;
    }

    // create new - insert at remembered pendingInsertIndex if present
    const newBookmark: Bookmark = {
      id: uuidv4(),
      title: data.title || '',
      url: data.url || '',
      icon: data.icon || '',
      color: data.color || '',
      description: data.description || '',
      tags: data.tags || [],
      collapsed: true,
      createdDate: new Date(),
      lastModifiedDate: new Date()
    };

    const newBookmarks = [...bookmarks];
    if (pendingExternalDropIndex !== null && pendingExternalDropIndex >= 0 && pendingExternalDropIndex <= newBookmarks.length) {
      newBookmarks.splice(pendingExternalDropIndex, 0, newBookmark);
    } else {
      newBookmarks.push(newBookmark);
    }

    onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    setIsBookmarkFormOpen(false);
    setEditingBookmark(null);
    setPendingExternalDropIndex(null);
  };

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

    // Listen for toolbar events dispatched from FlexLayoutManager for this node
    useEffect(() => {
      // Sync local state with config when it changes
      if (config?.viewMode && config.viewMode !== tableRowViewMode) {
        setTableRowViewMode(config.viewMode);
      }
    }, [config?.viewMode, tableRowViewMode]);

    useEffect(() => {
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

        // Also prevent default for external URL drops (from browser, etc.)
        const hasUrlTypes = e.dataTransfer.types.includes('text/uri-list') ||
                           e.dataTransfer.types.includes('text/plain');
        if (hasUrlTypes) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
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
        // Log transferred content for debugging
        console.log('Container drop - DataTransfer types:', Array.from(e.dataTransfer.types));
        console.log('Container drop - DataTransfer items:', e.dataTransfer.items ? Array.from(e.dataTransfer.items) : 'Not supported');

        // Inspect external drops (URLs) first. If we detect a URL, open the
        // Bookmark form in Create mode and prefill the URL. This covers
        // drops from external apps (browser address bar / other apps).
        try {
          const dt = (e as any)?.dataTransfer;
          if (dt) {
            let url = '';
            try {
              if (dt.getData) url = dt.getData('text/uri-list') || '';
            } catch (err) {
              console.log('Container drop - Failed to get URI list:', err);
            }
            if (!url && dt.getData) {
              const plain = dt.getData('text/plain') || '';
              const trimmed = (plain || '').trim();
              try {
                if (trimmed) new URL(trimmed);
                url = trimmed;
              } catch (err) {
                console.log('Container drop - Failed to validate plain text URL:', err);
              }
            }

            if (url) {
              console.log('Container drop - External URL detected:', url);
              e.preventDefault();

              // default insertion index: end of list or use stored cross-tab position
              const insertIndex = crossTabDragOverIndex !== null
                ? (crossTabDropPosition === 'before' ? crossTabDragOverIndex : crossTabDragOverIndex + 1)
                : bookmarks.length;
              setPendingExternalDropIndex(insertIndex);

              // Fetch URL metadata asynchronously
              fetchUrlMetadata(url).then(metadata => {
                setEditingBookmark({
                  id: '',
                  title: metadata.title,
                  url,
                  description: metadata.description || '',
                  tags: metadata.keywords ? metadata.keywords.split(/[,\s]+/).filter(Boolean) : [],
                  collapsed: true,
                  icon: metadata.favicon,
                  createdDate: new Date(),
                  lastModifiedDate: new Date()
                });
              }).catch(err => {
                console.warn('Failed to fetch metadata, using defaults:', err);
                setEditingBookmark({
                  id: '',
                  title: '',
                  url,
                  description: '',
                  tags: [],
                  collapsed: true,
                  createdDate: new Date(),
                  lastModifiedDate: new Date()
                });
              });

              setIsBookmarkFormOpen(true);
              return;
            }
          }
        } catch (err) {
          console.warn('Container drop inspection failed', err);
        }

        // Handle drops on empty areas (append to end) for cross-tab bookmarks
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
              mode={editingBookmark?.id ? FormDisplayMode.Edit : FormDisplayMode.Create}
              onSave={(d) => handleSubmit(d)}
              onCancel={() => { setIsBookmarkFormOpen(false); setEditingBookmark(null); }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
