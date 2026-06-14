import React from 'react';
import { Badge } from 'react-bootstrap';
import { OrderStatus } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { 
          bg: 'warning', 
          text: 'Pendiente',
          textColor: 'var(--dark-color)'
        };
      case OrderStatus.PAID:
        return { 
          bg: 'info', 
          text: 'Pagado',
          textColor: 'var(--white-color)'
        };
      case OrderStatus.SHIPPED:
        return { 
          bg: 'primary', 
          text: 'Enviado',
          textColor: 'var(--white-color)'
        };
      case OrderStatus.DELIVERED:
        return { 
          bg: 'success', 
          text: 'Entregado',
          textColor: 'var(--white-color)'
        };
      case OrderStatus.CANCELED:
        return { 
          bg: 'danger', 
          text: 'Cancelado',
          textColor: 'var(--white-color)'
        };
      default:
        return { 
          bg: 'secondary', 
          text: 'Desconocido',
          textColor: 'var(--white-color)'
        };
    }
  };

  const { bg, text, textColor } = getStatusConfig(status);
  
  const badgeSize = {
    sm: { fontSize: '0.75rem', padding: '0.25rem 0.5rem' },
    md: { fontSize: '0.875rem', padding: '0.35rem 0.65rem' },
    lg: { fontSize: '1rem', padding: '0.5rem 0.75rem' }
  };
  
  return (
    <Badge 
      bg={bg} 
      style={{
        ...badgeSize[size],
        color: textColor,
        fontWeight: 600
      }}
    >
      {text}
    </Badge>
  );
};

export default StatusBadge;
