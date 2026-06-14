'use client';
import React, { Suspense } from 'react';
import { Spinner, Container } from 'react-bootstrap';
import CheckoutWizard from './components/CheckoutWizard';

/**
 * Checkout page — now powered by the step-by-step wizard.
 * The old monolithic form is replaced by CheckoutWizard which
 * dynamically builds steps based on store configuration.
 *
 * URL params:
 *  - ?method=whatsapp (default) → WhatsApp order flow
 *  - ?method=wompi → Online payment via Wompi
 */
const CheckoutPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Container className="mt-5 text-center">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Cargando checkout...</p>
        </Container>
      }
    >
      <CheckoutWizard />
    </Suspense>
  );
};

export default CheckoutPage;
