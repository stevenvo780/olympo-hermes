'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import api from '@/utils/axios';
import { Discount } from '@/types';
import { DiscountType } from '@/types/order';

interface DiscountPayload {
  name: string;
  discountType: string;
  discountValue: number;
}

export default function DiscountsClient() {
  const { storeId } = useParams() as { storeId: string };
  const dispatch = useDispatch();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentDiscount, setCurrentDiscount] = useState<Discount | null>(null);
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState(DiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<number | null>(null);

  const resetForm = () => {
    setDiscountName('');
    setDiscountType(DiscountType.PERCENTAGE);
    setDiscountValue('');
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case DiscountType.PERCENTAGE:
        return 'Porcentaje';
      case DiscountType.FIXED:
        return 'Fijo';
      default:
        return type;
    }
  };

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/discounts/${storeId}`);
      setDiscounts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchDiscounts();
    }
  }, [storeId, fetchDiscounts]);

  const handleShowModal = (mode: 'create' | 'edit', discount?: Discount) => {
    setModalMode(mode);
    if (mode === 'edit' && discount) {
      setCurrentDiscount(discount);
      setDiscountName(discount.name);
      setDiscountType(discount.discountType as DiscountType);
      setDiscountValue(discount.discountValue.toString());
    } else {
      setCurrentDiscount(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setCurrentDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: DiscountPayload = {
      name: discountName,
      discountType,
      discountValue: parseFloat(discountValue)
    };
    try {
      if (modalMode === 'create') {
        await api.post(`/discounts/${storeId}`, payload);
        dispatch(addNotification({ message: 'Descuento creado exitosamente', color: 'success' }));
      } else if (modalMode === 'edit' && currentDiscount) {
        await api.patch(`/discounts/${storeId}/${currentDiscount.id}`, payload);
        dispatch(addNotification({ message: 'Descuento actualizado exitosamente', color: 'success' }));
      }
      fetchDiscounts();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving discount:', error);
      dispatch(addNotification({ message: 'Error al guardar el descuento', color: 'danger' }));
    }
  };

  const handleShowDeleteModal = (id: number) => {
    setDiscountToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDiscountToDelete(null);
  };

  const confirmDelete = async () => {
    if (discountToDelete) {
      try {
        await api.delete(`/discounts/${storeId}/${discountToDelete}`);
        dispatch(addNotification({ message: 'Descuento eliminado exitosamente', color: 'success' }));
        fetchDiscounts();
      } catch (error) {
        console.error('Error deleting discount:', error);
        dispatch(addNotification({ message: 'Error al eliminar el descuento', color: 'danger' }));
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
        <h1>Descuentos</h1>
        <Button variant="primary" onClick={() => handleShowModal('create')}>
          Nuevo Descuento
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map((discount) => (
            <tr key={discount.id}>
              <td>{discount.id}</td>
              <td>{discount.name}</td>
              <td>{getDiscountTypeLabel(discount.discountType)}</td>
              <td>{discount.discountValue}</td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleShowModal('edit', discount)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleShowDeleteModal(discount.id)}
                >
                  Borrar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Nuevo Descuento' : 'Editar Descuento'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={discountName}
                onChange={(e) => setDiscountName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de descuento</Form.Label>
              <Form.Select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              >
                <option value={DiscountType.FIXED}>Fijo</option>
                <option value={DiscountType.PERCENTAGE}>Porcentaje</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
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
          ¿Está seguro que desea eliminar este descuento?
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