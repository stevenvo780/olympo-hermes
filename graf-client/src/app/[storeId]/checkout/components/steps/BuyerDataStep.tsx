'use client';
import React, { useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { BuyerData } from '@/types';
import { FaUser } from 'react-icons/fa';

interface BuyerDataStepProps {
  buyerData: BuyerData;
  onChange: (data: BuyerData) => void;
  onNext: () => void;
  onBack: () => void;
  showBack: boolean;
}

const BuyerDataStep: React.FC<BuyerDataStepProps> = ({
  buyerData, onChange, onNext, onBack, showBack,
}) => {
  const { userData } = useSelector((state: RootState) => state.auth);

  // Pre-fill from logged-in user if available
  useEffect(() => {
    if (userData && !buyerData.fullName && !buyerData.phone) {
      onChange({
        fullName: userData.user?.name || '',
        phone: userData.profile?.additionalPhone || '',
        email: userData.user?.email || '',
        documentNumber: userData.profile?.documentNumber || userData.user?.documentNumber || '',
      });
    }
  }, [userData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof BuyerData, value: string) => {
    onChange({ ...buyerData, [field]: value });
  };

  const isValid = buyerData.fullName.trim() !== '' && buyerData.phone.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onNext();
  };

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-card__title"><FaUser className="me-2" />Datos del Comprador</div>
      <p className="wizard-step-card__subtitle">
        Necesitamos algunos datos para procesar tu pedido.
      </p>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nombre completo <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            placeholder="Tu nombre completo"
            value={buyerData.fullName}
            onChange={e => handleChange('fullName', e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Teléfono <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="tel"
            placeholder="Número de teléfono"
            value={buyerData.phone}
            onChange={e => handleChange('phone', e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Correo electrónico</Form.Label>
          <Form.Control
            type="email"
            placeholder="correo@ejemplo.com (opcional)"
            value={buyerData.email}
            onChange={e => handleChange('email', e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Número de documento</Form.Label>
          <Form.Control
            type="text"
            placeholder="Cédula o NIT (opcional)"
            value={buyerData.documentNumber}
            onChange={e => handleChange('documentNumber', e.target.value)}
          />
        </Form.Group>

        <div className="wizard-nav">
          {showBack && (
            <Button variant="outline-secondary" onClick={onBack} className="wizard-nav__btn">
              ← Atrás
            </Button>
          )}
          <Button variant="primary" type="submit" disabled={!isValid}
            className={`wizard-nav__btn ${!showBack ? 'ms-auto' : ''}`}>
            Continuar →
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default BuyerDataStep;
