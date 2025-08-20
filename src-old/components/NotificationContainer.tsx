import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification } from '../hooks/useNotification';

interface NotificationItemProps {
  readonly notification: Notification;
  readonly onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} className="notification-icon success" />;
      case 'error':
        return <AlertCircle size={20} className="notification-icon error" />;
      case 'warning':
        return <AlertTriangle size={20} className="notification-icon warning" />;
      case 'info':
      default:
        return <Info size={20} className="notification-icon info" />;
    }
  };

  return (
    <div className={`notification notification-${notification.type}`}>
      <div className="notification-content">
        {getIcon()}
        <div className="notification-text">
          <div className="notification-title">{notification.title}</div>
          {notification.message && (
            <div className="notification-message">{notification.message}</div>
          )}
        </div>
      </div>
      <button
        className="notification-close"
        onClick={() => onRemove(notification.id)}
        title="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  readonly notifications: Notification[];
  readonly onRemove: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};
