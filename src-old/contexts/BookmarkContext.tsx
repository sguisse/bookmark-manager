import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BookmarkConfig, BookmarkGroup, Bookmark } from '../types/bookmark';
import { useNotifications } from './NotificationContext';

interface BookmarkState {
  config: BookmarkConfig;
  selectedGroupId: string | null;
}

type BookmarkAction =
  | { type: 'SET_CONFIG'; payload: BookmarkConfig }
  | { type: 'ADD_GROUP'; payload: Omit<BookmarkGroup, 'id'> }
  | { type: 'UPDATE_GROUP'; payload: { id: string; group: Partial<BookmarkGroup> } }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'REORDER_GROUPS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'ADD_BOOKMARK'; payload: { groupId: string; bookmark: Omit<Bookmark, 'id'> } }
  | { type: 'UPDATE_BOOKMARK'; payload: { groupId: string; bookmarkId: string; bookmark: Partial<Bookmark> } }
  | { type: 'DELETE_BOOKMARK'; payload: { groupId: string; bookmarkId: string } }
  | { type: 'MOVE_BOOKMARK'; payload: { sourceGroupId: string; destGroupId: string; sourceIndex: number; destIndex: number } }
  | { type: 'SET_SELECTED_GROUP'; payload: string | null }
  | { type: 'IMPORT_DATA'; payload: BookmarkConfig };

const STORAGE_KEY = 'bookmark-manager-config-bookmarks';

const defaultBookmarksTabConfig: BookmarkConfig = {
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  groups: [
    {
      id: 'default',
      title: 'Mes Bookmarks',
      color: '#3b82f6',
      bookmarks: [],
    }
  ]
};

// Fonction pour charger la configuration depuis localStorage
export const loadStoredConfig = (): BookmarkConfig => {
  try {
    // Try to load bookmarks config from dedicated key
    const bookmarksRaw = localStorage.getItem(STORAGE_KEY);
    if (bookmarksRaw) {
      const config = JSON.parse(bookmarksRaw);
      config.createdAt = new Date(config.createdAt);
      config.updatedAt = new Date(config.updatedAt);
      config.groups.forEach((group: BookmarkGroup) => {
        group.bookmarks.forEach((bookmark: Bookmark) => {
          bookmark.createdAt = new Date(bookmark.createdAt);
          bookmark.updatedAt = new Date(bookmark.updatedAt);
        });
      });
      console.log('Configuration chargée depuis config bookmarks:', config);
      return config;
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration des bookmarks:', error);
  }
  console.log('Utilisation de la configuration par défaut');
  return defaultBookmarksTabConfig;
};

function bookmarkReducer(state: BookmarkState, action: BookmarkAction): BookmarkState {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload
      };

    case 'ADD_GROUP': {
      const newGroup: BookmarkGroup = {
        id: uuidv4(),
        ...action.payload,
        bookmarks: action.payload.bookmarks || []
      };

      return {
        ...state,
        config: {
          ...state.config,
          updatedAt: new Date(),
          groups: [...state.config.groups, newGroup]
        }
      };
    }

    case 'UPDATE_GROUP': {
      return {
        ...state,
        config: {
          ...state.config,
          updatedAt: new Date(),
          groups: state.config.groups.map(group =>
            group.id === action.payload.id
              ? { ...group, ...action.payload.group }
              : group
          )
        }
      };
    }

    case 'DELETE_GROUP': {
      return {
        ...state,
        config: {
          ...state.config,
          updatedAt: new Date(),
          groups: state.config.groups.filter(group => group.id !== action.payload)
        },
        selectedGroupId: state.selectedGroupId === action.payload ? null : state.selectedGroupId
      };
    }

    case 'REORDER_GROUPS': {
      const newGroups = [...state.config.groups];
      const [removed] = newGroups.splice(action.payload.startIndex, 1);
      newGroups.splice(action.payload.endIndex, 0, removed);

      return {
        ...state,
        config: {
          ...state.config,
          updatedAt: new Date(),
          groups: newGroups
        }
      };
    }

    case 'ADD_BOOKMARK': {
      const newBookmark: Bookmark = {
        id: uuidv4(),
        ...action.payload.bookmark,
        createdAt: new Date(),
        updatedAt: new Date(),
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(action.payload.bookmark.url).hostname}&sz=32`
      };

      return {
        ...state,
        config: {
          ...state.config,
          updatedAt: new Date(),
          groups: state.config.groups.map(group =>
            group.id === action.payload.groupId
              ? { ...group, bookmarks: [...group.bookmarks, newBookmark] }
              : group
          )
        }
      };
    }

    case 'UPDATE_BOOKMARK': {
      return {
        ...state,
        config: {
          ...state.config,
          updatedAt: new Date(),
          groups: state.config.groups.map(group =>
            group.id === action.payload.groupId
              ? {
                  ...group,
                  bookmarks: group.bookmarks.map(bookmark =>
                    bookmark.id === action.payload.bookmarkId
                      ? { ...bookmark, ...action.payload.bookmark, updatedAt: new Date() }
                      : bookmark
                  )
                }
              : group
          )
        }
      };
    }

    case 'DELETE_BOOKMARK': {
      return {
        ...state,
        config: {
          ...state.config,
          updatedAt: new Date(),
          groups: state.config.groups.map(group =>
            group.id === action.payload.groupId
              ? {
                  ...group,
                  bookmarks: group.bookmarks.filter(bookmark => bookmark.id !== action.payload.bookmarkId)
                }
              : group
          )
        }
      };
    }

    case 'MOVE_BOOKMARK': {
      const { sourceGroupId, destGroupId, sourceIndex, destIndex } = action.payload;

      if (sourceGroupId === destGroupId) {
        // Réorganiser dans le même groupe
        return {
          ...state,
          config: {
            ...state.config,
            updatedAt: new Date(),
            groups: state.config.groups.map(group => {
              if (group.id === sourceGroupId) {
                const newBookmarks = [...group.bookmarks];
                const [removed] = newBookmarks.splice(sourceIndex, 1);
                newBookmarks.splice(destIndex, 0, removed);
                return { ...group, bookmarks: newBookmarks };
              }
              return group;
            })
          }
        };
      } else {
        // Déplacer entre groupes différents
        let bookmarkToMove: Bookmark | undefined;
        const updatedGroups = state.config.groups.map(group => {
          if (group.id === sourceGroupId) {
            bookmarkToMove = group.bookmarks[sourceIndex];
            return {
              ...group,
              bookmarks: group.bookmarks.filter((_, index) => index !== sourceIndex)
            };
          }
          return group;
        });

        if (!bookmarkToMove) return state;

        return {
          ...state,
          config: {
            ...state.config,
            updatedAt: new Date(),
            groups: updatedGroups.map(group => {
              if (group.id === destGroupId) {
                const newBookmarks = [...group.bookmarks];
                newBookmarks.splice(destIndex, 0, bookmarkToMove!);
                return { ...group, bookmarks: newBookmarks };
              }
              return group;
            })
          }
        };
      }
    }

    case 'SET_SELECTED_GROUP':
      return {
        ...state,
        selectedGroupId: action.payload
      };

    case 'IMPORT_DATA':
      return {
        ...state,
        config: action.payload
      };

    default:
      return state;
  }
}

interface BookmarkContextType {
  groups: BookmarkGroup[];
  addGroup: (group: Omit<BookmarkGroup, 'id'>) => void;
  updateGroup: (id: string, group: Partial<BookmarkGroup>) => void;
  deleteGroup: (id: string) => void;
  reorderGroups: (startIndex: number, endIndex: number) => void;
  moveBookmark: (sourceGroupId: string, destGroupId: string, sourceIndex: number, destIndex: number) => void;
  addBookmark: (groupId: string, bookmark: Omit<Bookmark, 'id'>) => void;
  updateBookmark: (groupId: string, bookmarkId: string, bookmark: Partial<Bookmark>) => void;
  deleteBookmark: (groupId: string, bookmarkId: string) => void;
  exportData: () => string;
  importData: (data: string) => void;
  clearLocalStorage: () => void;
  lastSaved: Date | null;
  notifySaved: (date?: Date) => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

// Load initial state only once at module level
const initialConfig = (() => {
  console.log('[BookmarkContext] Loading initial bookmark configuration...');
  return loadStoredConfig();
})();

// Fonction pour obtenir l'état initial avec les données sauvegardées
const getInitialState = (): BookmarkState => ({
  config: initialConfig,
  selectedGroupId: null
});

interface BookmarkProviderProps {
  readonly children: React.ReactNode;
}

export function BookmarkProvider({ children }: BookmarkProviderProps) {
  const [state, dispatch] = useReducer(bookmarkReducer, getInitialState());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const notifications = useNotifications();

  // Sauvegarder la configuration dans le localStorage à chaque changement
  useEffect(() => {
    const saveToStorage = () => {
      try {
        const configToSave = {
          ...state.config,
          updatedAt: new Date() // Mise à jour automatique de la date
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
        setLastSaved(new Date());
        console.log('Configuration sauvegardée dans bookmarks config');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('Quota de stockage local dépassé');
          notifications.error('Erreur de sauvegarde', 'Quota de stockage dépassé. Veuillez libérer de l\'espace.');
        } else {
          notifications.error('Erreur de sauvegarde', 'Impossible de sauvegarder vos bookmarks localement.');
        }
      }
    };
    const timeoutId = setTimeout(saveToStorage, 500);
    return () => clearTimeout(timeoutId);
  }, [state.config, notifications]);

  // Fonction pour vider le cache local (utile pour le debug)
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Cache local vidé');
      // Recharger avec la configuration par défaut
      dispatch({ type: 'SET_CONFIG', payload: defaultBookmarksTabConfig });
      notifications.info('Cache vidé', 'Le cache local a été vidé et la configuration par défaut a été restaurée');
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
      notifications.error('Erreur', 'Impossible de vider le cache local');
    }
  }, [notifications]);

  const notifySaved = useCallback((date?: Date) => {
    const d = date || new Date();
    setLastSaved(d);
  }, []);

  const addGroup = useCallback((group: Omit<BookmarkGroup, 'id'>) => {
    dispatch({ type: 'ADD_GROUP', payload: group });
  }, []);

  const updateGroup = useCallback((id: string, group: Partial<BookmarkGroup>) => {
    dispatch({ type: 'UPDATE_GROUP', payload: { id, group } });
  }, []);

  const deleteGroup = useCallback((id: string) => {
    dispatch({ type: 'DELETE_GROUP', payload: id });
  }, []);

  const reorderGroups = useCallback((startIndex: number, endIndex: number) => {
    dispatch({ type: 'REORDER_GROUPS', payload: { startIndex, endIndex } });
  }, []);

  const moveBookmark = useCallback((sourceGroupId: string, destGroupId: string, sourceIndex: number, destIndex: number) => {
    dispatch({ type: 'MOVE_BOOKMARK', payload: { sourceGroupId, destGroupId, sourceIndex, destIndex } });
  }, []);

  const addBookmark = useCallback((groupId: string, bookmark: Omit<Bookmark, 'id'>) => {
    dispatch({ type: 'ADD_BOOKMARK', payload: { groupId, bookmark } });
  }, []);

  const updateBookmark = useCallback((groupId: string, bookmarkId: string, bookmark: Partial<Bookmark>) => {
    dispatch({ type: 'UPDATE_BOOKMARK', payload: { groupId, bookmarkId, bookmark } });
  }, []);

  const deleteBookmark = useCallback((groupId: string, bookmarkId: string) => {
    dispatch({ type: 'DELETE_BOOKMARK', payload: { groupId, bookmarkId } });
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify(state.config, null, 2);
  }, [state.config]);

  const importData = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      dispatch({ type: 'IMPORT_DATA', payload: data });
      notifications.success('Import réussi', 'Votre configuration a été importée avec succès');
    } catch (error) {
      console.error('Failed to import configuration:', error);
      notifications.error('Erreur d\'import', 'Format de fichier invalide');
      throw new Error('Invalid JSON format');
    }
  }, [notifications]);

  const contextValue = useMemo(() => ({
    groups: state.config.groups,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    moveBookmark,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    exportData,
    importData,
    clearLocalStorage,
  lastSaved,
  notifySaved,
  }), [
    state.config.groups,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    moveBookmark,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    exportData,
    importData,
    clearLocalStorage,
    lastSaved,
  notifySaved,
  ]);

  return (
    <BookmarkContext.Provider value={contextValue}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}
