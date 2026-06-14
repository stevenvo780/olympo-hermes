import React, { useMemo } from 'react';
import { Form } from 'react-bootstrap';
import {
  FaLock, FaUser, FaTruck, FaMapMarkerAlt, FaPencilAlt,
  FaCreditCard, FaCheckCircle, FaArrowRight, FaWhatsapp,
  FaInfoCircle, FaBoxes,
} from 'react-icons/fa';
import CredentialsSection from './CredentialsSection';

type ActivationsType = {
  requireLogin?: boolean;
  requireUserData?: boolean;
  requireBuyerData?: boolean;
  deliveryEnabled?: boolean;
  requireShippingData?: boolean;
  distributionEnabled?: boolean;
  [key: string]: boolean | undefined;
};

type ActivationsProps = {
  activations: ActivationsType;
  handleNestedChange: (key: string, value: boolean) => void;
  enablePaymentLinks?: boolean;
  onEnablePaymentLinksChange?: (enabled: boolean) => void;
  customQuestionsCount?: number;
};

interface StepPreview {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const ActivationsSection: React.FC<ActivationsProps> = ({
  activations, handleNestedChange,
  enablePaymentLinks = false, onEnablePaymentLinksChange,
  customQuestionsCount = 0,
}) => {
  const requireBuyerData = activations.requireBuyerData ?? activations.requireUserData ?? false;

  // Build preview steps exactly like CheckoutWizard does
  const previewSteps = useMemo<StepPreview[]>(() => {
    const steps: StepPreview[] = [];

    if (activations.requireLogin) {
      steps.push({ id: 'auth', label: 'Cuenta', icon: <FaLock />, color: '#6f42c1' });
    }
    if (requireBuyerData || enablePaymentLinks) {
      steps.push({ id: 'buyer-data', label: 'Datos', icon: <FaUser />, color: '#0d6efd' });
    }
    if (activations.deliveryEnabled) {
      steps.push({ id: 'delivery', label: 'Entrega', icon: <FaTruck />, color: '#198754' });
    }
    if (activations.requireShippingData) {
      steps.push({ id: 'shipping', label: 'Dirección', icon: <FaMapMarkerAlt />, color: '#fd7e14' });
    }
    if (customQuestionsCount > 0) {
      steps.push({ id: 'questions', label: 'Preguntas', icon: <FaPencilAlt />, color: '#6610f2' });
    }
    steps.push({
      id: 'confirm',
      label: enablePaymentLinks ? 'Pagar' : 'Confirmar',
      icon: enablePaymentLinks ? <FaCreditCard /> : <FaCheckCircle />,
      color: enablePaymentLinks ? '#0dcaf0' : '#198754',
    });

    return steps;
  }, [activations.requireLogin, requireBuyerData, activations.deliveryEnabled,
      activations.requireShippingData, enablePaymentLinks, customQuestionsCount]);

  return (
    <fieldset className="mb-4">
      <legend className="fw-bold mb-3">Pasos del Checkout</legend>

      {/* ── Flow Preview ── */}
      <div style={{
        background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '12px',
        padding: '16px', marginBottom: '24px',
      }}>
        <div className="text-muted small mb-2 fw-semibold">
          Vista previa del flujo de compra:
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          {previewSteps.map((step, i) => (
            <React.Fragment key={step.id}>
              {i > 0 && <FaArrowRight style={{ color: '#adb5bd', fontSize: '0.7rem' }} />}
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'white', border: `2px solid ${step.color}`,
                  borderRadius: '20px', padding: '4px 12px',
                  fontSize: '0.82rem', fontWeight: 500, color: step.color,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {step.icon}
                {step.label}
              </div>
            </React.Fragment>
          ))}
        </div>
        {previewSteps.length === 1 && (
          <div className="text-muted small mt-2" style={{ fontStyle: 'italic' }}>
            Sin pasos intermedios — el cliente confirma directamente.
          </div>
        )}
      </div>

      {/* ── Toggle: Inicio de sesión ── */}
      <div style={toggleCardStyle}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <FaLock style={{ color: '#6f42c1', fontSize: '1.1rem' }} />
            <strong>Inicio de sesión</strong>
          </div>
          <Form.Check
            type="switch"
            id="requireLogin"
            checked={activations.requireLogin || false}
            onChange={(e) => {
              const checked = e.target.checked;
              handleNestedChange('requireLogin', checked);
              if (!checked) {
                handleNestedChange('requireUserData', false);
              }
            }}
          />
        </div>
        <div className="text-muted small mt-1 ms-4">
          El cliente debe crear cuenta o iniciar sesión. Permite trazabilidad de pedidos por usuario.
        </div>
      </div>

      {/* ── Toggle: Datos del comprador ── */}
      <div style={toggleCardStyle}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <FaUser style={{ color: '#0d6efd', fontSize: '1.1rem' }} />
            <strong>Datos del comprador</strong>
          </div>
          <Form.Check
            type="switch"
            id="requireBuyerData"
            checked={requireBuyerData}
            onChange={(e) => {
              handleNestedChange('requireBuyerData', e.target.checked);
              handleNestedChange('requireUserData', e.target.checked);
            }}
            disabled={enablePaymentLinks}
          />
        </div>
        <div className="text-muted small mt-1 ms-4">
          Solicita nombre, teléfono, email y documento <strong>sin necesidad de cuenta</strong>.
          {enablePaymentLinks && (
            <span className="d-block mt-1" style={{ color: '#0d6efd' }}>
              <FaInfoCircle className="me-1" />
              Se activa automáticamente con pagos en línea (Wompi requiere datos del comprador).
            </span>
          )}
        </div>
      </div>

      {/* ── Toggle: Zonas de entrega ── */}
      <div style={toggleCardStyle}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <FaTruck style={{ color: '#198754', fontSize: '1.1rem' }} />
            <strong>Zonas de entrega</strong>
          </div>
          <Form.Check
            type="switch"
            id="deliveryEnabled"
            checked={activations.deliveryEnabled || false}
            onChange={(e) => handleNestedChange('deliveryEnabled', e.target.checked)}
          />
        </div>
        <div className="text-muted small mt-1 ms-4">
          El cliente selecciona zona de entrega con costo de envío automático.
          Configura las zonas en la sección de Delivery.
        </div>
      </div>

      {/* ── Toggle: Dirección de envío ── */}
      <div style={toggleCardStyle}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <FaMapMarkerAlt style={{ color: '#fd7e14', fontSize: '1.1rem' }} />
            <strong>Dirección de envío</strong>
          </div>
          <Form.Check
            type="switch"
            id="requireShippingData"
            checked={activations.requireShippingData || false}
            onChange={(e) => handleNestedChange('requireShippingData', e.target.checked)}
          />
        </div>
        <div className="text-muted small mt-1 ms-4">
          El cliente ingresa dirección completa (calle, ciudad, departamento, referencia).
        </div>
      </div>

      {/* ── Toggle: Módulo de distribución ── */}
      <div style={toggleCardStyle}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <FaBoxes style={{ color: '#0dcaf0', fontSize: '1.1rem' }} />
            <strong>Módulo de distribución</strong>
          </div>
          <Form.Check
            type="switch"
            id="distributionEnabled"
            checked={activations.distributionEnabled || false}
            onChange={(e) => handleNestedChange('distributionEnabled', e.target.checked)}
          />
        </div>
        <div className="text-muted small mt-1 ms-4">
          Habilita la cola de pedidos, enrutamiento y consolidado para la distribución multivendedor.
        </div>
      </div>

      {/* ── Separator: Payment method ── */}
      <div className="mt-4 mb-3">
        <div className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.05em' }}>
          Método de pago
        </div>
        <hr className="mt-1 mb-3" />
      </div>

      {/* ── Toggle: Pagos en línea (Wompi) ── */}
      <div style={{
        ...toggleCardStyle,
        borderColor: enablePaymentLinks ? '#0dcaf0' : '#e9ecef',
        background: enablePaymentLinks ? '#f0faff' : 'white',
      }}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <FaCreditCard style={{ color: '#0dcaf0', fontSize: '1.1rem' }} />
            <strong>Pagos en línea (Wompi)</strong>
          </div>
          <Form.Check
            type="switch"
            id="enablePaymentLinks"
            checked={enablePaymentLinks}
            onChange={(e) => onEnablePaymentLinksChange?.(e.target.checked)}
          />
        </div>
        <div className="text-muted small mt-1 ms-4">
          {enablePaymentLinks ? (
            <>
              <span className="d-flex align-items-center gap-1 mb-1">
                <FaWhatsapp style={{ color: '#25D366' }} /> WhatsApp
                <span className="mx-1">+</span>
                <FaCreditCard style={{ color: '#0dcaf0' }} /> Wompi
              </span>
              El cliente puede elegir entre enviar pedido por WhatsApp o pagar en línea con Wompi.
              Se solicitan datos del comprador automáticamente.
            </>
          ) : (
            <>
              <span className="d-flex align-items-center gap-1 mb-1">
                <FaWhatsapp style={{ color: '#25D366' }} /> Solo WhatsApp
              </span>
              El pedido se envía únicamente por WhatsApp. Activa esta opción para agregar pago con tarjeta/PSE.
            </>
          )}
        </div>
        {enablePaymentLinks && (
          <div className="mt-3 ms-4">
            <CredentialsSection />
          </div>
        )}
      </div>

      {/* ── Info: Preguntas personalizadas ── */}
      {customQuestionsCount > 0 && (
        <div className="mt-3 d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f0e6ff', fontSize: '0.85rem' }}>
          <FaPencilAlt style={{ color: '#6610f2' }} />
          <span><strong>{customQuestionsCount}</strong> pregunta{customQuestionsCount !== 1 ? 's' : ''} personalizada{customQuestionsCount !== 1 ? 's' : ''} configurada{customQuestionsCount !== 1 ? 's' : ''} (se muestran como paso adicional).</span>
        </div>
      )}
    </fieldset>
  );
};

const toggleCardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '10px',
  transition: 'box-shadow 0.15s',
};

export default ActivationsSection;
