'use client';
import React, { useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ShippingAddress } from '@/types';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface ShippingStepProps {
  shippingAddress: ShippingAddress;
  onChange: (data: ShippingAddress) => void;
  onNext: () => void;
  onBack: () => void;
}

const ShippingStep: React.FC<ShippingStepProps> = ({
  shippingAddress, onChange, onNext, onBack,
}) => {
  const { userData } = useSelector((state: RootState) => state.auth);

  // Pre-fill from logged-in user profile
  useEffect(() => {
    if (userData?.profile?.shippingAddress && !shippingAddress.address) {
      const sa = userData.profile.shippingAddress;
      onChange({
        address: sa.address || '',
        apartment: sa.apartment || '',
        buildingName: sa.buildingName || '',
        city: sa.city || '',
        department: sa.department || '',
        country: sa.country || '',
        reference: sa.reference || '',
      });
    }
  }, [userData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    onChange({ ...shippingAddress, [field]: value });
  };

  const isValid =
    shippingAddress.address.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    shippingAddress.department.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onNext();
  };

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-card__title"><FaMapMarkerAlt className="me-2" />Dirección de Envío</div>
      <p className="wizard-step-card__subtitle">
        Ingresa la dirección donde deseas recibir tu pedido.
      </p>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Dirección <span className="text-danger">*</span></Form.Label>
          <Form.Control type="text" placeholder="Calle, carrera, número..."
            value={shippingAddress.address} onChange={e => handleChange('address', e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Referencia</Form.Label>
          <Form.Control type="text" placeholder="Cerca de..., frente a..."
            value={shippingAddress.reference || ''} onChange={e => handleChange('reference', e.target.value)} />
        </Form.Group>

        <Row>
          <Col xs={6}>
            <Form.Group className="mb-3">
              <Form.Label>Apartamento</Form.Label>
              <Form.Control type="text" placeholder="Apto / Interior"
                value={shippingAddress.apartment || ''} onChange={e => handleChange('apartment', e.target.value)} />
            </Form.Group>
          </Col>
          <Col xs={6}>
            <Form.Group className="mb-3">
              <Form.Label>Edificio</Form.Label>
              <Form.Control type="text" placeholder="Nombre del edificio"
                value={shippingAddress.buildingName || ''} onChange={e => handleChange('buildingName', e.target.value)} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col xs={4}>
            <Form.Group className="mb-3">
              <Form.Label>Ciudad <span className="text-danger">*</span></Form.Label>
              <Form.Control type="text" placeholder="Ciudad"
                value={shippingAddress.city} onChange={e => handleChange('city', e.target.value)} required />
            </Form.Group>
          </Col>
          <Col xs={4}>
            <Form.Group className="mb-3">
              <Form.Label>Departamento <span className="text-danger">*</span></Form.Label>
              <Form.Control type="text" placeholder="Depto."
                value={shippingAddress.department} onChange={e => handleChange('department', e.target.value)} required />
            </Form.Group>
          </Col>
          <Col xs={4}>
            <Form.Group className="mb-3">
              <Form.Label>País</Form.Label>
              <Form.Control type="text" placeholder="País"
                value={shippingAddress.country} onChange={e => handleChange('country', e.target.value)} />
            </Form.Group>
          </Col>
        </Row>

        <div className="wizard-nav">
          <Button variant="outline-secondary" onClick={onBack} className="wizard-nav__btn">
            ← Atrás
          </Button>
          <Button variant="primary" type="submit" disabled={!isValid} className="wizard-nav__btn">
            Continuar →
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ShippingStep;
