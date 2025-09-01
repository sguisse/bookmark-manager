import { Bookmark, BookmarksTabConfig, BookmarkFormData } from '../../types/bookmark';
import { openAllUrls } from './utils';
import { v4 as uuidv4 } from 'uuid';

export type SetStringArray = (v: string[] | ((prev: string[]) => string[])) => void;
export type SetNumberOrNull = (v: number | null | ((prev: number | null) => number | null)) => void;
export type SetStringOrNull = (v: Bookmark | null | ((prev: Bookmark | null) => Bookmark | null)) => void;
export type SetBoolean = (v: boolean | ((prev: boolean) => boolean)) => void;

export interface BookmarksTabHandlerDeps {
  nodeId?: string;
  bookmarks: Bookmark[];
  config?: BookmarksTabConfig;
  onConfigChange?: (cfg: BookmarksTabConfig) => void;
  tabToggleViewMode: 'card' | 'row';
  setTabToggleViewMode: (v: 'card' | 'row') => void;
  setSelectedIds: SetStringArray;
  selectedIds: string[];
  setLastSelectedIndex: SetNumberOrNull;
  lastSelectedIndex: number | null;
  setEditingBookmark: SetStringOrNull;
  setIsBookmarkFormOpen: SetBoolean;
  editingBookmark?: Bookmark | null;
}

export function createBookmarksTabHandlers(deps: BookmarksTabHandlerDeps) {
  const {
    nodeId,
    bookmarks,
    config,
    onConfigChange,
    tabToggleViewMode,
    setTabToggleViewMode,
    setSelectedIds,
    selectedIds,
    setLastSelectedIndex,
    lastSelectedIndex,
    setEditingBookmark,
    setIsBookmarkFormOpen
  } = deps;

  // ---------------------------------------------------------------------------------------------------------------------
  // Hamndle relative to Bookmark Form

  const handleAdd = (e: Event) => {
    console.log("Start add new bookmark");

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

  const handleEdit = (bookmark: Bookmark) => {
    console.log("Start editing bookmark", bookmark);
    setEditingBookmark(bookmark);
    setIsBookmarkFormOpen(true);
  };

  const handleSubmitForm = (data: BookmarkFormData, editingBookmark?: Bookmark | null) => {
    console.log("Current bookmark data", editingBookmark);
    console.log("Submitting bookmark form data", data);
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

    const updated = [...bookmarks, newBookmark];
    onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
    setIsBookmarkFormOpen(false);
    setEditingBookmark(null);
  };



  // ---------------------------------------------------------------------------------------------------------------------
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


  const handleDelete = (bookmarkId: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    if (onConfigChange) {
      onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    } else {
      console.log('Delete bookmark', bookmarkId);
    }
  };

  const handleSelect = (id: string, index: number, e: React.MouseEvent) => {
    const isCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey || e.altKey; // alt/option

    // If shift or alt is held and we have a lastSelectedIndex, select range
    if ((isShift || isAlt) && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = bookmarks.slice(start, end + 1).map(b => b.id);

      if (isCmd) {
        // Add range to existing selection (union)
        setSelectedIds(prev => Array.from(new Set([...prev, ...rangeIds])));
      } else {
        // Replace selection with range
        setSelectedIds(rangeIds);
      }

      setLastSelectedIndex(index);
      return;
    }

    // Toggle when Ctrl/Cmd held
    if (isCmd) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      setLastSelectedIndex(index);
      return;
    }

    // Default: single select
    setSelectedIds([id]);
    setLastSelectedIndex(index);
  };

  const handleToggleTabView = (e: Event) => {
    try {
      const ce = e as CustomEvent<{ nodeId: string }>;
      if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
        const newViewMode = tabToggleViewMode === 'card' ? 'row' : 'card';

        setTabToggleViewMode(newViewMode);

        if (onConfigChange) {
          const updatedBookmarks = bookmarks.map(b => ({
            ...b,
            collapsed: newViewMode === 'row'
          }));

          onConfigChange({ ...(config || {} as BookmarksTabConfig), toggleTabViewMode: newViewMode, bookmarks: updatedBookmarks });
        }
      }
    } catch (err) {
      console.warn('toggle view handler error', err);
    }
  };

  const handleOpenAllUrls = (e: Event) => {
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

  return {
    handleAdd,
    handleSelect,
    handleToggleTabView,
    handleOpenAllUrls,
    handleEdit,
    handleToggleCollapsed,
    handleDelete,
    handleSubmit: handleSubmitForm
  } as const;
}
