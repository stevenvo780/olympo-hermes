import React, { useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { OrderStatus } from '@/types/order';
import StatusBadge from './StatusBadge';
import { FaExchangeAlt } from 'react-icons/fa';

interface StatusSelectorProps {
  currentStatus: OrderStatus;
  orderId: number;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<boolean>;
}

export default function StatusSelector({ currentStatus, orderId, onUpdateStatus }: StatusSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const statusOptions = [
    OrderStatus.PENDING,
    OrderStatus.PAID, 
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED
  ].filter(status => status !== currentStatus);

  const handleStatusClick = (status: OrderStatus) => {
    setSelectedStatus(status);
    setShowModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    const success = await onUpdateStatus(orderId, selectedStatus);
    setIsUpdating(false);
    
    if (success) {
      setShowModal(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
        <span style={{ 
          fontSize: "0.85rem", 
          color: "var(--text-secondary)",
          marginRight: "10px"
        }}>
          Cambiar estado:
        </span>
        
        {statusOptions.map((status) => (
          <Button
            key={status}
            style={{ 
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none'
            }}
            onClick={() => handleStatusClick(status)}
            title={`Cambiar a ${getStatusLabel(status)}`}
          >
            <StatusBadge status={status} size="sm" />
          </Button>
        ))}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-color)', color: 'var(--card-title-color)' }}>
          <Modal.Title style={{ fontSize: '1.2rem' }}>Cambio de estado #{orderId}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: 'var(--card-color)', color: 'var(--card-text)' }}>
          <p className="text-center">¿Confirmas cambiar el estado de la orden de:</p>
          <div className="text-center my-4 d-flex flex-column align-items-center">
            <StatusBadge status={currentStatus} size="lg" />
            <div 
              className="my-3 d-flex align-items-center justify-content-center" 
              style={{ 
                color: 'var(--text-secondary)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-color)'
              }}
            >
              <FaExchangeAlt size={20} />
            </div>
            <StatusBadge status={selectedStatus!} size="lg" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
            Esta acción notificará al cliente sobre el cambio de estado.
          </p>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: 'var(--card-color)', borderColor: 'var(--border-color)' }}>
          <Button 
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: 'var(--secondary-border)', 
              color: 'var(--font-color)' 
            }} 
            onClick={() => setShowModal(false)} 
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button 
            style={{ 
              backgroundColor: getStatusBackground(selectedStatus!),
              borderColor: getStatusBorder(selectedStatus!),
              color: getStatusText(selectedStatus!)
            }} 
            onClick={handleConfirmUpdate} 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Actualizando...
              </>
            ) : (
              'Confirmar cambio'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return 'Pendiente';
    case OrderStatus.PAID: return 'Pagada';
    case OrderStatus.SHIPPED: return 'Enviada';
    case OrderStatus.DELIVERED: return 'Entregada';
    case OrderStatus.CANCELED: return 'Cancelada';
    default: return status;
  }
}

function getStatusBorder(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return 'var(--warning-border)';
    case OrderStatus.PAID: return 'var(--info-border)';
    case OrderStatus.SHIPPED: return 'var(--primary-border)';
    case OrderStatus.DELIVERED: return 'var(--success-border)';
    case OrderStatus.CANCELED: return 'var(--danger-border)';
    default: return 'var(--secondary-border)';
  }
}

function getStatusBackground(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return 'var(--warning-color)';
    case OrderStatus.PAID: return 'var(--info-color)';
    case OrderStatus.SHIPPED: return 'var(--primary-color)';
    case OrderStatus.DELIVERED: return 'var(--success-color)';
    case OrderStatus.CANCELED: return 'var(--danger-color)';
    default: return 'var(--secondary-color)';
  }
}

function getStatusText(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return '#000000';
    case OrderStatus.PAID: return '#000000';
    case OrderStatus.SHIPPED: 
    case OrderStatus.DELIVERED:
    case OrderStatus.CANCELED:
      return 'var(--white-color)';
    default: return 'var(--white-color)';
  }
}
