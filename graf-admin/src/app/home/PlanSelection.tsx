import React from 'react';
import { Form, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { FaStar, FaBox, FaTools } from 'react-icons/fa';
import { PLAN_DETAILS } from './PlanModal';
import { PlanType, PaymentFrequency } from '@/types';

interface PlanSelectionProps {
  currentPlan: PlanType;
  selectedPlan: PlanType | null;
  frequency: PaymentFrequency;
  handlePlanSelect: (plan: PlanType) => void;
  handleFrequencyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaymentInit: () => void;
  formatPrice: (value: number) => string;
  getPlanPrice: (plan: PlanType) => number;
  isProcessing: boolean;
}

export default function PlanSelection({
  currentPlan,
  selectedPlan,
  frequency,
  handlePlanSelect,
  handleFrequencyChange,
  formatPrice,
  getPlanPrice,
}: PlanSelectionProps) {

  const cardStyles = (planType: PlanType) => {
    const isSelected = selectedPlan === planType;
    const isCurrent = currentPlan === planType;
    return {
      height: '100%',
      borderWidth: isSelected ? '2px' : '1px',
      borderColor: isSelected ? `var(--${PLAN_DETAILS[planType].color}-color)` : 'var(--border-color)',
      boxShadow: isSelected ? `0 0 15px rgba(0,0,0,0.15)` : 'none',
      transition: 'all 0.3s ease',
      cursor: isCurrent ? 'default' : 'pointer',
      opacity: isCurrent && planType !== selectedPlan ? 0.8 : 1,
      transform: isSelected ? 'translateY(-5px)' : 'none'
    };
  };

  return (
    <>
      <p className="mb-3 text-muted">
        Plan actual: <Badge bg={PLAN_DETAILS[currentPlan].color} className="fs-6 py-1 px-2">{PLAN_DETAILS[currentPlan].name}</Badge>
      </p>

      <Form.Group className="mb-4">
        <Form.Label className="fw-bold">Frecuencia de pago</Form.Label>
        <div className="d-flex">
          <Form.Check
            type="radio"
            id="monthlyCard"
            label="Mensual"
            name="frequencyCard"
            value={PaymentFrequency.MONTHLY}
            checked={frequency === PaymentFrequency.MONTHLY}
            onChange={handleFrequencyChange}
            className="me-3"
          />
          <Form.Check
            type="radio"
            id="annualCard"
            label="Anual (20% de descuento)"
            name="frequencyCard"
            value={PaymentFrequency.ANNUALLY}
            checked={frequency === PaymentFrequency.ANNUALLY}
            onChange={handleFrequencyChange}
          />
        </div>
      </Form.Group>

      <Row className="g-3">
        {Object.entries(PLAN_DETAILS).map(([planKey, plan]) => {
          const planType = planKey as PlanType;
          const isCurrentPlan = planType === currentPlan;

          return (
            <Col key={planKey} xs={12} md={6} lg={3} className="mb-3">
              <Card
                style={cardStyles(planType)}
                onClick={() => !isCurrentPlan && handlePlanSelect(planType)}
                className={`h-100 ${selectedPlan === planType ? 'border-2' : ''}`}
              >
                {plan.recommended && (
                  <div className="position-absolute" style={{ top: '-10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
                    <Badge bg="warning" className="px-2 py-1 text-dark shadow-sm">
                      <FaStar className="me-1" /> Más popular
                    </Badge>
                  </div>
                )}

                <Card.Header
                  className={`${planType === PlanType.FREE ? 'text-dark' : 'text-white'} bg-${plan.color} text-center py-2`}
                  style={{ height: '85px' }}
                >
                  <div className="d-flex justify-content-center mb-1">
                    {plan.icon}
                  </div>
                  <h5 className="mb-0 fw-bold">{plan.name}</h5>
                  {isCurrentPlan && <Badge bg="light" text="dark" className="mt-1 py-0 px-2 small">Plan actual</Badge>}
                </Card.Header>

                <Card.Body className="d-flex flex-column p-2 pt-3">
                  <div className="text-center mb-2">
                    {frequency === PaymentFrequency.MONTHLY ? (
                      <>
                        <span className="fs-5 fw-bold">{formatPrice(plan.price)}</span>
                        <span className="text-muted">/mes</span>
                      </>
                    ) : (
                      <>
                        <span className="fs-5 fw-bold">{formatPrice(getPlanPrice(planType))}</span>
                        <span className="text-muted">/año</span>
                        {plan.price > 0 && (
                          <small className="d-block text-success">
                            Ahorro {formatPrice(plan.price * 12 - getPlanPrice(planType))}
                          </small>
                        )}
                      </>
                    )}
                    <small className="text-muted d-block">{plan.description}</small>
                  </div>

                  <div className="mt-2">
                    <div className="border-top pt-2">
                      <div className="d-flex align-items-center mb-2">
                        <Badge
                          bg={planType === PlanType.FREE ? 'light' : plan.color}
                          text={planType === PlanType.FREE ? 'dark' : 'white'}
                          className="me-1 p-1"
                        >
                          <FaBox className="fs-6" />
                        </Badge>
                        <small className="ms-1">
                          <strong>{plan.monthlyOrderLimit.toLocaleString('es-CO')}</strong> órdenes/mes
                        </small>
                      </div>
                      <ul className="list-unstyled mb-0 small">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="d-flex align-items-center mb-2">
                            {feature.bad ? (
                              <Badge bg="danger" className="me-1 p-1">
                                {feature.icon}
                              </Badge>
                            ) : (
                              <Badge
                                bg={feature.highlight ? plan.color : 'light'}
                                text={feature.highlight ? 'white' : 'dark'}
                                className="me-1 p-1"
                              >
                                <FaTools className="fs-6 d-none" />
                                {feature.icon}
                              </Badge>
                            )}
                            <small className={feature.highlight ? 'fw-bold' : ''}>{feature.name}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    variant={plan.color}
                    style={{
                      color: `var(--${plan.color}-text) !important`,
                    }}
                    disabled={isCurrentPlan}
                    className="w-100 mt-auto py-1"
                    size="sm"
                    onClick={() => handlePlanSelect(planType)}
                  >
                    <span style={{
                      color: `var(--${plan.color}-text) !important`,
                    }}>
                      {isCurrentPlan ? 'Plan Actual' : (selectedPlan === planType ? 'Seleccionado' : 'Seleccionar')}
                    </span>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

    </>
  );
}
