import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import DashboardLayout from './components/layout/DashboardLayout';

function AppContent() {


  const notifications = useNotifications();

  return (
    <DashboardLayout/>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}
