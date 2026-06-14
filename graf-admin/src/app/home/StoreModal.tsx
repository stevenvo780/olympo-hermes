'use client'
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { StoreFormData } from '@/types';

interface StoreModalProps {
  store: StoreFormData;
  onClose: () => void;
  onSave: (data: StoreFormData) => void;
  onDelete: (id: string) => void;
}

export default function StoreModal({ store, onClose, onSave, onDelete }: StoreModalProps) {
  const [formData, setFormData] = useState(store);
  const isEditing = Boolean(store.id);

  useEffect(() => {
    setFormData(store);
  }, [store]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = () => {
    if (store.id) {
      onDelete(store.id);
      onClose();
    }
  };

  return (
    <Modal show={true} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Editar Comercio' : 'Crear Comercio'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Comercio</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre del comercio"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción del comercio"
            />
          </Form.Group>
          <hr/>
          <h5 className="fw-bold">Datos del Whatsapp donde llegaran los pedidos</h5>
          <Form.Group className="mb-3">
            <Form.Label>Prefijo del celular</Form.Label>
            <Form.Control
              type="text"
              name="phonePrefix"
              value={formData.phonePrefix}
              onChange={handleChange}
              placeholder="Prefijo telefónico"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Número de celular</Form.Label>
            <Form.Control
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Número telefónico"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          {isEditing && (
            <Button variant="danger" className="me-auto" onClick={handleDelete}>
              Eliminar
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
