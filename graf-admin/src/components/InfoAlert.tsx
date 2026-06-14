'use client';
import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { removeNotification } from '@/redux/ui';
import { Alert } from 'react-bootstrap';

interface AlertComponentProps {
  id: string;
  color?: string;
  message: string;
  onRemoveNotification: (id: string) => void;
}

const InfoAlert: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.ui.notifications);
  const dispatch = useDispatch();

  const handleRemoveNotification = (id: string) => {
    dispatch(removeNotification(id));
  };

  const containerStyle = {
    position: 'fixed' as const,
    top: '0',
    right: '0',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    zIndex: 9999,
  };

  return (
    <div style={containerStyle}>
      {notifications.map((notification, i) => (
        <AlertComponent
          key={i}
          id={notification.id || ''}
          color={notification.color}
          message={notification.message}
          onRemoveNotification={handleRemoveNotification}
        />
      ))}
    </div>
  );
};

const AlertComponent: React.FC<AlertComponentProps> = ({ id, color, message, onRemoveNotification }) => {
  const [show, setShow] = React.useState(true);

  const onDismiss = useCallback(() => {
    setShow(false);
    onRemoveNotification(id);
  }, [id, onRemoveNotification]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onRemoveNotification, onDismiss]);

  if (!show) {
    return null;
  }

  const alertColor = color || 'info';

  const alertStyle = {
    minWidth: '250px',
    marginBottom: '8px',
    paddingRight: '36px'
  };

  return (
    <Alert
      variant={alertColor}
      onClose={onDismiss}
      dismissible
      style={alertStyle}
    >
      {message}
    </Alert>
  );
};

export default InfoAlert;
