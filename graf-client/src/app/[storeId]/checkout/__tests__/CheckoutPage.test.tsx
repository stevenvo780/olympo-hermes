/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CheckoutWizard from '../components/CheckoutWizard';
import {
  createOrderAndSendWhatsApp,
  createOrderAndPayWithWompi,
  hasCustomQuestions,
} from '@/services/orderService';

// ── Mocks ──

vi.mock('react-icons/fa', () => {
  const icon = (name: string) => {
    const C = ({ className }: any) => <span data-testid={`icon-${name}`} className={className} />;
    C.displayName = name;
    return C;
  };
  return {
    FaLock: icon('lock'),
    FaUser: icon('user'),
    FaTruck: icon('truck'),
    FaMapMarkerAlt: icon('map'),
    FaPencilAlt: icon('pencil'),
    FaCreditCard: icon('card'),
    FaCheckCircle: icon('check'),
    FaCheck: icon('check-sm'),
    FaWhatsapp: icon('whatsapp'),
    FaGift: icon('gift'),
    FaClock: icon('clock'),
  };
});

// Mock firebase
vi.mock('firebase/compat/app', () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    app: vi.fn(),
    auth: vi.fn(() => ({ currentUser: null })),
    firestore: vi.fn(() => ({})),
    storage: vi.fn(() => ({})),
  },
}));
vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/firestore', () => ({}));
vi.mock('firebase/auth', () => ({ getAuth: vi.fn() }));
vi.mock('@/utils/firebase', () => ({ auth: { currentUser: null } }));

// Mock next/navigation
const mockRouter = { push: vi.fn() };
vi.mock('next/navigation', () => ({
  useParams: () => ({ storeId: 'test-store' }),
  useRouter: () => mockRouter,
}));

// Mock services
vi.mock('@/services/orderService', () => ({
  createOrderAndSendWhatsApp: vi.fn(() =>
    Promise.resolve({ success: true, message: 'Orden creada', needsRedirect: false }),
  ),
  createOrderAndPayWithWompi: vi.fn(() =>
    Promise.resolve({ success: true, paymentLink: 'http://wompi.com', message: 'Pago creado' }),
  ),
  hasCustomQuestions: vi.fn(() => false),
}));

vi.mock('@/utils/formatters', () => ({
  formatNumberWithCommas: (n: number) => String(n),
}));

vi.mock('@/utils/imageUtils', () => ({
  extractFirstValidImageUrl: () => 'image.jpg',
}));

vi.mock('@/utils/cartUtils', () => ({
  calculateCartTotals: vi.fn(() => ({
    subtotal: 20000,
    discountTotal: 0,
    taxTotal: 0,
    total: 20000,
  })),
}));

// Mock step sub-components for isolation
vi.mock('../components/steps/AuthStep', () => ({
  default: ({ onComplete }: any) => (
    <div data-testid="auth-step">
      <button data-testid="auth-complete" onClick={onComplete}>Complete Auth</button>
    </div>
  ),
}));

vi.mock('../components/steps/BuyerDataStep', () => ({
  default: ({ onNext, onBack, showBack }: any) => (
    <div data-testid="buyer-data-step">
      {showBack && <button data-testid="buyer-back" onClick={onBack}>Back</button>}
      <button data-testid="buyer-next" onClick={onNext}>Next from Buyer</button>
    </div>
  ),
}));

vi.mock('../components/steps/DeliveryStep', () => ({
  default: ({ onNext, onBack, onSelectZone }: any) => (
    <div data-testid="delivery-step">
      <button data-testid="delivery-back" onClick={onBack}>Back</button>
      <button data-testid="delivery-next" onClick={() => { onSelectZone({ zone: 'Z1', price: 5000 }); onNext(); }}>
        Next from Delivery
      </button>
    </div>
  ),
}));

vi.mock('../components/steps/ShippingStep', () => ({
  default: ({ onNext, onBack }: any) => (
    <div data-testid="shipping-step">
      <button data-testid="shipping-back" onClick={onBack}>Back</button>
      <button data-testid="shipping-next" onClick={onNext}>Next from Shipping</button>
    </div>
  ),
}));

vi.mock('../components/steps/CustomQuestionsStep', () => ({
  default: ({ onNext, onBack }: any) => (
    <div data-testid="questions-step">
      <button data-testid="questions-back" onClick={onBack}>Back</button>
      <button data-testid="questions-next" onClick={onNext}>Next from Questions</button>
    </div>
  ),
}));

vi.mock('../components/StepIndicator', () => ({
  default: ({ steps, currentIndex }: any) => (
    <div data-testid="step-indicator">
      {steps.map((s: any, i: number) => (
        <span key={s.id} data-testid={`step-${s.id}`} data-active={i === currentIndex}>
          {s.title}
        </span>
      ))}
    </div>
  ),
}));

// Mock react-bootstrap
vi.mock('react-bootstrap', () => {
  const Wrap = ({ children }: any) => <div>{children}</div>;
  const Alert = ({ children, variant }: any) => <div data-variant={variant}>{children}</div>;
  Alert.Heading = Wrap;
  const Button = ({ children, onClick, disabled, variant, className, type }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} className={className} type={type}>
      {children}
    </button>
  );
  const Image = (props: any) => <img alt="" {...props} />;
  return {
    Container: Wrap,
    Row: Wrap,
    Col: Wrap,
    Alert,
    Button,
    Spinner: ({ size }: any) => <span data-testid="spinner">Loading</span>,
    Form: Object.assign(Wrap, {
      Group: Wrap,
      Control: (props: any) => <input {...props} />,
      Label: Wrap,
      Check: (props: any) => <input type="checkbox" {...props} />,
    }),
    Image,
  };
});

// Redux mock store
const mockStore = configureStore([]);

const createOrderWhatsAppMock = createOrderAndSendWhatsApp as unknown as ReturnType<typeof vi.fn>;
const createOrderWompiMock = createOrderAndPayWithWompi as unknown as ReturnType<typeof vi.fn>;
const hasQuestionsMock = hasCustomQuestions as unknown as ReturnType<typeof vi.fn>;

// ── Test suite ──

describe('CheckoutWizard – Edge Cases', () => {
  let store: any;

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultUser = { user: { name: 'John' }, profile: { additionalPhone: '300111' } };

  const makeState = (overrides: any = {}) => {
    // Build activations only with keys explicitly provided (or defaults for required ones)
    // This is critical: `requireBuyerData ?? requireUserData ?? false` in the wizard
    // uses nullish coalescing, so `false` is NOT the same as `undefined`.
    const activations: Record<string, any> = {
      requireLogin: overrides.requireLogin ?? false,
      deliveryEnabled: overrides.deliveryEnabled ?? false,
      requireShippingData: overrides.requireShippingData ?? false,
    };

    // Only set requireBuyerData/requireUserData if explicitly provided
    if ('requireBuyerData' in overrides) activations.requireBuyerData = overrides.requireBuyerData;
    if ('requireUserData' in overrides) activations.requireUserData = overrides.requireUserData;

    return {
      // Use `'userData' in overrides` to distinguish null from not-provided
      // because `null ?? default` returns default (null IS nullish)
      auth: { userData: 'userData' in overrides ? overrides.userData : defaultUser },
      cart: {
        carts: {
          'test-store': {
            items: overrides.items ?? [
              { product: { id: 1, title: 'Product A', basePrice: 10000, totalPrice: 10000, images: [] }, quantity: 2 },
            ],
          },
        },
        selectedDeliveryZone: null,
      },
      ui: {
        store: {
          id: 'test-store',
          configuration: {
            enablePaymentLinks: overrides.enablePaymentLinks ?? false,
            activations,
            customQuestions: overrides.customQuestions ?? [],
          },
          deliveryZones: overrides.deliveryZones ?? [],
        },
      },
    };
  };

  const renderWizard = (overrides: any = {}) => {
    hasQuestionsMock.mockReturnValue(overrides.hasQuestions ?? false);
    store = mockStore(makeState(overrides));
    store.dispatch = vi.fn();
    return render(
      <Provider store={store}>
        <CheckoutWizard />
      </Provider>,
    );
  };

  // ━━━ Edge Case 1: Empty cart ━━━

  it('shows empty cart warning when no items', () => {
    renderWizard({ items: [] });
    expect(screen.getByText('No hay productos en el carrito')).toBeTruthy();
    expect(screen.getByText(/Regresa a la tienda/)).toBeTruthy();
  });

  // ━━━ Edge Case 2: Minimal store – no steps, just confirm ━━━

  it('renders only confirm step for store with no activations', () => {
    renderWizard();
    // Should directly show the confirm step (title + button both contain 'Confirmar Pedido')
    expect(screen.getByRole('button', { name: /Confirmar Pedido/ })).toBeTruthy();
    // No other steps visible
    expect(screen.queryByTestId('auth-step')).toBeNull();
    expect(screen.queryByTestId('buyer-data-step')).toBeNull();
    expect(screen.queryByTestId('delivery-step')).toBeNull();
    expect(screen.queryByTestId('shipping-step')).toBeNull();
    expect(screen.queryByTestId('questions-step')).toBeNull();
  });

  // ━━━ Edge Case 3: WhatsApp-only (enablePaymentLinks=false) ━━━

  it('shows only WhatsApp button when enablePaymentLinks is false', () => {
    renderWizard({ enablePaymentLinks: false });
    expect(screen.getByRole('button', { name: /Confirmar Pedido/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Pagar en Línea/ })).toBeNull();
  });

  // ━━━ Edge Case 4: Both buttons when enablePaymentLinks=true ━━━

  it('shows buyer-data step first when enablePaymentLinks is true', () => {
    renderWizard({ enablePaymentLinks: true });
    // effectiveRequireBuyerData = true → buyer-data step shows first
    expect(screen.getByTestId('buyer-data-step')).toBeTruthy();
  });

  it('shows both WhatsApp and Wompi buttons on confirm step with enablePaymentLinks', async () => {
    renderWizard({ enablePaymentLinks: true });
    // Navigate past buyer-data to confirm
    fireEvent.click(screen.getByTestId('buyer-next'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirmar Pedido/ })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Pagar en Línea/ })).toBeTruthy();
    });
  });

  // ━━━ Edge Case 5: enablePaymentLinks undefined (legacy config) ━━━

  it('treats undefined enablePaymentLinks as false (WhatsApp only)', () => {
    renderWizard({ enablePaymentLinks: undefined });
    expect(screen.getByRole('button', { name: /Confirmar Pedido/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Pagar en Línea/ })).toBeNull();
  });

  // ━━━ Edge Case 6: All steps enabled ━━━

  it('builds all steps when all activations are on', () => {
    renderWizard({
      requireLogin: true,
      requireBuyerData: true,
      deliveryEnabled: true,
      requireShippingData: true,
      hasQuestions: true,
      userData: null, // Not logged in → auth step appears
    });

    // Should start at auth step
    expect(screen.getByTestId('auth-step')).toBeTruthy();
    // Step indicator should show all steps
    expect(screen.getByTestId('step-auth')).toBeTruthy();
    expect(screen.getByTestId('step-buyer-data')).toBeTruthy();
    expect(screen.getByTestId('step-delivery')).toBeTruthy();
    expect(screen.getByTestId('step-shipping')).toBeTruthy();
    expect(screen.getByTestId('step-questions')).toBeTruthy();
    expect(screen.getByTestId('step-confirm')).toBeTruthy();
  });

  // ━━━ Edge Case 7: Auth step skipped when user is logged in ━━━

  it('skips auth step when user is already logged in', () => {
    renderWizard({
      requireLogin: true,
      userData: { user: { name: 'John' }, profile: {} }, // Logged in
    });

    // Auth step should not be present
    expect(screen.queryByTestId('auth-step')).toBeNull();
    expect(screen.queryByTestId('step-auth')).toBeNull();
  });

  // ━━━ Edge Case 8: Auth step shown when user is NOT logged in ━━━

  it('shows auth step when user is not logged in and requireLogin is on', () => {
    renderWizard({
      requireLogin: true,
      userData: null,
    });

    expect(screen.getByTestId('auth-step')).toBeTruthy();
  });

  // ━━━ Edge Case 9: Navigation forward/backward ━━━

  it('navigates forward through steps', async () => {
    renderWizard({
      requireBuyerData: true,
      deliveryEnabled: true,
      deliveryZones: [{ id: 1, zone: 'Z1', price: 5000 }],
    });

    // Start at buyer-data
    expect(screen.getByTestId('buyer-data-step')).toBeTruthy();

    // Go to delivery
    fireEvent.click(screen.getByTestId('buyer-next'));
    await waitFor(() => expect(screen.getByTestId('delivery-step')).toBeTruthy());

    // Go to confirm
    fireEvent.click(screen.getByTestId('delivery-next'));
    await waitFor(() => expect(screen.getByRole('button', { name: /Confirmar Pedido/ })).toBeTruthy());
  });

  it('navigates backward through steps', async () => {
    renderWizard({
      requireBuyerData: true,
      deliveryEnabled: true,
    });

    // Start at buyer-data → advance to delivery
    fireEvent.click(screen.getByTestId('buyer-next'));
    await waitFor(() => expect(screen.getByTestId('delivery-step')).toBeTruthy());

    // Go back to buyer-data
    fireEvent.click(screen.getByTestId('delivery-back'));
    await waitFor(() => expect(screen.getByTestId('buyer-data-step')).toBeTruthy());
  });

  // ━━━ Edge Case 10: Custom questions only ━━━

  it('shows only questions + confirm when store only has custom questions', () => {
    renderWizard({ hasQuestions: true });
    expect(screen.getByTestId('questions-step')).toBeTruthy();
    expect(screen.getByTestId('step-questions')).toBeTruthy();
    expect(screen.getByTestId('step-confirm')).toBeTruthy();
  });

  // ━━━ Edge Case 11: Successful WhatsApp submit ━━━

  it('dispatches success notification on WhatsApp order', async () => {
    createOrderWhatsAppMock.mockResolvedValueOnce({
      success: true,
      message: 'Orden enviada',
      needsRedirect: false,
    });

    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }));

    await waitFor(() => {
      expect(createOrderWhatsAppMock).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ message: 'Orden enviada', color: 'success' }) }),
      );
    });
  });

  // ━━━ Edge Case 12: WhatsApp redirect after success ━━━

  it('redirects after successful WhatsApp order with needsRedirect', async () => {
    createOrderWhatsAppMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      needsRedirect: true,
      redirectTo: '/test-store/order/123',
    });

    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/test-store/order/123');
    });
  });

  // ━━━ Edge Case 13: WhatsApp failure ━━━

  it('shows danger notification on failed WhatsApp order', async () => {
    createOrderWhatsAppMock.mockResolvedValueOnce({
      success: false,
      message: 'Error al crear la orden',
    });

    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ message: 'Error al crear la orden', color: 'danger' }) }),
      );
    });
  });

  // ━━━ Edge Case 14: Network error ━━━

  it('handles network error during submit', async () => {
    createOrderWhatsAppMock.mockRejectedValueOnce(new Error('Network failed'));

    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            message: 'Error al procesar el pedido. Intenta nuevamente.',
            color: 'danger',
          }),
        }),
      );
    });
  });

  // ━━━ Edge Case 15: Wompi submit ━━━

  it('redirects to Wompi payment link on successful Wompi submit', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true });

    createOrderWompiMock.mockResolvedValueOnce({
      success: true,
      message: 'Link generado',
      paymentLink: 'http://wompi.co/pay/123',
    });

    renderWizard({ enablePaymentLinks: true });

    // Navigate through buyer-data to confirm
    fireEvent.click(screen.getByTestId('buyer-next'));
    await waitFor(() => expect(screen.getByText(/Pagar en Línea/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Pagar en Línea/));

    await waitFor(() => {
      expect(createOrderWompiMock).toHaveBeenCalled();
      expect(window.location.href).toBe('http://wompi.co/pay/123');
    });

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true });
  });

  // ━━━ Edge Case 16: Wompi failure ━━━

  it('shows warning on Wompi payment failure', async () => {
    createOrderWompiMock.mockResolvedValueOnce({
      success: false,
      message: 'No se pudo generar el enlace de pago',
    });

    renderWizard({ enablePaymentLinks: true });
    fireEvent.click(screen.getByTestId('buyer-next'));
    await waitFor(() => expect(screen.getByText(/Pagar en Línea/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Pagar en Línea/));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ message: 'No se pudo generar el enlace de pago', color: 'warning' }),
        }),
      );
    });
  });

  // ━━━ Edge Case 17: Double-submit prevention ━━━

  it('disables buttons while submitting (isSubmitting state)', async () => {
    let resolvePromise: (value: any) => void;
    createOrderWhatsAppMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pedido/ }));

    // While submitting, button should show "Procesando..."
    await waitFor(() => {
      expect(screen.getByText(/Procesando/)).toBeTruthy();
    });

    // Resolve the promise
    resolvePromise!({ success: true, message: 'ok', needsRedirect: false });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirmar Pedido/ })).toBeTruthy();
    });
  });

  // ━━━ Edge Case 18: requireUserData (legacy) fallback ━━━

  it('respects legacy requireUserData when requireBuyerData is not set', () => {
    // DO NOT pass requireBuyerData so it stays undefined in activations
    // This lets `requireBuyerData ?? requireUserData ?? false` fall through to requireUserData
    renderWizard({
      requireUserData: true,
    });

    // Should show buyer-data step via legacy requireUserData
    expect(screen.getByTestId('buyer-data-step')).toBeTruthy();
  });

  // ━━━ Edge Case 19: showBack=false on first step ━━━

  it('does not show back button on the first step (buyer-data)', () => {
    renderWizard({ requireBuyerData: true });
    // First step is buyer-data; BuyerDataStep mock has showBack-controlled button
    expect(screen.queryByTestId('buyer-back')).toBeNull();
  });

  // ━━━ Edge Case 20: Full flow (all steps) navigation ━━━

  it('navigates through all steps from auth to confirm', async () => {
    renderWizard({
      requireLogin: true,
      requireBuyerData: true,
      deliveryEnabled: true,
      requireShippingData: true,
      hasQuestions: true,
      userData: null,
    });

    // 1. Auth
    expect(screen.getByTestId('auth-step')).toBeTruthy();
    fireEvent.click(screen.getByTestId('auth-complete'));

    // 2. Buyer data
    await waitFor(() => expect(screen.getByTestId('buyer-data-step')).toBeTruthy());
    fireEvent.click(screen.getByTestId('buyer-next'));

    // 3. Delivery
    await waitFor(() => expect(screen.getByTestId('delivery-step')).toBeTruthy());
    fireEvent.click(screen.getByTestId('delivery-next'));

    // 4. Shipping
    await waitFor(() => expect(screen.getByTestId('shipping-step')).toBeTruthy());
    fireEvent.click(screen.getByTestId('shipping-next'));

    // 5. Questions
    await waitFor(() => expect(screen.getByTestId('questions-step')).toBeTruthy());
    fireEvent.click(screen.getByTestId('questions-next'));

    // 6. Confirm
    await waitFor(() => expect(screen.getByRole('button', { name: /Confirmar Pedido/ })).toBeTruthy());
  });

  // ━━━ Edge Case 21: Confirm step shows cart totals ━━━

  it('displays product info and totals on confirm step', () => {
    renderWizard();
    // Confirm step renders directly (no activations)
    expect(screen.getByText('Product A')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  // ━━━ Edge Case 22: Step indicator reflects current step ━━━

  it('step indicator marks current step as active', async () => {
    renderWizard({ requireBuyerData: true, hasQuestions: true });

    // First step (buyer-data) should be active
    const buyerStep = screen.getByTestId('step-buyer-data');
    expect(buyerStep.getAttribute('data-active')).toBe('true');

    // Advance to questions
    fireEvent.click(screen.getByTestId('buyer-next'));
    await waitFor(() => {
      const qStep = screen.getByTestId('step-questions');
      expect(qStep.getAttribute('data-active')).toBe('true');
    });
  });
});
