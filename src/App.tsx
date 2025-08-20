import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { BookmarkProvider, useBookmarks } from './contexts/BookmarkContext';
import DashboardLayout from './components/layout/DashboardLayout';

function AppContent() {
  const {
    exportData,
    importData,
    clearLocalStorage,
    lastSaved
  } = useBookmarks();

  const notifications = useNotifications();

  const handleExport = () => {
    try {
      exportData();
    } catch (error) {
      console.error('Export failed:', error);
      notifications.error('Export Failed', 'Unable to export bookmarks');
    }
  };

  const handleImport = async () => {
    try {
      await importData();
    } catch (error) {
      console.error('Import failed:', error);
      notifications.error('Import Failed', 'Unable to import bookmarks');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        clearLocalStorage();
      } catch (error) {
        console.error('Clear cache failed:', error);
        notifications.error('Clear Failed', 'Unable to clear cache');
      }
    }
  };

  return (
    <DashboardLayout
      onExport={handleExport}
      onImport={handleImport}
      onClearCache={handleClearCache}
      lastSaved={lastSaved}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <BookmarkProvider>
          <AppContent />
        </BookmarkProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
