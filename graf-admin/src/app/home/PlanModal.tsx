'use client'
import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import axios from '@/utils/axios';
import axiosWompi from 'axios';
import styles from './AdminHome.module.scss';
import { addNotification } from '@/redux/ui';
import { setSuscription } from '@/redux/auth';
import {
  FaCrown, FaRocket, FaLeaf, FaBuilding,
  FaBox, FaFileInvoice, FaHeadset,
  FaEnvelope, FaPhoneAlt,
  FaArrowRight,
  FaTimes
} from 'react-icons/fa';
import PlanSelection from './PlanSelection';
import PaymentForm from './PaymentForm';
import { PaymentFrequency, PlanType } from '@/types';

export const PLAN_DETAILS: Record<
  PlanType,
  {
    price: number;
    monthlyOrderLimit: number;
    name: string;
    description: string;
    color: string;
    icon: React.ReactElement;
    features: Array<{
      name: string;
      icon: React.ReactElement & { props: { className?: string } };
      tooltip?: string;
      highlight?: boolean;
      bad?: boolean;
    }>;
    recommended?: boolean;
  }
> = {
  [PlanType.FREE]: {
    price: 0,
    monthlyOrderLimit: 20,
    name: 'Free',
    description: 'Para empezar',
    color: 'light',
    icon: <FaLeaf className="fs-3 text-success" />,
    features: [
      { name: 'Órdenes limitadas', icon: <FaTimes />, bad: true },
      { name: 'Marca de agua', icon: <FaTimes />, bad: true },
      { name: 'Sin dominio personalizado', icon: <FaTimes />, bad: true },
    ]
  },
  [PlanType.BASIC]: {
    price: 30000,
    monthlyOrderLimit: 500,
    name: 'Básico',
    description: 'Negocios pequeños',
    color: 'info',
    icon: <FaRocket className="fs-3 text-info" />,
    features: [
      { name: 'Mas ordenes mensuales', icon: <FaArrowRight />, highlight: true  },
      { name: 'Soporte por basico', icon: <FaHeadset />, highlight: true },
      { name: 'Marca de agua', icon: <FaTimes />, bad: true },
      { name: 'Sin dominio personalizado', icon: <FaTimes />, bad: true },
    ],
  },
  [PlanType.PRO]: {
    price: 80000,
    monthlyOrderLimit: 3000,
    name: 'Profesional',
    description: 'Negocios en crecimiento',
    color: 'secondary',
    icon: <FaCrown className="fs-3 text-secondary" />,
    features: [
      { name: 'Soporte prioritario', icon: <FaHeadset />, highlight: true, tooltip: 'Tiempo de respuesta en menos de 24h' },
      { name: 'Dominio personalizado', icon: <FaEnvelope />, highlight: true },
      { name: 'Soporte 24/7', icon: <FaPhoneAlt />, highlight: true },
      { name: 'Sin marca de agua', icon: <FaFileInvoice />, highlight: true },
    ],
    recommended: true
  },
  [PlanType.ENTERPRISE]: {
    price: 200000,
    monthlyOrderLimit: 50000,
    name: 'Empresarial',
    description: 'Grandes empresas',
    color: 'primary',
    icon: <FaBuilding className="fs-3 text-primary" />,
    features: [
      { name: 'Soporte prioritario', icon: <FaHeadset />, highlight: true, tooltip: 'Tiempo de respuesta en menos de 24h' },
      { name: 'Mas ordenes mensuales', icon: <FaArrowRight />, highlight: true  },
      { name: 'Soporte 24/7', icon: <FaPhoneAlt />, highlight: true },
      { name: 'Sin marca de agua', icon: <FaFileInvoice />, highlight: true },
    ]
  },
};

interface PlanModalProps {
  currentPlan: PlanType;
  onClose: () => void;
}

export default function PlanModal({ currentPlan, onClose }: PlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [tokenAcceptanceData, setTokenAcceptanceData] = useState<{
    acceptance_token: string;
    accept_personal_auth: string;
  }>({
    acceptance_token: '',
    accept_personal_auth: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Procesando...');

  const [checked, setChecked] = useState(false);

  const [formData, setFormData] = useState({
    cardNumber: '',
    securityCode: '',
    expirationMonth: '',
    expirationYear: '',
    cardholderName: '',
  });

  const [frequency, setFrequency] = useState<PaymentFrequency>(PaymentFrequency.MONTHLY);

  const dispatch = useDispatch();

  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const getToken = async (): Promise<{ acceptance_token: string; accept_personal_auth: string }> => {
    try {
      setIsProcessing(true);
      setLoadingMessage('Cargando términos y condiciones...');

      const response = await axios.get(`${process.env.NEXT_PUBLIC_WOMPI_URL}/merchants/${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}`);

      return {
        acceptance_token: response.data.data.presigned_acceptance.acceptance_token,
        accept_personal_auth: response.data.data.presigned_personal_data_auth.acceptance_token
      };
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === 'cardNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 16);
      setFormData({ ...formData, [name]: numericValue });
      return;
    }

    if (name === 'securityCode') {
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData({ ...formData, [name]: numericValue });
      return;
    }

    if (name === 'expirationMonth') {
      const numericValue = value.replace(/\D/g, '').slice(0, 2);
      if (
        numericValue === '' ||
        numericValue.length === 1 ||
        (numericValue.length === 2 && parseInt(numericValue) >= 1 && parseInt(numericValue) <= 12)
      ) {
        setFormData({ ...formData, [name]: numericValue });
      }
      return;
    }

    if (name === 'expirationYear') {
      const numericValue = value.replace(/\D/g, '').slice(0, 2);
      setFormData({ ...formData, [name]: numericValue });
      return;
    }

    if (name === 'cardholderName') {
      setFormData({ ...formData, [name]: value.toUpperCase() });
      return;
    }

    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const formatCardNumber = (value: string) => {
    const groups: string[] = [];
    for (let i = 0; i < value.length; i += 4) {
      groups.push(value.slice(i, i + 4));
    }
    return groups.join(' ');
  };

  const handlePlanSelect = (plan: PlanType) => setSelectedPlan(plan);

  const handlePaymentInit = () => {
    if (!selectedPlan || selectedPlan === currentPlan) return;

    if (selectedPlan === PlanType.FREE) {
      dispatch(addNotification({ message: 'No puedes seleccionar el plan gratuito', color: 'danger' }));
      return;
    }

    setShowPaymentForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tokenAcceptanceData.acceptance_token === '' || tokenAcceptanceData.accept_personal_auth === '') {
      dispatch(addNotification({ message: 'Debes aceptar los términos', color: 'danger' }));
      return;
    }

    if (!selectedPlan) {
      dispatch(addNotification({ message: 'Debes seleccionar un plan', color: 'danger' }));
      return;
    }

    if (formData.cardNumber.length < 15) {
      dispatch(addNotification({ message: 'Número de tarjeta inválido', color: 'danger' }));
      return;
    }

    if (formData.securityCode.length < 3) {
      dispatch(addNotification({ message: 'Código de seguridad inválido', color: 'danger' }));
      return;
    }

    if (formData.expirationMonth.length !== 2 || formData.expirationYear.length !== 2) {
      dispatch(addNotification({ message: 'Fecha de expiración inválida', color: 'danger' }));
      return;
    }

    if (!formData.cardholderName) {
      dispatch(addNotification({ message: 'Nombre del titular requerido', color: 'danger' }));
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    setLoadingMessage('Procesando pago...');

    try {
      const creditCardData = {
        number: formData.cardNumber,
        exp_month: formData.expirationMonth,
        exp_year: formData.expirationYear,
        cvc: formData.securityCode,
        card_holder: formData.cardholderName,
      };

      const creditCardTokenResponse = await axiosWompi.post(
        `${process.env.NEXT_PUBLIC_WOMPI_URL}/tokens/cards`,
        creditCardData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}`
          }
        }
      );
      const responde = await axios.post(`/wompi/subscribe`, {
        planType: selectedPlan,
        frequency: frequency,
        tokenId: creditCardTokenResponse.data.data.id,
        token: "direct-payment",
        acceptanceToken: tokenAcceptanceData.acceptance_token,
        acceptPersonalAuthToken: tokenAcceptanceData.accept_personal_auth,
      });

      dispatch(setSuscription(responde.data.subscription));

      dispatch(addNotification({ message: '¡Plan actualizado con éxito!', color: 'success' }));
      onClose();
    } catch (error: unknown) {
      resetTermsAcceptance();

      const errorResponse =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: { messages?: Record<string, string[]> }; details?: string } } }).response
          : undefined;

      if (errorResponse?.data?.error?.messages) {
        for (const message of Object.values(errorResponse.data.error.messages)) {
          if (Array.isArray(message) && message.length > 0) {
            dispatch(addNotification({
              message: message[0],
              color: 'danger',
            }));
          }
        }
      } else if (errorResponse?.data?.details) {
        dispatch(addNotification({
          message: errorResponse.data.details,
          color: 'danger',
        }));
      } else {
        dispatch(addNotification({
          message: error instanceof Error ? error.message : 'Error en la transacción',
          color: 'danger',
        }));
      }
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const resetTermsAcceptance = () => {
    setChecked(false);
    setTokenAcceptanceData({
      acceptance_token: '',
      accept_personal_auth: ''
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

  const handleChangeCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
    if (event.target.checked) {
      getToken().then((data) => {
        setTokenAcceptanceData({
          acceptance_token: data.acceptance_token,
          accept_personal_auth: data.accept_personal_auth
        });
      }).catch(error => {
        console.error('Error al obtener los términos y condiciones:', error);
        dispatch(addNotification({
          message: 'Error al cargar los términos y condiciones',
          color: 'danger',
        }));
        setChecked(false);
      });
    } else {
      setTokenAcceptanceData({
        acceptance_token: '',
        accept_personal_auth: ''
      });
    }
  };

  const LoadingOverlay = () => (
    <div className={styles.loadingOverlay}>
      <Spinner animation="border" role="status" variant="primary" />
      <p className="mt-3 fs-5">{loadingMessage}</p>
    </div>
  );

  const getPlanPrice = (plan: PlanType): number => {
    const monthlyPrice = PLAN_DETAILS[plan].price;
    return frequency === PaymentFrequency.ANNUALLY ? monthlyPrice * 12 * 0.8 : monthlyPrice;
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrequency(e.target.value as PaymentFrequency);
  };

  const handleBackToSelection = () => {
    setShowPaymentForm(false);
  };

  const handleCancelSubscription = async () => {
    try {
      setIsProcessing(true);
      setLoadingMessage('Cancelando suscripción...');
      const newSuscripcion = await axios.post('/wompi/cancel-subscription');
      dispatch(setSuscription(newSuscripcion.data));
      dispatch(addNotification({ message: 'Suscripción cancelada con éxito', color: 'success' }));
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cancelar la suscripción';
      dispatch(addNotification({ message: errorMessage, color: 'danger' }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal show onHide={onClose} size="xl" centered fullscreen="lg-down" className={styles.planModal}>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold fs-3">
          <FaCrown className="text-warning me-2" /> Seleccionar Plan
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="position-relative pt-0">
        {isProcessing && <LoadingOverlay />}

        {showCancelConfirmation ? (
          <div>
            <Alert variant="warning">
              <Alert.Heading>¿Estás seguro que deseas cancelar tu suscripción?</Alert.Heading>
              <p>
                Al cancelar tu suscripción perderás todas las ventajas de tu plan actual:
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {currentPlan !== PlanType.FREE && currentPlan && PLAN_DETAILS[currentPlan].features.map((feature, index) => (
                  <Card key={index} className="mb-0" style={{ width: 'auto' }}>
                    <Card.Body className="py-2 px-3 d-flex align-items-center">
                      {feature.icon} <span className="ms-2">{feature.name}</span>
                    </Card.Body>
                  </Card>
                ))}
                {currentPlan !== PlanType.FREE && currentPlan !== PlanType.BASIC && (
                  <Card className="mb-0" style={{ width: 'auto' }}>
                    <Card.Body className="py-2 px-3 d-flex align-items-center">
                      <FaBox /> <span className="ms-2">{PLAN_DETAILS[currentPlan].monthlyOrderLimit} órdenes/mes</span>
                    </Card.Body>
                  </Card>
                )}
              </div>

              <Alert variant="light" className="mb-3 py-2">
                <div className="d-flex align-items-center">
                  <FaLeaf className="me-2" />
                  <div>
                    <span>Tu cuenta volverá al plan gratuito con {PLAN_DETAILS[PlanType.FREE].monthlyOrderLimit} órdenes mensuales.</span>
                  </div>
                </div>
              </Alert>

              <div className="mt-3">
                <small>Esta acción no se puede deshacer.</small>
              </div>

              <hr />
              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowCancelConfirmation(false)}
                  className="me-2"
                  size="sm"
                >
                  Volver
                </Button>
                <Button variant="danger" onClick={handleCancelSubscription} size="sm">
                  Confirmar Cancelación
                </Button>
              </div>
            </Alert>
          </div>
        ) : !showPaymentForm ? (
          <>
            <PlanSelection
              currentPlan={currentPlan}
              selectedPlan={selectedPlan}
              frequency={frequency}
              handlePlanSelect={handlePlanSelect}
              handleFrequencyChange={handleFrequencyChange}
              handlePaymentInit={handlePaymentInit}
              formatPrice={formatPrice}
              getPlanPrice={getPlanPrice}
              isProcessing={isProcessing}
            />

            {currentPlan !== PlanType.FREE && (
              <div className="text-center mt-3">
                <Button
                  variant="link"
                  size="sm"
                  className="text-danger"
                  onClick={() => setShowCancelConfirmation(true)}
                >
                  <small>Cancelar mi suscripción actual</small>
                </Button>
              </div>
            )}
          </>
        ) : (
          <PaymentForm
            currentPlan={currentPlan}
            selectedPlan={selectedPlan}
            frequency={frequency}
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            checked={checked}
            handleChangeCheckbox={handleChangeCheckbox}
            formatCardNumber={formatCardNumber}
            formatPrice={formatPrice}
            getPlanPrice={getPlanPrice}
            isLoading={isLoading}
            isProcessing={isProcessing}
          />
        )}
      </Modal.Body>

      <Modal.Footer className="border-top-0 pt-0">
        <Button
          variant="outline-secondary"
          onClick={onClose}
          disabled={isLoading || isProcessing}
          className="px-4"
        >
          Cancelar
        </Button>

        {showPaymentForm && (
          <Button
            variant="secondary"
            onClick={handleBackToSelection}
            disabled={isLoading || isProcessing}
            className="px-4"
          >
            Volver
          </Button>
        )}

        {!showPaymentForm && (
          <Button
            variant={selectedPlan ? PLAN_DETAILS[selectedPlan].color : 'primary'}
            onClick={handlePaymentInit}
            disabled={!selectedPlan || selectedPlan === currentPlan || isLoading || isProcessing}
            className="px-4 fw-bold"
          >
            <FaArrowRight className="me-2" />
            Continuar
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
