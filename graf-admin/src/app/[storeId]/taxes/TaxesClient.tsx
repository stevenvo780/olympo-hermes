'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/ui';
import api from '@/utils/axios';
import { Tax } from '@/types';

interface TaxPayload {
  name: string;
  rate: number;
}

export default function TaxesClient() {
  const { storeId } = useParams() as { storeId: string };
  const dispatch = useDispatch();
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTax, setCurrentTax] = useState<Tax | null>(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taxToDelete, setTaxToDelete] = useState<number | null>(null);

  const resetForm = () => {
    setName('');
    setRate('');
  };

  const fetchTaxes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/taxes/${storeId}`);
      setTaxes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching taxes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchTaxes();
    }
  }, [storeId, fetchTaxes]);

  const handleShowModal = (mode: 'create' | 'edit', tax?: Tax) => {
    setModalMode(mode);
    if (mode === 'edit' && tax) {
      setCurrentTax(tax);
      setName(tax.name);
      setRate(tax.rate.toString());
    } else {
      setCurrentTax(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setCurrentTax(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: TaxPayload = {
      name,
      rate: parseFloat(rate)
    };

    try {
      if (modalMode === 'create') {
        await api.post(`/taxes/${storeId}`, payload);
        dispatch(addNotification({ message: 'Impuesto creado exitosamente', color: 'success' }));
      } else if (modalMode === 'edit' && currentTax) {
        await api.patch(`/taxes/${storeId}/${currentTax.id}`, payload);
        dispatch(addNotification({ message: 'Impuesto actualizado exitosamente', color: 'success' }));
      }
      fetchTaxes();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving tax:', error);
      dispatch(addNotification({ message: 'Error al guardar el impuesto', color: 'danger' }));
    }
  };

  const handleShowDeleteModal = (id: number) => {
    setTaxToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTaxToDelete(null);
  };

  const confirmDelete = async () => {
    if (taxToDelete) {
      try {
        await api.delete(`/taxes/${storeId}/${taxToDelete}`);
        dispatch(addNotification({ message: 'Impuesto eliminado exitosamente', color: 'success' }));
        fetchTaxes();
      } catch (error) {
        console.error('Error deleting tax:', error);
        dispatch(addNotification({ message: 'Error al eliminar el impuesto', color: 'danger' }));
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
        <h1>Impuestos</h1>
        <Button variant="primary" onClick={() => handleShowModal('create')}>
          Nuevo Impuesto
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tasa (%)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {taxes.map((tax) => (
            <tr key={tax.id}>
              <td>{tax.id}</td>
              <td>{tax.name}</td>
              <td>{tax.rate}%</td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleShowModal('edit', tax)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleShowDeleteModal(tax.id)}
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
            {modalMode === 'create' ? 'Nuevo Impuesto' : 'Editar Impuesto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tasa (%)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
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
          ¿Está seguro que desea eliminar este impuesto?
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