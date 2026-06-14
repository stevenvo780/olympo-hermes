/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FloatingCart from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import * as orderService from '@/services/orderService';
import * as cartUtils from '@/utils/cartUtils';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('react-responsive', () => ({
  useMediaQuery: () => false,
}));

vi.mock('react-icons/fa', () => ({
  FaWhatsapp: () => <span data-testid="icon-whatsapp">Whatsapp</span>,
  FaTrashAlt: () => <span data-testid="icon-trash">Trash</span>,
  FaCheckCircle: () => <span data-testid="icon-check">Check</span>,
  FaMoneyBillWave: () => <span data-testid="icon-money">Money</span>,
  FaCreditCard: () => <span data-testid="icon-card">Card</span>,
}));

vi.mock('@/services/orderService', () => ({
  createOrderAndPayWithWompi: vi.fn(),
  createOrderAndSendWhatsApp: vi.fn(),
  hasCustomQuestions: vi.fn(),
  getOrderFlow: vi.fn(),
}));

vi.mock('@/utils/cartUtils', () => ({
  calculateCartTotals: vi.fn(),
}));

vi.mock('@/utils/formatters', () => ({
  formatNumberWithCommas: (n: number) => String(n),
}));

// Mock Actions
const mockActions = vi.hoisted(() => ({
  addNotification: vi.fn((payload) => payload),
  closeCart: { type: 'closeCart' },
  removeItem: { type: 'removeItem' },
  incrementQuantity: { type: 'incrementQuantity' },
  decrementQuantity: { type: 'decrementQuantity' },
  clearCart: { type: 'clearCart' },
  setSelectedDeliveryZone: { type: 'setSelectedDeliveryZone' },
}));

vi.mock('@/redux/ui', () => ({
  addNotification: mockActions.addNotification,
  closeCart: () => mockActions.closeCart,
}));

vi.mock('@/redux/cart', () => ({
  removeItem: () => mockActions.removeItem,
  incrementQuantity: () => mockActions.incrementQuantity,
  decrementQuantity: () => mockActions.decrementQuantity,
  clearCart: () => mockActions.clearCart,
  setSelectedDeliveryZone: () => mockActions.setSelectedDeliveryZone,
}));

// Mock Subcomponents
vi.mock('../CartItem', () => ({
  default: ({ item, handleRemoveItem, handleIncrement, handleDecrement }: any) => (
    <div data-testid="cart-item">
      <span>{item.product.title}</span>
      <button onClick={() => handleIncrement(item.product.id)}>+</button>
      <button onClick={() => handleDecrement(item.product.id)}>-</button>
      <button onClick={() => handleRemoveItem(item.product.id)}>Remove</button>
    </div>
  ),
}));

vi.mock('../../../CustomQuestions', () => ({
  default: ({ show, onSubmit }: any) =>
    show ? (
      <div data-testid="custom-questions">
        <button onClick={() => onSubmit([{ question: 'q1', answer: 'a1' }])}>Submit Questions</button>
      </div>
    ) : null,
}));

// Mock React Bootstrap
vi.mock('react-bootstrap', () => {
  const MockLayout = ({ children }: any) => <div>{children}</div>;
  MockLayout.displayName = 'MockLayout';

  const Offcanvas = ({ show, children, onHide }: any) =>
    show ? (
      <div data-testid="offcanvas">
        <button onClick={onHide} data-testid="close-cart">
          Close
        </button>
        {children}
      </div>
    ) : null;
  Offcanvas.Header = MockLayout;
  Offcanvas.Title = MockLayout;
  Offcanvas.Body = MockLayout;
  Offcanvas.displayName = 'Offcanvas';

  const Modal = ({ show, children, onHide }: any) =>
    show ? (
      <div data-testid="modal">
        <button onClick={onHide} data-testid="close-modal">
          Close
        </button>
        {children}
      </div>
    ) : null;
  Modal.Header = MockLayout;
  Modal.Title = MockLayout;
  Modal.Body = MockLayout;
  Modal.Footer = MockLayout;
  Modal.displayName = 'Modal';

  const Button = ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  );
  Button.displayName = 'Button';

  return {
    Offcanvas,
    Modal,
    Button,
    ListGroup: MockLayout,
    ListGroupItem: MockLayout,
    Form: { Control: () => <input /> },
    Spinner: () => <span>Loading...</span>,
  };
});

describe('FloatingCart', () => {
  const dispatch = vi.fn();
  const push = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(dispatch);
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ storeId: 'test-store' });
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ push });

    (cartUtils.calculateCartTotals as any).mockReturnValue({
      subtotal: 100,
      discountTotal: 0,
      taxTotal: 0,
      total: 100,
    });

    (orderService.getOrderFlow as any).mockReturnValue({ canSubmit: true });
    (orderService.hasCustomQuestions as any).mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const renderComponent = (stateOverride: any = {}) => {
    const defaultState = {
      ui: {
        cartOpen: true,
        store: {
          configuration: {
            activations: {
              deliveryEnabled: false,
              requireLogin: false,
              requireUserData: false,
              requireBuyerData: false,
              requireShippingData: false,
            },
          },
        },
      },
      cart: {
        carts: {
          'test-store': {
            items: [{ product: { id: 1, title: 'Item 1', priceWithTax: 100 }, quantity: 1, finalPrice: 100 }],
          },
        },
        selectedDeliveryZone: null,
      },
      orders: { loading: false },
      auth: { userData: { user: { name: 'Test User' }, profile: { additionalPhone: '123' } } },
    };

    const state = { ...defaultState, ...stateOverride };

    if (stateOverride.cart?.carts?.['test-store']?.items === undefined && stateOverride.cart) {
      state.cart.carts['test-store'].items = defaultState.cart.carts['test-store'].items;
    }

    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => selector(state));

    return render(<FloatingCart isProfileComplete={true} />);
  };

  // ── Basic rendering ──

  it('renders correctly when open with cart items', () => {
    renderComponent();
    expect(screen.getByTestId('offcanvas')).toBeTruthy();
    expect(screen.getByText('Item 1')).toBeTruthy();
    expect(screen.getByText('Total:')).toBeTruthy();
  });

  it('does not render when cart is closed', () => {
    renderComponent({ ui: { cartOpen: false, store: { configuration: { activations: {} } } } });
    expect(screen.queryByTestId('offcanvas')).toBeNull();
  });

  it('shows empty cart message when no items', () => {
    renderComponent({ cart: { carts: { 'test-store': { items: [] } } } });
    expect(screen.getByText('No hay productos en el carrito')).toBeTruthy();
  });

  // ── Cart actions ──

  it('closes cart when close button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('close-cart'));
    expect(dispatch).toHaveBeenCalledWith(mockActions.closeCart);
  });

  it('handles remove item interaction', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Remove'));
    expect(dispatch).toHaveBeenCalled();
  });

  it('handles increment/decrement interactions', () => {
    renderComponent();
    fireEvent.click(screen.getByText('+'));
    expect(dispatch).toHaveBeenCalled();
    fireEvent.click(screen.getByText('-'));
    expect(dispatch).toHaveBeenCalled();
  });

  // ── Clear cart flow ──

  it('opens confirmation modal when "Vaciar Carrito" is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Vaciar Carrito/));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeTruthy());
    expect(screen.getByText('¿Estás seguro que deseas eliminar todos los productos del carrito?')).toBeTruthy();
  });

  it('clears cart when confirmed in modal', async () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Vaciar Carrito/));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeTruthy());

    const modal = screen.getByTestId('modal');
    const confirmButton = within(modal).getByRole('button', { name: /Vaciar carrito/i });
    fireEvent.click(confirmButton);

    expect(dispatch).toHaveBeenCalledWith(mockActions.clearCart);
  });

  // ── "Confirmar Pedido" button ──

  it('renders "Confirmar Pedido" button (no old Wompi/WhatsApp buttons)', () => {
    renderComponent();
    expect(screen.getByText(/Confirmar Pedido/)).toBeTruthy();
    expect(screen.queryByText('Enviar por WhatsApp')).toBeNull();
    expect(screen.queryByText('Pagar con Wompi')).toBeNull();
  });

  it('disables Confirmar Pedido button when cart is empty', () => {
    renderComponent({ cart: { carts: { 'test-store': { items: [] } } } });
    const btn = screen.getByText(/Confirmar Pedido/)?.closest('button');
    expect(btn?.disabled).toBe(true);
  });

  // ── Simple store: Direct WhatsApp (no checkout steps) ──

  it('sends direct WhatsApp order for stores with NO checkout steps', async () => {
    (orderService.createOrderAndSendWhatsApp as any).mockResolvedValue({
      success: true,
      message: 'Order created',
      orderId: '123',
    });

    renderComponent();
    fireEvent.click(screen.getByText(/Confirmar Pedido/));

    await waitFor(() => {
      expect(orderService.createOrderAndSendWhatsApp).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith({ message: 'Order created', color: 'success' });
    });
  });

  it('handles WhatsApp order failure', async () => {
    (orderService.createOrderAndSendWhatsApp as any).mockResolvedValue({
      success: false,
      message: 'Something went wrong',
    });

    renderComponent();
    fireEvent.click(screen.getByText(/Confirmar Pedido/));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ message: 'Something went wrong', color: 'warning' });
    });
  });

  it('handles WhatsApp order exception', async () => {
    (orderService.createOrderAndSendWhatsApp as any).mockRejectedValue(new Error('network error'));

    renderComponent();
    fireEvent.click(screen.getByText(/Confirmar Pedido/));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ message: 'Error al procesar el pedido', color: 'danger' });
    });
  });

  // ── Complex store: Redirects to checkout wizard ──

  it('redirects to checkout wizard when store has requireLogin', () => {
    renderComponent({
      ui: {
        cartOpen: true,
        store: {
          configuration: {
            activations: { requireLogin: true, deliveryEnabled: false, requireBuyerData: false, requireShippingData: false },
          },
        },
      },
    });

    fireEvent.click(screen.getByText(/Confirmar Pedido/));
    expect(push).toHaveBeenCalledWith('/test-store/checkout');
  });

  it('redirects to checkout wizard when store has delivery enabled', () => {
    renderComponent({
      ui: {
        cartOpen: true,
        store: {
          configuration: {
            activations: { requireLogin: false, deliveryEnabled: true, requireBuyerData: false, requireShippingData: false },
          },
        },
      },
    });

    fireEvent.click(screen.getByText(/Confirmar Pedido/));
    expect(push).toHaveBeenCalledWith('/test-store/checkout');
  });

  it('redirects to checkout wizard when store requires buyer data', () => {
    renderComponent({
      ui: {
        cartOpen: true,
        store: {
          configuration: {
            activations: { requireLogin: false, deliveryEnabled: false, requireBuyerData: true, requireShippingData: false },
          },
        },
      },
    });

    fireEvent.click(screen.getByText(/Confirmar Pedido/));
    expect(push).toHaveBeenCalledWith('/test-store/checkout');
  });

  it('redirects to checkout wizard when store has custom questions', () => {
    (orderService.hasCustomQuestions as any).mockReturnValue(true);

    renderComponent({
      ui: {
        cartOpen: true,
        store: {
          configuration: {
            customQuestions: [{ question: 'Q1' }],
            activations: { requireLogin: false, deliveryEnabled: false, requireBuyerData: false, requireShippingData: false },
          },
        },
      },
    });

    fireEvent.click(screen.getByText(/Confirmar Pedido/));
    expect(push).toHaveBeenCalledWith('/test-store/checkout');
  });

  // ── Totals display ──

  it('displays subtotal, discount, and tax when present', () => {
    (cartUtils.calculateCartTotals as any).mockReturnValue({
      subtotal: 200,
      discountTotal: 50,
      taxTotal: 19,
      total: 169,
    });

    renderComponent();
    expect(screen.getByText('Subtotal:')).toBeTruthy();
    expect(screen.getByText('$200')).toBeTruthy();
    expect(screen.getByText('Descuentos:')).toBeTruthy();
    expect(screen.getByText('-$50')).toBeTruthy();
    expect(screen.getByText('Impuestos:')).toBeTruthy();
    expect(screen.getByText('+$19')).toBeTruthy();
    expect(screen.getByText('$169')).toBeTruthy();
  });

  it('hides subtotal, discount, and tax when zero', () => {
    (cartUtils.calculateCartTotals as any).mockReturnValue({
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      total: 0,
    });

    renderComponent();
    expect(screen.queryByText('Subtotal:')).toBeNull();
    expect(screen.queryByText('Descuentos:')).toBeNull();
    expect(screen.queryByText('Impuestos:')).toBeNull();
  });

  // ── No Wompi button in cart ──

  it('does NOT render Wompi button even when enablePaymentLinks is true', () => {
    renderComponent({
      ui: {
        cartOpen: true,
        store: {
          configuration: {
            enablePaymentLinks: true,
            activations: { deliveryEnabled: false },
          },
        },
      },
    });

    expect(screen.queryByText('Pagar con Wompi')).toBeNull();
    expect(screen.queryByText('Pagar en Línea')).toBeNull();
  });
});
