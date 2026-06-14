'use client';

import { useState } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  Row,
  Col,
  InputGroup
} from 'react-bootstrap';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiHome,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiEdit2,
  FiPlus
} from 'react-icons/fi';
import {
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
  useCustomers
} from '@/app/[storeId]/customers/hooks/useCustomers';

interface CustomerFormProps {
  storeId: string;
  customer?: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomerForm({
  storeId,
  customer,
  onClose,
  onSuccess
}: CustomerFormProps) {
  const { createCustomer, updateCustomer } = useCustomers(storeId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    postalCode: customer?.postalCode || '',
    birthDate: customer?.birthDate ? customer.birthDate.split('T')[0] : '',
    loyaltyPoints: customer?.loyaltyPoints || 0,
    isActive: customer?.isActive ?? true,
    notes: customer?.notes || '',
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (customer) {

        const updateData: UpdateCustomerData = {
          ...formData,
          birthDate: formData.birthDate || undefined,
        };
        await updateCustomer(customer.id, updateData);
      } else {

        const createData: CreateCustomerData = {
          ...formData,
          birthDate: formData.birthDate || undefined,
        };
        await createCustomer(createData);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show onHide={onClose} size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            {customer ? (
              <>
                <FiEdit2 className="me-2" size={16} style={{ color: 'var(--primary-color, #1B3862)' }} />
                Editar Cliente
              </>
            ) : (
              <>
                <FiPlus className="me-2" size={16} style={{ color: 'var(--success-color, #278F7E)' }} />
                Nuevo Cliente
              </>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              <strong>Error:</strong> {error}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre completo *</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FiUser size={14} style={{ color: 'var(--primary-color, #1B3862)' }} /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Ej: Juan Pérez"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email *</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FiMail size={14} style={{ color: 'var(--info-color, #4A90A0)' }} /></InputGroup.Text>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="Ej: juan@ejemplo.com"
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FiPhone size={14} style={{ color: 'var(--success-color, #278F7E)' }} /></InputGroup.Text>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Ej: +57 300 123 4567"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ciudad</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FiMapPin size={14} style={{ color: 'var(--warning-color, #E9B44C)' }} /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ej: Bogotá"
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FiHome size={14} style={{ color: 'var(--secondary-color, #06817E)' }} /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Ej: Calle 123 #45-67"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Código Postal</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="Ej: 110111"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Nacimiento</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FiCalendar size={14} style={{ color: 'var(--info-color, #4A90A0)' }} /></InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Puntos de Fidelidad</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FiAward size={14} style={{ color: 'var(--warning-color, #E9B44C)' }} /></InputGroup.Text>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.loyaltyPoints}
                    onChange={(e) => handleInputChange('loyaltyPoints', parseInt(e.target.value) || 0)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Notas</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre el cliente..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="isActive"
              label="Cliente activo"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
            />
            <Form.Text className="text-muted">
              Los clientes inactivos no podrán realizar pedidos
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Guardando...
              </>
            ) : (
              customer ? 'Actualizar Cliente' : 'Crear Cliente'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
