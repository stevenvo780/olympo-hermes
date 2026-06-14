'use client'
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from '@/utils/axios';
import styles from './AdminHome.module.scss';
import { addNotification } from '@/redux/ui';
import { useDispatch } from 'react-redux';

interface StorePaymentModalProps {
  storeName: string;
  onClose: () => void;
}

export default function StorePaymentModal({ storeName, onClose }: StorePaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponField, setShowCouponField] = useState(false);
  const dispatch = useDispatch();

  const handleCreatePaymentLink = async () => {
    try {
      setIsLoading(true);
      try {
        if (storeName === 'graf') {
          dispatch(addNotification({
            message: 'El nombre de la tienda ya está ocupado. Por favor, elige otro.',
            color: 'danger'
          }));
          return;
        }
        const response = await axios.get(`/store/${storeName}`);
        if (response.data) {
          dispatch(addNotification({
            message: 'El nombre de la tienda ya está ocupado. Por favor, elige otro.',
            color: 'danger'
          }));
          return;
        }
      } catch (error: unknown) {
        const status =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

        if (status !== 404) {
          dispatch(addNotification({
            message: 'Error al validar el nombre de la tienda',
            color: 'danger'
          }));
          return;
        }
      }

      const { data } = await axios.post('/wompi/payment-link/store', {
        storeId: storeName,
        couponCode: couponCode.trim() || undefined,
      });

      if (typeof data === 'object' && data.message && data.storeId) {
        dispatch(addNotification({
          message: '¡Tienda creada exitosamente con el cupón!',
          color: 'success'
        }));
        onClose();
        window.location.reload();
      }
      else if (typeof data === 'string') {
        dispatch(addNotification({
          message: 'Redirigiendo a la pasarela de pago...',
          color: 'info'
        }));
        window.open(data, '_blank');
        onClose();
      } else {
        throw new Error('Respuesta del servidor no reconocida');
      }
    } catch (error: unknown) {
      console.error('Error creating payment link:', error);
      const responseMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message
          : undefined;

      if (responseMessage?.includes('Cupón')) {
        dispatch(addNotification({
          message: responseMessage || 'Cupón inválido o ya utilizado',
          color: 'danger'
        }));
      } else {
        dispatch(addNotification({
          message:
            responseMessage ||
            (error instanceof Error ? error.message : 'Error al procesar la solicitud'),
          color: 'danger'
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={true} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Compra de Tienda: {storeName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.storePaymentCard}>
          <h4>Nueva Tienda</h4>
          <p>Al comprar una tienda obtendrás:</p>
          <ul className="list-unstyled text-start">
            <li>✅ Panel de administración personalizado</li>
            <li>✅ Tienda online con tu marca</li>
            <li>✅ Actualizaciones gratuitas</li>
          </ul>
          <div className="mt-4">
            <h3>Precio: $30.000 COP</h3>
            <p className="text-muted">Pago único</p>
          </div>
          <p>Procede con el proceso de pago para la tienda &quot;{storeName}&quot;.</p>

          {!showCouponField ? (
            <Button
              variant="link"
              className="p-0 text-decoration-none"
              style={{ border: 'none', boxShadow: 'none' }}
              onClick={() => setShowCouponField(true)}
            >
              ¿Tienes un cupón de regalo?
            </Button>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>Cupón de regalo</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ingresa tu código de cupón"
                  className="me-2"
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setShowCouponField(false);
                    setCouponCode('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
              <Form.Text className="text-muted">
                Si tienes un cupón válido, podrás crear tu tienda sin realizar un pago.
              </Form.Text>
            </Form.Group>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleCreatePaymentLink}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando...' : 'Proceder al pago'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
