'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { RootState, AppDispatch } from '@/redux/store';
import { addNotification } from '@/redux/ui';
import {
  PaymentMethod,
  BuyerData,
  ShippingAddress,
  DeliveryZone,
  CheckoutStepDef,
  CheckoutStepId,
} from '@/types';
import {
  createOrderAndSendWhatsApp,
  createOrderAndPayWithWompi,
  hasCustomQuestions,
} from '@/services/orderService';
import { setSelectedDeliveryZone } from '@/redux/cart';

import StepIndicator from './StepIndicator';
import { FaLock, FaUser, FaTruck, FaMapMarkerAlt, FaPencilAlt, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import AuthStep from './steps/AuthStep';
import BuyerDataStep from './steps/BuyerDataStep';
import DeliveryStep from './steps/DeliveryStep';
import ShippingStep from './steps/ShippingStep';
import CustomQuestionsStep from './steps/CustomQuestionsStep';
import ConfirmStep from './steps/ConfirmStep';
import '../checkout-wizard.scss';

const EMPTY_BUYER: BuyerData = { fullName: '', phone: '', email: '', documentNumber: '' };
const EMPTY_SHIPPING: ShippingAddress = {
  address: '', apartment: '', buildingName: '',
  city: '', department: '', country: '', reference: '',
};

/**
 * Determina los pasos dinámicos del checkout según la configuración de la tienda
 * y el método de pago elegido.
 */
function buildSteps(
  requireLogin: boolean,
  requireBuyerData: boolean,
  deliveryEnabled: boolean,
  requireShippingData: boolean,
  hasQuestions: boolean,
  userData: unknown,
  paymentMethod: PaymentMethod,
): CheckoutStepDef[] {
  const steps: CheckoutStepDef[] = [];

  // Auth step — only if requireLogin AND user not logged in
  if (requireLogin && !userData) {
    steps.push({ id: 'auth', title: 'Cuenta', icon: <FaLock /> });
  }

  // Buyer data — only when explicitly required by the store, or for Wompi
  // (Wompi always needs buyer info for the payment link). Guest checkout
  // without this flag falls back to a synthetic guest customer in the backend.
  if (requireBuyerData || paymentMethod === 'wompi') {
    steps.push({ id: 'buyer-data', title: 'Datos', icon: <FaUser /> });
  }

  // Delivery zone
  if (deliveryEnabled) {
    steps.push({ id: 'delivery', title: 'Entrega', icon: <FaTruck /> });
  }

  // Shipping address
  if (requireShippingData) {
    steps.push({ id: 'shipping', title: 'Dirección', icon: <FaMapMarkerAlt /> });
  }

  // Custom questions
  if (hasQuestions) {
    steps.push({ id: 'questions', title: 'Preguntas', icon: <FaPencilAlt /> });
  }

  // Confirm always last
  steps.push({
    id: 'confirm',
    title: paymentMethod === 'wompi' ? 'Pagar' : 'Confirmar',
    icon: paymentMethod === 'wompi' ? <FaCreditCard /> : <FaCheckCircle />,
  });

  return steps;
}

const CheckoutWizard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const router = useRouter();

  const storeId = params.storeId as string;

  // Redux state
  const { userData } = useSelector((state: RootState) => state.auth);
  const { carts } = useSelector((state: RootState) => state.cart);
  const config = useSelector((state: RootState) => state.ui.store?.configuration);
  const currentCart = storeId && carts[storeId] ? carts[storeId] : null;
  const enablePaymentLinks = config?.enablePaymentLinks ?? false;

  // Config flags - support both old `requireUserData` and new `requireBuyerData`
  const requireLogin = config?.activations?.requireLogin ?? false;
  const requireBuyerData =
    config?.activations?.requireBuyerData ??
    config?.activations?.requireUserData ??
    false;
  const deliveryEnabled = config?.activations?.deliveryEnabled ?? false;
  const requireShippingData = config?.activations?.requireShippingData ?? false;
  const questionsExist = hasCustomQuestions(config ?? null);

  // Wizard state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [buyerData, setBuyerData] = useState<BuyerData>(EMPTY_BUYER);
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_SHIPPING);
  const [customAnswers, setCustomAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build dynamic steps
  // When enablePaymentLinks is on, we always need buyer data (for Wompi), so treat as requireBuyerData
  const effectiveRequireBuyerData = requireBuyerData || enablePaymentLinks;
  const steps = useMemo(
    () => buildSteps(
      requireLogin, effectiveRequireBuyerData, deliveryEnabled,
      requireShippingData, questionsExist, userData, 'whatsapp',
    ),
    [requireLogin, effectiveRequireBuyerData, deliveryEnabled, requireShippingData, questionsExist, userData]
  );

  const currentStep: CheckoutStepId = steps[currentStepIndex]?.id ?? 'confirm';

  const goNext = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // Handle delivery zone selection (also sync to redux for order service)
  const handleDeliveryZone = useCallback((zone: DeliveryZone | null) => {
    setDeliveryZone(zone);
    dispatch(setSelectedDeliveryZone(zone));
  }, [dispatch]);

  // ── Submit order ──
  const handleSubmit = useCallback(async (method: PaymentMethod = 'whatsapp') => {
    if (!currentCart?.items || currentCart.items.length === 0) {
      dispatch(addNotification({ message: 'Tu carrito está vacío', color: 'warning' }));
      return;
    }

    setIsSubmitting(true);

    const buyerInfo = {
      buyerName: buyerData.fullName || userData?.user?.name,
      buyerPhone: buyerData.phone || userData?.profile?.additionalPhone,
      buyerEmail: buyerData.email || userData?.user?.email,
      buyerDocument: buyerData.documentNumber || userData?.profile?.documentNumber,
      shippingAddress,
    };

    try {
      if (method === 'wompi') {
        const result = await createOrderAndPayWithWompi(customAnswers, buyerInfo);
        if (result.success && result.paymentLink) {
          dispatch(addNotification({ message: result.message, color: 'success' }));
          window.location.href = result.paymentLink;
        } else {
          dispatch(addNotification({ message: result.message, color: 'warning' }));
        }
      } else {
        const result = await createOrderAndSendWhatsApp(customAnswers, buyerInfo);
        if (result.success) {
          dispatch(addNotification({ message: result.message, color: 'success' }));
          if (result.needsRedirect && result.redirectTo) {
            router.push(result.redirectTo);
          }
        } else {
          dispatch(addNotification({ message: result.message, color: 'danger' }));
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error && error.message
        ? error.message
        : (error as any)?.response?.data?.message || 'Error al procesar el pedido. Intenta nuevamente.';
      dispatch(addNotification({
        message: errorMessage,
        color: 'danger',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [currentCart, customAnswers, buyerData, userData, dispatch, router]);

  // ── No cart? ──
  if (!currentCart || currentCart.items.length === 0) {
    return (
      <Container className="mt-4 text-center">
        <Alert variant="warning">
          <h5>No hay productos en el carrito</h5>
          <p className="mb-0">Regresa a la tienda y agrega productos para continuar.</p>
        </Alert>
      </Container>
    );
  }

  // ── Render current step ──
  const renderStep = () => {
    switch (currentStep) {
      case 'auth':
        return <AuthStep onComplete={goNext} />;

      case 'buyer-data':
        return (
          <BuyerDataStep
            buyerData={buyerData}
            onChange={setBuyerData}
            onNext={goNext}
            onBack={goBack}
            showBack={currentStepIndex > 0}
          />
        );

      case 'delivery':
        return (
          <DeliveryStep
            selectedZone={deliveryZone}
            onSelectZone={handleDeliveryZone}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 'shipping':
        return (
          <ShippingStep
            shippingAddress={shippingAddress}
            onChange={setShippingAddress}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 'questions':
        return (
          <CustomQuestionsStep
            answers={customAnswers}
            onChange={setCustomAnswers}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 'confirm':
        return (
          <ConfirmStep
            enablePaymentLinks={enablePaymentLinks}
            buyerData={buyerData}
            deliveryZone={deliveryZone}
            shippingAddress={shippingAddress}
            customAnswers={customAnswers}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBack={goBack}
            showBuyerData={steps.some(s => s.id === 'buyer-data')}
            showDelivery={steps.some(s => s.id === 'delivery')}
            showShipping={steps.some(s => s.id === 'shipping')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container className="checkout-wizard mt-3">
      <div className="checkout-wizard__header">
        <h4>
          <FaCheckCircle className="me-2" />Finalizar Pedido
        </h4>
      </div>

      <StepIndicator steps={steps} currentIndex={currentStepIndex} />

      {renderStep()}
    </Container>
  );
};

export default CheckoutWizard;
