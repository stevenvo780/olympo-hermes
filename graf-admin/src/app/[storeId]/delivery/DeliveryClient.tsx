'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import api from '@/utils/axios';
import { formatNumberWithCommas } from '@/utils/formatters';

interface DeliveryZone {
  id: number;
  zone: string;
  price: number;
  freeShippingThreshold?: number;
  estimatedTime: string;
}

interface DeliveryZonePayload {
  zone: string;
  price: number;
  freeShippingThreshold?: number | null;
  estimatedTime: string;
}

export default function DeliveryClient() {
  const { storeId } = useParams() as { storeId: string };
  const dispatch = useDispatch();
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentZone, setCurrentZone] = useState<DeliveryZone | null>(null);
  const [zone, setZone] = useState('');
  const [price, setPrice] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<number | null>(null);

  const resetForm = () => {
    setZone('');
    setPrice('');
    setFreeShippingThreshold('');
    setEstimatedTime('');
  };

  const fetchDeliveryZones = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/delivery-zones/${storeId}`);
      setDeliveryZones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
      dispatch(addNotification({ message: 'Error al cargar zonas de entrega', color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  }, [storeId, dispatch]);

  useEffect(() => {
    if (storeId) {
      fetchDeliveryZones();
    }
  }, [storeId, fetchDeliveryZones]);

  const handleShowModal = (mode: 'create' | 'edit', zoneData?: DeliveryZone) => {
    setModalMode(mode);
    if (mode === 'edit' && zoneData) {
      setCurrentZone(zoneData);
      setZone(zoneData.zone);
      setPrice(zoneData.price.toString());
      setFreeShippingThreshold(zoneData.freeShippingThreshold?.toString() || '');
      setEstimatedTime(zoneData.estimatedTime);
    } else {
      setCurrentZone(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setCurrentZone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedThreshold = freeShippingThreshold ? parseFloat(freeShippingThreshold) : 0;
    const payload: DeliveryZonePayload = {
      zone,
      price: parseInt(price || '0', 10),
      freeShippingThreshold: parsedThreshold > 0 ? parsedThreshold : null,
      estimatedTime
    };

    try {
      if (modalMode === 'create') {
        await api.post(`/delivery-zones/${storeId}`, payload);
        dispatch(addNotification({ message: 'Zona de entrega creada exitosamente', color: 'success' }));
      } else if (modalMode === 'edit' && currentZone) {
        await api.patch(`/delivery-zones/${currentZone.id}`, payload);
        dispatch(addNotification({ message: 'Zona de entrega actualizada exitosamente', color: 'success' }));
      }
      fetchDeliveryZones();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving delivery zone:', error);
      dispatch(addNotification({ message: 'Error al guardar la zona de entrega', color: 'danger' }));
    }
  };

  const handleShowDeleteModal = (id: number) => {
    setZoneToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setZoneToDelete(null);
  };

  const confirmDelete = async () => {
    if (zoneToDelete) {
      try {
        await api.delete(`/delivery-zones/${zoneToDelete}`);
        dispatch(addNotification({ message: 'Zona de entrega eliminada exitosamente', color: 'success' }));
        fetchDeliveryZones();
      } catch (error) {
        console.error('Error deleting delivery zone:', error);
        dispatch(addNotification({ message: 'Error al eliminar la zona de entrega', color: 'danger' }));
      }
      handleCloseDeleteModal();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Zonas de Entrega</h1>
        <Button variant="primary" onClick={() => handleShowModal('create')}>
          Nueva Zona de Entrega
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Zona</th>
            <th>Precio</th>
            <th>Envío Gratis desde</th>
            <th>Tiempo Est.</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {deliveryZones.length > 0 ? (
            deliveryZones.map((zone) => (
              <tr key={zone.id}>
                <td>{zone.id}</td>
                <td>{zone.zone}</td>
                <td>${formatNumberWithCommas(typeof zone.price === 'string' ? parseFloat(zone.price) || 0 : (zone.price || 0), 0)}</td>
                <td>
                  {zone.freeShippingThreshold != null && Number(zone.freeShippingThreshold) > 0
                    ? `$${formatNumberWithCommas(typeof zone.freeShippingThreshold === 'string' ? parseFloat(zone.freeShippingThreshold) : zone.freeShippingThreshold, 0)}`
                    : '-'}
                </td>
                <td>{zone.estimatedTime}</td>
                <td>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowModal('edit', zone)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteModal(zone.id)}
                  >
                    Borrar
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">No hay zonas de entrega registradas</td>
            </tr>
          )}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Nueva Zona de Entrega' : 'Editar Zona de Entrega'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Zona</Form.Label>
              <Form.Control
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
                required
              />
              <Form.Text className="text-muted">Ingresa solo números (sin puntos ni comas).</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Envío Gratis desde (opcional)</Form.Label>
              <Form.Control
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 50000"
              />
              <Form.Text className="text-muted">
                Monto mínimo del pedido para obtener envío gratis. Déjalo vacío si no aplica.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tiempo Estimado</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: 30-45 min"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {modalMode === 'create' ? 'Crear' : 'Actualizar'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro que desea eliminar esta zona de entrega?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
