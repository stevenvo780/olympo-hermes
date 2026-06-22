'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import Link from 'next/link';
import {
  FaCrown, FaRocket, FaLeaf, FaBuilding,
  FaCheck, FaTimes, FaArrowRight, FaStar, FaBox
} from 'react-icons/fa';
import { defaultPalette } from '@/utils/defaultPalette';

enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

interface PlanInfo {
  type: PlanType;
  name: string;
  description: string;
  price: number;
  annualPrice: number;
  monthlyOrderLimit: number;
  icon: React.ReactElement;
  color: string;
  gradient: string;
  features: PlanFeature[];
  recommended?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    type: PlanType.FREE,
    name: 'Free',
    description: 'Perfecto para empezar y probar la plataforma',
    price: 0,
    annualPrice: 0,
    monthlyOrderLimit: 20,
    icon: <FaLeaf className="fs-1" />,
    color: '#28a745',
    gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    features: [
      { name: 'Hasta 20 órdenes/mes', included: true },
      { name: 'Productos ilimitados', included: true },
      { name: 'Panel de administración', included: true },
      { name: 'Marca de agua Hermes', included: false },
      { name: 'Dominio personalizado', included: false },
      { name: 'Soporte prioritario', included: false },
    ]
  },
  {
    type: PlanType.BASIC,
    name: 'Básico',
    description: 'Ideal para negocios pequeños en crecimiento',
    price: 30000,
    annualPrice: 288000,
    monthlyOrderLimit: 500,
    icon: <FaRocket className="fs-1" />,
    color: '#17a2b8',
    gradient: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
    features: [
      { name: 'Hasta 500 órdenes/mes', included: true, highlight: true },
      { name: 'Productos ilimitados', included: true },
      { name: 'Panel de administración', included: true },
      { name: 'Soporte básico', included: true },
      { name: 'Marca de agua Hermes', included: false },
      { name: 'Dominio personalizado', included: false },
    ]
  },
  {
    type: PlanType.PRO,
    name: 'Profesional',
    description: 'Para negocios que buscan escalar',
    price: 80000,
    annualPrice: 768000,
    monthlyOrderLimit: 3000,
    icon: <FaCrown className="fs-1" />,
    color: '#6c757d',
    gradient: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
    features: [
      { name: 'Hasta 3,000 órdenes/mes', included: true, highlight: true },
      { name: 'Productos ilimitados', included: true },
      { name: 'Sin marca de agua', included: true, highlight: true },
      { name: 'Dominio personalizado', included: true, highlight: true },
      { name: 'Soporte 24/7', included: true, highlight: true },
      { name: 'Soporte prioritario', included: true },
    ],
    recommended: true
  },
  {
    type: PlanType.ENTERPRISE,
    name: 'Empresarial',
    description: 'Solución completa para grandes empresas',
    price: 200000,
    annualPrice: 1920000,
    monthlyOrderLimit: 50000,
    icon: <FaBuilding className="fs-1" />,
    color: `${defaultPalette['--primary-color']}`,
    gradient: `linear-gradient(135deg, ${defaultPalette['--primary-color']} 0%, ${defaultPalette['--secondary-color']} 100%)`,
    features: [
      { name: 'Hasta 50,000 órdenes/mes', included: true, highlight: true },
      { name: 'Productos ilimitados', included: true },
      { name: 'Sin marca de agua', included: true },
      { name: 'Dominio personalizado', included: true },
      { name: 'Soporte 24/7 prioritario', included: true, highlight: true },
      { name: 'Consultoría personalizada', included: true, highlight: true },
    ]
  }
];

const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://prizma-hermes-kjopuery2a-uc.a.run.app';

  return (
    <section className="pricing-section">
      {/* Hero */}
      <div
        className="text-center py-5"
        style={{
          background: `linear-gradient(135deg, ${defaultPalette['--primary-color']} 0%, ${defaultPalette['--secondary-color']} 100%)`,
          color: 'white',
          borderRadius: '1.5rem',
          padding: '50px 20px 70px',
        }}
      >
        <Container>
          <h2 className="display-5 fw-bold mb-3">Planes y Precios</h2>
          <p className="lead mb-4 mx-auto" style={{ maxWidth: '600px' }}>
            Elige el plan que mejor se adapte a tu negocio. Sin compromisos, cambia cuando quieras.
          </p>

          {/* Toggle anual/mensual */}
          <div className="d-inline-flex align-items-center gap-3 bg-white bg-opacity-25 rounded-pill px-4 py-2">
            <span className={`fw-semibold ${!isAnnual ? 'text-white' : 'text-white-50'}`}>Mensual</span>
            <div
              onClick={() => setIsAnnual(!isAnnual)}
              style={{
                width: '56px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: isAnnual ? '#28a745' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.3s',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: isAnnual ? '31px' : '3px',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <span className={`fw-semibold ${isAnnual ? 'text-white' : 'text-white-50'}`}>
              Anual <Badge bg="warning" text="dark" className="ms-1">-20%</Badge>
            </span>
          </div>
        </Container>
      </div>

      {/* Plans Grid */}
      <Container style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        <Row className="g-4 justify-content-center">
          {PLANS.map((plan) => {
            const displayPrice = isAnnual ? plan.annualPrice : plan.price;
            const period = isAnnual ? '/año' : '/mes';
            const monthlySavings = isAnnual && plan.price > 0 ? (plan.price * 12) - plan.annualPrice : 0;

            return (
              <Col key={plan.type} xs={12} sm={6} lg={3}>
                <Card
                  className="h-100 border-0 shadow-lg position-relative overflow-hidden"
                  style={{
                    borderRadius: '1rem',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                  }}
                >
                  {plan.recommended && (
                    <div
                      className="position-absolute text-center"
                      style={{ top: '-1px', left: '0', right: '0', zIndex: 2 }}
                    >
                      <Badge
                        bg="warning"
                        text="dark"
                        className="px-3 py-2 fw-bold"
                        style={{ borderRadius: '0 0 8px 8px', fontSize: '0.8rem' }}
                      >
                        <FaStar className="me-1" /> Más Popular
                      </Badge>
                    </div>
                  )}

                  {/* Header */}
                  <div
                    className="text-center text-white p-4"
                    style={{
                      background: plan.gradient,
                      paddingTop: plan.recommended ? '2.5rem' : '1.5rem',
                    }}
                  >
                    <div className="mb-2" style={{ opacity: 0.9 }}>{plan.icon}</div>
                    <h3 className="fw-bold mb-1" style={{ fontSize: '1.25rem' }}>{plan.name}</h3>
                    <small style={{ opacity: 0.85 }}>{plan.description}</small>
                  </div>

                  {/* Price */}
                  <div className="text-center py-4 px-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <div>
                      <span className="display-6 fw-bold" style={{ color: '#333' }}>
                        {plan.price === 0 ? 'Gratis' : formatPrice(displayPrice)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted fs-6">{period}</span>
                      )}
                    </div>
                    {monthlySavings > 0 && (
                      <Badge bg="success" className="mt-2">
                        Ahorro {formatPrice(monthlySavings)}/año
                      </Badge>
                    )}
                    <div className="mt-2">
                      <Badge bg="light" text="dark" className="px-3 py-2">
                        <FaBox className="me-1" />
                        {plan.monthlyOrderLimit.toLocaleString('es-CO')} órdenes/mes
                      </Badge>
                    </div>
                  </div>

                  {/* Features */}
                  <Card.Body className="px-4">
                    <ul className="list-unstyled mb-0">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="d-flex align-items-center mb-3"
                          style={{ fontSize: '0.9rem' }}
                        >
                          {feature.included ? (
                            <FaCheck
                              className="me-2 flex-shrink-0"
                              style={{
                                color: feature.highlight ? plan.color : '#28a745',
                                fontSize: '0.85rem',
                              }}
                            />
                          ) : (
                            <FaTimes
                              className="me-2 flex-shrink-0"
                              style={{ color: '#dc3545', fontSize: '0.85rem' }}
                            />
                          )}
                          <span
                            style={{
                              color: feature.included ? '#333' : '#999',
                              fontWeight: feature.highlight ? 600 : 400,
                              textDecoration: feature.included ? 'none' : 'line-through',
                            }}
                          >
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>

                  {/* CTA */}
                  <Card.Footer className="bg-transparent border-0 px-4 pb-4">
                    <Link
                      href={`${adminUrl}/register`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      <Button
                        className="w-100 fw-bold py-2"
                        style={{
                          backgroundColor: plan.recommended ? plan.color : 'transparent',
                          borderColor: plan.color,
                          color: plan.recommended ? 'white' : plan.color,
                          borderRadius: '50px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = plan.color;
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          if (!plan.recommended) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = plan.color;
                          }
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {plan.price === 0 ? 'Comenzar Gratis' : 'Comenzar Ahora'} <FaArrowRight className="ms-1" />
                      </Button>
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
};

export default PricingSection;
