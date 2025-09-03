import React, { useState } from 'react';
import { BrowserBookmarkNode, BrowserFavorites, BrowserFavoritesFormData } from '../../types/browser';
import { FormDisplayMode } from '../../types/app';
import '../../styles/index.css';
import { BrowserFavoritesService } from '../../services/BrowserFavoritesService';
import BrowserFavoritesPanel from './BrowserFavoritesPanel';

type Props = {};

// Manager focuses on loading/persisting bookmarks and hosting the renderer.

// Old TreeNode rendering removed in favor of BrowserFavoritesRenderer

export const BrowserFavoritesManager: React.FC<Props> = () => {
  const [tree, setTree] = useState<BrowserBookmarkNode[]>([]);
  const [currentFavorites, setCurrentFavorites] = useState<BrowserFavorites | null>(null);
  const formMode = FormDisplayMode.Edit; // Always in edit mode since form is always visible

  // (expanded/selection state and helpers moved into renderer)

  // On mount, try to load saved BrowserFavorites from storage to initialize form and tree
  React.useEffect(() => {
    try {
      const stored = BrowserFavoritesService.loadFromStorage();
      if (stored) {
  setCurrentFavorites(stored);
  setTree(stored.bookmarksTree || []);
      }
    } catch (err) {
      // ignore
      // eslint-disable-next-line no-console
      console.warn('Failed to load stored BrowserFavorites', err);
    }
  }, []);

  // (removed buildNodePath — we now use node.isExpanded flags directly)

  // Selection and expansion are handled inside the renderer; manager persists the tree and hosts the form.

  const loadBookmarksFile = (file: File, filePath: string) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      const text = typeof result === 'string' ? result : '';
      try {
        const parsed = BrowserFavoritesService.parseChromeBookmarksHtml(text);
  setTree(parsed);

        // Update current favorites with the new file
        if (currentFavorites) {
          setCurrentFavorites(prev => prev ? {
            ...prev,
            filePath,
            bookmarksTree: parsed,
            lastModifiedDate: new Date()
          } : null);
          // persist updated favorites
          try {
            const updated = {
              ...currentFavorites,
              filePath,
              bookmarksTree: parsed,
              lastModifiedDate: new Date()
            } as BrowserFavorites;
            BrowserFavoritesService.saveToStorage(updated);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to save BrowserFavorites after loading file', err);
          }
        } else {
          // if no currentFavorites existed, create and persist one
          const newFav: BrowserFavorites = {
            id: `bf-${Date.now()}`,
            filePath,
            bookmarksTree: parsed,
            createdDate: new Date(),
            lastModifiedDate: new Date()
          };
          setCurrentFavorites(newFav);
          try {
            BrowserFavoritesService.saveToStorage(newFav);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to save new BrowserFavorites after loading file', err);
          }
        }
      } catch (err) {
        // ignore parse errors
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleFormSave = (formData: BrowserFavoritesFormData, file?: File) => {
    if (currentFavorites) {
      // Update existing browser favorites
      const updatedFavorites: BrowserFavorites = {
        ...currentFavorites,
        filePath: formData.filePath,
        bookmarksTree: tree,
        lastModifiedDate: new Date()
      };
      setCurrentFavorites(updatedFavorites);

      // persist updated favorites
      try {
        BrowserFavoritesService.saveToStorage(updatedFavorites);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save BrowserFavorites on form save', err);
      }

      // If a new file was provided, load it
      if (file) {
        loadBookmarksFile(file, formData.filePath);
      }
    } else {
      // Create new browser favorites (when none exists yet)
      const newFavorites: BrowserFavorites = {
        id: `bf-${Date.now()}`,
        filePath: formData.filePath,
        bookmarksTree: [],
        createdDate: new Date(),
        lastModifiedDate: new Date()
      };
      setCurrentFavorites(newFavorites);

      // persist new favorites
      try {
        BrowserFavoritesService.saveToStorage(newFavorites);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save new BrowserFavorites on form save', err);
      }

      // If a file was provided, load it
      if (file) {
        loadBookmarksFile(file, formData.filePath);
      }
    }
    // Keep the form open after saving for potential further use
    // setIsFormOpen(false); // Commented out to keep form open
  };

  const handleFormCancel = () => {
    // Don't close the form, just keep it open for further use
    // User can manually collapse it using the toggle button if desired
  };

  return (
    <BrowserFavoritesPanel
      browserFavorites={currentFavorites}
      formMode={formMode}
      onFormSave={handleFormSave}
      onFormCancel={handleFormCancel}
      tree={tree}
      onTreeChange={(updated) => {
        // update manager state and persist
        setTree(updated);
        if (currentFavorites) {
          try {
            const updatedFav: BrowserFavorites = {
              ...currentFavorites,
              bookmarksTree: updated,
              lastModifiedDate: new Date()
            };
            setCurrentFavorites(updatedFav);
            BrowserFavoritesService.saveToStorage(updatedFav);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to persist BrowserFavorites after tree change', err);
          }
        }
      }}
      onSelect={() => { /* delegate selection handling if desired */ }}
      className="bf-renderer"
    />
  );
};
export default BrowserFavoritesManager;
