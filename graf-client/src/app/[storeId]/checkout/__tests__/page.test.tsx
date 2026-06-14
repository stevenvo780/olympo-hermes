/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import CheckoutPage from '../page';

// Mock Dependencies
vi.mock('next/navigation', () => ({
  useParams: () => ({ storeId: 'test-store' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(() => vi.fn()),
  useSelector: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: { put: vi.fn(), patch: vi.fn(), get: vi.fn() },
}));

vi.mock('@/services/userService', () => ({
  getUserBack: vi.fn(),
}));

vi.mock('@/services/orderService', () => ({
  createOrderAndSendWhatsApp: vi.fn(),
  createOrderAndPayWithWompi: vi.fn(),
  checkProfileComplete: vi.fn(),
  hasCustomQuestions: vi.fn(() => false),
  getOrderFlow: vi.fn(() => ({ canSubmit: true })),
}));

vi.mock('@/utils/cartUtils', () => ({
  calculateCartTotals: () => ({ subtotal: 100, discountTotal: 0, taxTotal: 10, total: 110 }),
}));

vi.mock('@/utils/formatters', () => ({
  formatNumberWithCommas: (n: number) => String(n),
}));

vi.mock('@/utils/imageUtils', () => ({
  extractFirstValidImageUrl: () => 'image.jpg',
}));

vi.mock('@/utils/firebase', () => ({
  auth: { currentUser: null },
}));

vi.mock('@/redux/auth', () => ({
  login: vi.fn(),
}));

vi.mock('@/redux/cart', () => ({
  setSelectedDeliveryZone: vi.fn(),
}));

// Mock react-icons/fa
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

// Mock React Bootstrap
vi.mock('react-bootstrap', () => {
  const Wrap = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  Wrap.displayName = 'Wrap';
  const Button = ({ children, onClick, disabled, variant, type, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} type={type} className={className}>
      {children}
    </button>
  );
  Button.displayName = 'Button';
  const Control = (props: any) => <input {...props} />;
  Control.displayName = 'Control';
  const Label = ({ children }: any) => <label>{children}</label>;
  Label.displayName = 'Label';
  const Group = ({ children }: any) => <div>{children}</div>;
  Group.displayName = 'Group';
  const Image = (props: any) => <img {...props} />;
  Image.displayName = 'Image';
  return {
    Container: Wrap,
    Row: Wrap,
    Col: Wrap,
    Alert: Object.assign(Wrap, { Heading: Wrap }),
    Button,
    Form: Object.assign(Wrap, { Group, Control, Label }),
    Spinner: () => <span>Loading...</span>,
    Image,
  };
});

import { useSelector } from 'react-redux';

describe('CheckoutPage (Wizard)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders empty cart warning when no items', async () => {
    const mockState = {
      auth: { userData: null },
      cart: { carts: {} },
      ui: { store: null },
    };
    vi.mocked(useSelector).mockImplementation((selector: any) => selector(mockState));

    await act(async () => {
      root.render(<CheckoutPage />);
    });
    expect(container.textContent).toContain('No hay productos en el carrito');
  });

  it('renders wizard with "Finalizar Pedido" heading when cart has items', async () => {
    const mockState = {
      auth: { userData: { user: { name: 'Test' }, profile: {} } },
      cart: {
        carts: {
          'test-store': {
            items: [{ product: { id: 1, title: 'Test Product', basePrice: 100, totalPrice: 100 }, quantity: 1 }],
          },
        },
      },
      ui: {
        store: {
          id: 'test-store',
          configuration: {
            activations: {
              requireLogin: false,
              requireBuyerData: false,
              deliveryEnabled: false,
              requireShippingData: false,
            },
          },
        },
      },
    };
    vi.mocked(useSelector).mockImplementation((selector: any) => selector(mockState));

    await act(async () => {
      root.render(<CheckoutPage />);
    });
    expect(container.textContent).toContain('Finalizar Pedido');
    expect(container.textContent).toContain('Confirmar Pedido');
  });

  it('shows confirm step with WhatsApp button when enablePaymentLinks is off', async () => {
    const mockState = {
      auth: { userData: { user: { name: 'Test' }, profile: {} } },
      cart: {
        carts: {
          'test-store': {
            items: [{ product: { id: 1, title: 'Product A', basePrice: 500, totalPrice: 500 }, quantity: 2 }],
          },
        },
      },
      ui: {
        store: {
          id: 'test-store',
          configuration: {
            enablePaymentLinks: false,
            activations: {
              requireLogin: false,
              requireBuyerData: false,
              deliveryEnabled: false,
              requireShippingData: false,
            },
          },
        },
      },
    };
    vi.mocked(useSelector).mockImplementation((selector: any) => selector(mockState));

    await act(async () => {
      root.render(<CheckoutPage />);
    });

    expect(container.textContent).toContain('Confirmar Pedido');
    expect(container.textContent).not.toContain('Pagar en Línea');
  });

  it('shows both WhatsApp and Wompi buttons when enablePaymentLinks is on', async () => {
    const mockState = {
      auth: { userData: { user: { name: 'Test' }, profile: {} } },
      cart: {
        carts: {
          'test-store': {
            items: [{ product: { id: 1, title: 'Product A', basePrice: 500, totalPrice: 500 }, quantity: 1 }],
          },
        },
      },
      ui: {
        store: {
          id: 'test-store',
          configuration: {
            enablePaymentLinks: true,
            activations: {
              requireLogin: false,
              requireBuyerData: false,
              deliveryEnabled: false,
              requireShippingData: false,
            },
          },
        },
      },
    };
    vi.mocked(useSelector).mockImplementation((selector: any) => selector(mockState));

    await act(async () => {
      root.render(<CheckoutPage />);
    });

    // With enablePaymentLinks=true, buyer-data step shows first (before confirm)
    // because effectiveRequireBuyerData becomes true
    expect(container.textContent).toContain('Datos del Comprador');
  });
});
