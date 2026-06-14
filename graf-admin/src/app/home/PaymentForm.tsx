import React from 'react';
import { Form, Button, Spinner, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaShieldAlt, FaLock, FaCreditCard, FaRocket } from 'react-icons/fa';
import { PLAN_DETAILS } from './PlanModal';
import { PlanType, PaymentFrequency } from '@/types';

interface PaymentFormProps {
  currentPlan: PlanType;
  selectedPlan: PlanType | null;
  frequency: PaymentFrequency;
  formData: {
    cardNumber: string;
    securityCode: string;
    expirationMonth: string;
    expirationYear: string;
    cardholderName: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChangeCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  formatCardNumber: (value: string) => string;
  formatPrice: (price: number) => string;
  getPlanPrice: (plan: PlanType) => number;
  isLoading: boolean;
  isProcessing: boolean;
  checked: boolean;
}

export default function PaymentForm({
  selectedPlan,
  frequency,
  formData,
  handleChange,
  handleChangeCheckbox,
  handleSubmit,
  formatCardNumber,
  formatPrice,
  getPlanPrice,
  isLoading,
  isProcessing,
  checked
}: PaymentFormProps) {
  if (!selectedPlan) return null;

  const planPrice = PLAN_DETAILS[selectedPlan].price;
  const totalPrice = getPlanPrice(selectedPlan);
  const discount = frequency === PaymentFrequency.ANNUALLY ? planPrice * 12 * 0.2 : 0;

  return (
    <div className="payment-form p-4 border rounded shadow-sm">
      <h4 className="text-center mb-4 fw-bold">
        <FaCreditCard className="me-2 text-secondary" />
        Ingresa tus datos de pago
      </h4>

      <Row>
        <Col md={7}>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Número de Tarjeta</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaCreditCard className="text-secondary" />
                </span>
                <Form.Control
                  type="text"
                  name="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  value={formatCardNumber(formData.cardNumber)}
                  onChange={handleChange}
                  required
                  autoFocus
                  className="form-control-lg"
                />
              </div>
              <Form.Text muted>
                <FaLock className="me-1" /> Ingresa los 16 dígitos sin espacios
              </Form.Text>
            </Form.Group>

            <Row className="mb-4">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Fecha de Expiración</Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="text"
                      name="expirationMonth"
                      placeholder="MM"
                      maxLength={2}
                      className="form-control-lg text-center"
                      value={formData.expirationMonth}
                      onChange={handleChange}
                      required
                    />
                    <span className="fs-4">/</span>
                    <Form.Control
                      type="text"
                      name="expirationYear"
                      placeholder="AA"
                      maxLength={2}
                      className="form-control-lg text-center"
                      value={formData.expirationYear}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold">CVV / CCV</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="password"
                      name="securityCode"
                      placeholder="000"
                      maxLength={4}
                      value={formData.securityCode}
                      onChange={handleChange}
                      required
                      className="form-control-lg"
                    />
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>El código se encuentra en la parte trasera de tu tarjeta</Tooltip>}
                    >
                      <span className="input-group-text">
                        <FaShieldAlt className="text-secondary" />
                      </span>
                    </OverlayTrigger>
                  </div>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fw-bold">Nombre del Titular</Form.Label>
                  <Form.Control
                    type="text"
                    name="cardholderName"
                    placeholder="Nombre del Titular"
                    value={formData.cardholderName}
                    onChange={handleChange}
                    required
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <div className="d-flex p-3 border rounded bg-light">
                <Form.Check
                  type="checkbox"
                  checked={checked}
                  onChange={handleChangeCheckbox}
                  id="terms-check"
                  disabled={isProcessing}
                  className="me-3"
                  style={{ transform: 'scale(1.2)' }}
                />
                <Form.Label htmlFor="terms-check" className="mb-0 lh-base">
                  Acepto los <a href="https://wompi.com/es/co/terminos-condiciones-comercios" target="_blank" rel="noopener noreferrer">términos y condiciones</a> de Wompi
                </Form.Label>
              </div>
            </Form.Group>

            <div className="d-flex flex-column align-items-center">
              <Button
                variant={PLAN_DETAILS[selectedPlan].color}
                type="submit"
                className="w-100 py-3 mb-3 fw-bold"
                disabled={isLoading || isProcessing || !checked}
              >
                {isLoading ? (
                  <><Spinner animation="border" size="sm" className="me-2" />Procesando...</>
                ) : (
                  <>
                    <FaLock className="me-2" />
                    Pagar {formatPrice(totalPrice)}
                    {frequency === PaymentFrequency.ANNUALLY ? '/año' : '/mes'}
                  </>
                )}
              </Button>

              <div className="text-center mt-3 d-flex justify-content-center align-items-center">
                <FaShieldAlt className="text-success me-2" />
                <small className="text-muted">Pago seguro con cifrado SSL</small>
              </div>
            </div>
          </Form>
        </Col>

        <Col md={5}>
          <div className="border rounded p-3 h-100 bg-light">
            <h5 className="mb-3 d-flex align-items-center">
              <FaRocket className={`me-2 text-${PLAN_DETAILS[selectedPlan].color}`} />
              Resumen del Plan
            </h5>

            <Row className="mb-2">
              <Col xs={6} className="text-muted">Plan:</Col>
              <Col xs={6} className="text-end fw-bold">
                {PLAN_DETAILS[selectedPlan].name}
              </Col>
            </Row>
            
            <Row className="mb-2">
              <Col xs={6} className="text-muted">Periodicidad:</Col>
              <Col xs={6} className="text-end">
                {frequency === PaymentFrequency.MONTHLY ? 'Anual' : 'Mensual'}
              </Col>
            </Row>
            
            {frequency === PaymentFrequency.ANNUALLY && (
              <>
                <Row className="mb-2">
                  <Col xs={6} className="text-muted">Precio base:</Col>
                  <Col xs={6} className="text-end">
                    {formatPrice(planPrice * 12)}
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Col xs={6} className="text-muted">Descuento (20%):</Col>
                  <Col xs={6} className="text-end text-success">
                    -{formatPrice(discount)}
                  </Col>
                </Row>
              </>
            )}
            
            <Row className="border-top pt-2 mt-2">
              <Col xs={6} className="fw-bold">Total a pagar:</Col>
              <Col xs={6} className="text-end fw-bold fs-5 text-primary">
                {formatPrice(totalPrice)}
                <span className="text-muted fs-6 ms-1">
                  {frequency === PaymentFrequency.ANNUALLY ? '/año' : '/mes'}
                </span>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </div>
  );
}
