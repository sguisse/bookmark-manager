import React, { createContext, useContext, useMemo } from 'react';
import { useNotification, Notification } from '../hooks/useNotification';
import { NotificationContainer } from '../components/NotificationContainer';

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  readonly children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { notifications, addNotification, removeNotification, clearAllNotifications } = useNotification();

  const success = (title: string, message?: string) =>
    addNotification({ type: 'success', title, message });

  const error = (title: string, message?: string) =>
    addNotification({ type: 'error', title, message });

  const warning = (title: string, message?: string) =>
    addNotification({ type: 'warning', title, message });

  const info = (title: string, message?: string) =>
    addNotification({ type: 'info', title, message });

  const contextValue = useMemo<NotificationContextType>(() => ({
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  }), [addNotification, removeNotification, clearAllNotifications]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
