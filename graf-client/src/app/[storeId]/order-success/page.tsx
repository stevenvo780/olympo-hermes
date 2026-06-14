'use client';

import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Badge } from 'react-bootstrap';
import { FaCheckCircle, FaHome, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import './page.scss';

const OrderSuccessPage: React.FC = () => {
  const { storeId } = useParams() as { storeId: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failed' | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {

    const status = searchParams.get('status');
    const orderIdParam = searchParams.get('orderId');

    if (orderIdParam) {
      setOrderId(orderIdParam);
    }

    if (status) {
      switch (status.toLowerCase()) {
        case 'approved':
        case 'success':
          setPaymentStatus('success');
          dispatch(addNotification({ 
            message: 'Pago procesado exitosamente', 
            color: 'success' 
          }));
          break;
        case 'pending':
          setPaymentStatus('pending');
          dispatch(addNotification({ 
            message: 'Pago pendiente de confirmación', 
            color: 'warning' 
          }));
          break;
        case 'declined':
        case 'failed':
        case 'error':
          setPaymentStatus('failed');
          dispatch(addNotification({ 
            message: 'Error en el procesamiento del pago', 
            color: 'danger' 
          }));
          break;
        default:
          setPaymentStatus('pending');
      }
    } else {

      setPaymentStatus('success');
    }

    setLoading(false);
  }, [searchParams, dispatch]);

  const handleGoHome = () => {
    router.push(`/${storeId}`);
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="status-icon-wrapper success-icon">
            <FaCheckCircle size={64} color="#ffffff" />
          </div>
        );
      case 'pending':
        return (
          <div className="status-icon-wrapper pending-icon">
            <FaClock size={64} color="#ffffff" />
          </div>
        );
      case 'failed':
        return (
          <div className="status-icon-wrapper failed-icon">
            <FaExclamationTriangle size={64} color="#ffffff" />
          </div>
        );
      default:
        return <Spinner animation="border" variant="primary" size="sm" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return '¡Pago Exitoso!';
      case 'pending':
        return 'Pago Pendiente';
      case 'failed':
        return 'Error en el Pago';
      default:
        return 'Procesando...';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Tu pago ha sido procesado exitosamente. Puedes consultar tu orden y su estado en tu perfil.';
      case 'pending':
        return 'Tu pago está siendo procesado. Te notificaremos cuando se complete la transacción.';
      case 'failed':
        return 'Hubo un problema al procesar tu pago. Por favor, intenta nuevamente o contacta con soporte.';
      default:
        return 'Verificando el estado de tu pago...';
    }
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'success':
        return <Badge bg="success" className="status-badge">Aprobado</Badge>;
      case 'pending':
        return <Badge bg="warning" className="status-badge">Pendiente</Badge>;
      case 'failed':
        return <Badge bg="danger" className="status-badge">Rechazado</Badge>;
      default:
        return <Badge bg="info" className="status-badge">Procesando</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <div className="text-center loading-content">
            <div className="loading-spinner-wrapper">
              <Spinner animation="border" variant="primary" />
            </div>
            <h4 className="mt-4 text-muted">Verificando el estado de tu pago...</h4>
            <p className="text-muted">Por favor espera un momento</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <Container className="py-5">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8 col-xl-6">
            <Card className="order-success-card shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center">

                  <div className="status-icon-container mb-4">
                    {getStatusIcon()}
                  </div>

                  <div className="mb-3">
                    {getStatusBadge()}
                  </div>

                  <h1 className="status-title mb-4">{getStatusTitle()}</h1>

                  <div className="status-message-container mb-4">
                    <p className="status-message lead">{getStatusMessage()}</p>
                  </div>

                  {orderId && (
                    <div className="order-info-card mb-4">
                      <div className="order-info-content">
                        <small className="order-info-label">Número de orden</small>
                        <div className="order-id"># {orderId}</div>
                      </div>
                    </div>
                  )}

                  <div className="action-buttons">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleGoHome}
                      className="action-button primary-button mb-3"
                    >
                      <FaHome className="me-2" />
                      Volver a la tienda
                    </Button>
                    <br/>
                    
                    {(paymentStatus === 'success' || paymentStatus === 'pending') && (
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => router.push(`/${storeId}/orders`)}
                        className="action-button tertiary-button mb-3"
                      >
                        Ver estado de mis pedidos
                      </Button>
                    )}
                    
                    {paymentStatus === 'failed' && (
                      <Button 
                        variant="outline-danger" 
                        size="lg"
                        onClick={() => router.push(`/${storeId}/checkout`)}
                        className="action-button secondary-button"
                      >
                        Intentar nuevamente
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default OrderSuccessPage;
