import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationContextType } from '../types/notification';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    const duration = notification.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((title: string, message: string) => {
    addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const error = useCallback((title: string, message: string) => {
    addNotification({ type: 'error', title, message, duration: 8000 });
  }, [addNotification]);

  const warning = useCallback((title: string, message: string) => {
    addNotification({ type: 'warning', title, message, duration: 6000 });
  }, [addNotification]);

  const info = useCallback((title: string, message: string) => {
    addNotification({ type: 'info', title, message });
  }, [addNotification]);

  const value = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  }), [notifications, addNotification, removeNotification, success, error, warning, info]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
