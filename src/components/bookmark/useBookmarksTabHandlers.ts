import { useCallback, useReducer } from 'react';
import { Bookmark, BookmarksTabConfig, BookmarkFormData } from '../../types/bookmark';
import { openAllUrls } from './utils';
import { v4 as uuidv4 } from 'uuid';

export interface BookmarksTabHandlerDeps {
  nodeId?: string;
  bookmarks: Bookmark[];
  config?: BookmarksTabConfig;
  onConfigChange?: (cfg: BookmarksTabConfig) => void;
  tabToggleViewMode: 'card' | 'row';
  setTabToggleViewMode: (v: 'card' | 'row') => void;
  setEditingBookmark: (b: Bookmark | null) => void;
  setIsBookmarkFormOpen: (v: boolean) => void;
  editingBookmark?: Bookmark | null;
}

type SelectionState = { selectedIds: string[]; lastSelectedIndex: number | null };

type SelectionAction =
  | { type: 'SELECT_SINGLE'; id: string; index: number }
  | { type: 'TOGGLE'; id: string; index: number }
  | { type: 'RANGE_SELECT'; ids: string[]; index: number; union: boolean }
  | { type: 'CLEAR' };

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'SELECT_SINGLE':
      return { selectedIds: [action.id], lastSelectedIndex: action.index };
    case 'TOGGLE': {
      const exists = state.selectedIds.includes(action.id);
      return { selectedIds: exists ? state.selectedIds.filter(x => x !== action.id) : [...state.selectedIds, action.id], lastSelectedIndex: action.index };
    }
    case 'RANGE_SELECT': {
      const next = action.union ? Array.from(new Set([...state.selectedIds, ...action.ids])) : action.ids;
      return { selectedIds: next, lastSelectedIndex: action.index };
    }
    case 'CLEAR':
      return { selectedIds: [], lastSelectedIndex: null };
    default:
      return state;
  }
}

export function useBookmarksTabHandlers(deps: BookmarksTabHandlerDeps) {
  const { nodeId, bookmarks, config, onConfigChange, tabToggleViewMode, setTabToggleViewMode, setEditingBookmark, setIsBookmarkFormOpen } = deps;

  const [selectionState, dispatch] = useReducer(selectionReducer, { selectedIds: [], lastSelectedIndex: null });

  const handleAdd = useCallback((e: Event) => {
    try {
      const ce = e as CustomEvent<{ nodeId: string }>;
      if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
        setEditingBookmark(null);
        setIsBookmarkFormOpen(true);
      }
    } catch (err) {
      console.warn('toolbar add handler error', err);
    }
  }, [nodeId, setEditingBookmark, setIsBookmarkFormOpen]);

  const handleSelect = useCallback((id: string, index: number, e: React.MouseEvent) => {
    const isCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    if ((isShift || isAlt) && selectionState.lastSelectedIndex !== null) {
      const start = Math.min(selectionState.lastSelectedIndex, index);
      const end = Math.max(selectionState.lastSelectedIndex, index);
      const rangeIds = bookmarks.slice(start, end + 1).map(b => b.id);
      if (isCmd) {
        dispatch({ type: 'RANGE_SELECT', ids: rangeIds, index, union: true });
      } else {
        dispatch({ type: 'RANGE_SELECT', ids: rangeIds, index, union: false });
      }
      return;
    }

    if (isCmd) {
      dispatch({ type: 'TOGGLE', id, index });
      return;
    }

    dispatch({ type: 'SELECT_SINGLE', id, index });
  }, [bookmarks, selectionState.lastSelectedIndex]);

  const handleToggleTabView = useCallback((e: Event) => {
    try {
      const ce = e as CustomEvent<{ nodeId: string }>;
      if (ce?.detail?.nodeId && ce.detail.nodeId === nodeId) {
        const newViewMode = tabToggleViewMode === 'card' ? 'row' : 'card';
        setTabToggleViewMode(newViewMode);
        if (onConfigChange) {
          const updatedBookmarks = bookmarks.map(b => ({ ...b, collapsed: newViewMode === 'row' }));
          onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updatedBookmarks });
        }
      }
    } catch (err) {
      console.warn('toggle tab view handler error', err);
    }
  }, [nodeId, tabToggleViewMode, setTabToggleViewMode, onConfigChange, bookmarks, config]);

  const handleOpenAllUrls = useCallback((e: Event) => {
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
  }, [nodeId, bookmarks]);

  const handleEdit = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkFormOpen(true);
  }, [setEditingBookmark, setIsBookmarkFormOpen]);

  const handleToggleCollapsed = useCallback((bookmarkId: string) => {
    if (!onConfigChange) return;
    const updatedBookmarks = bookmarks.map(b => b.id === bookmarkId ? { ...b, collapsed: !(b.collapsed ?? true) } : b);
    onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updatedBookmarks });
  }, [onConfigChange, bookmarks, config]);

  const handleDelete = useCallback((bookmarkId: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    if (onConfigChange) {
      onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: newBookmarks });
    } else {
      console.log('Delete bookmark', bookmarkId);
    }
  }, [onConfigChange, bookmarks, config]);

  const handleSubmit = useCallback((data: BookmarkFormData, editing: Bookmark | null | undefined) => {
    if (editing?.id) {
      const updated = bookmarks.map(b => b.id === editing.id ? { ...b, ...data } : b);
      onConfigChange && onConfigChange({ ...(config || {} as BookmarksTabConfig), bookmarks: updated });
      setEditingBookmark(null);
      setIsBookmarkFormOpen(false);
      return;
    }

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
  }, [bookmarks, onConfigChange, config, setEditingBookmark, setIsBookmarkFormOpen]);

  return {
    handleAdd,
    handleSelect,
    handleToggleTabView,
    handleOpenAllUrls,
    handleEdit,
    handleToggleCollapsed,
    handleDelete,
    handleSubmit,
    selectionState,
    dispatch
  } as const;
}
