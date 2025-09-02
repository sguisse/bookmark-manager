import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ApplicationProvider } from './contexts/ApplicationContext';
import { BookmarkDragDropProvider } from './contexts/BookmarkDragDropContext';
import { GlobalDndProvider } from './components/bookmark/dnd/GlobalDndProvider';
import DashboardLayout from './components/layout/DashboardLayout';

function AppContent() {
  // Keep AppContent minimal; no need to call useNotifications here

  return (
    <DashboardLayout />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ApplicationProvider>
          <GlobalDndProvider>
            <BookmarkDragDropProvider>
              <AppContent />
            </BookmarkDragDropProvider>
          </GlobalDndProvider>
        </ApplicationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
