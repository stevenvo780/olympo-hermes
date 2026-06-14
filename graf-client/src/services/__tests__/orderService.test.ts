// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as orderService from '../orderService';
import type { OrderMessageParams } from '../orderService';
import api from '@/utils/axios';
import reduxStore from '@/redux/store';
import { clearCart } from '@/redux/cart';
import { AxiosError } from 'axios';

const {
  generateOrderWhatsAppMessage,
  createOrderAndSendWhatsApp,
  validateOrderRequirements,
  createOrderAndPayWithWompi,
  checkProfileComplete,
  getRedirectionInfo,
  getOrderFlow,
  sendWhatsAppMessage,
  hasCustomQuestions,
} = orderService;

vi.mock('@/utils/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/redux/store', () => ({
  default: {
    getState: vi.fn(),
    dispatch: vi.fn(),
  },
}));

vi.mock('@/redux/cart', () => ({
  clearCart: vi.fn((storeId) => ({ type: 'cart/clear', payload: storeId })),
}));

// Mock window.location
const mockLocation = { href: '', origin: 'http://localhost:3000' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('orderService', () => {
  const mockProduct = {
    id: 1,
    title: 'Product 1',
    basePrice: 100,
    store: { id: 'store1' },
  };

  const mockCartItem = {
    product: mockProduct,
    quantity: 2,
    finalPrice: 200,
  };

  const mockStore = {
    id: 'store1',
    name: 'Test Store',
    phonePrefix: '57',
    phoneNumber: '3001234567',
    configuration: {
      activations: {
        requireLogin: false,
        requireUserData: false,
        deliveryEnabled: true,
      },
      customMessage: 'Thanks!',
    },
  };

  const mockState = {
    auth: { userData: { user: { id: 'u1', email: 'test@test.com', name: 'User' }, profile: {} } },
    cart: {
      carts: { store1: { items: [mockCartItem] } },
      selectedDeliveryZone: { id: 1, zone: 'Zone 1', price: 5000 },
    },
    ui: {
      store: mockStore,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (reduxStore.getState as any).mockReturnValue(mockState);
    mockLocation.href = '';
  });

  describe('generateOrderWhatsAppMessage', () => {
    const defaultParams: OrderMessageParams = {
      comercio: mockStore as any,
      cartItems: [mockCartItem as any],
      total: 10500,
      subtotal: 10000,
      userData: mockState.auth.userData as any,
      deliveryZone: mockState.cart.selectedDeliveryZone as any,
    };

    it('generates message correctly with delivery', () => {
      const params = { ...defaultParams, customMessage: 'Thanks!' };
      const msg = generateOrderWhatsAppMessage(params);
      expect(msg).toContain('*Tienda:* Test Store');
      expect(msg).toContain('2 *x* *Product 1* = *$200*');
      expect(msg).toContain('*Subtotal:* $10,000');
      expect(msg).toContain('*Costo de Envío:* $5,000');
      expect(msg).toContain('*Total:* $10,500');
      expect(msg).toContain('Thanks!');
    });

    it('throws error if empty cart', () => {
      expect(() => generateOrderWhatsAppMessage({ ...defaultParams, cartItems: [] }))
        .toThrow('No hay productos en el carrito');
    });

    it('generates message with orderId', () => {
      const msg = generateOrderWhatsAppMessage({ ...defaultParams, orderId: 123 });
      expect(msg).toContain('*Pedido #123*');
    });

    it('generates message with discounts and taxes', () => {
      const msg = generateOrderWhatsAppMessage({ ...defaultParams, discountTotal: 500, taxTotal: 200 });
      expect(msg).toContain('*Descuentos:* -$500');
      expect(msg).toContain('*Impuestos:* +$200');
    });

    it('generates message with free delivery', () => {
      const msg = generateOrderWhatsAppMessage({ ...defaultParams, deliveryZone: { id: 1, zone: 'Free Zone', price: 0 } as any });
      expect(msg).toContain('*Envío GRATIS*');
    });

    it('generates message with buyer info', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        buyerName: 'John Doe',
        buyerPhone: '3009999999',
        buyerEmail: 'john@test.com',
        buyerDocument: '12345678',
      });
      expect(msg).toContain('Nombre: John Doe');
      expect(msg).toContain('Teléfono: 3009999999');
      expect(msg).toContain('Email: john@test.com');
      expect(msg).toContain('ID Documento: 12345678');
    });

    it('generates message with guest shipping address', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        buyerName: 'Invitado',
        shippingAddress: {
          address: 'Cra 1 #2-3',
          apartment: '201',
          buildingName: 'Torre Azul',
          reference: 'Frente al parque',
          city: 'Medellín',
          department: 'Antioquia',
          country: 'Colombia',
        },
      });

      expect(msg).toContain('Dirección: Cra 1 #2-3');
      expect(msg).toContain('Apartamento: 201');
      expect(msg).toContain('Edificio: Torre Azul');
      expect(msg).toContain('Referencia: Frente al parque');
      expect(msg).toContain('Ciudad: Medellín');
      expect(msg).toContain('Departamento: Antioquia');
    });

    it('generates message with shipping address', () => {
      const withShipping = {
        ...defaultParams,
        userData: {
          user: { id: 'u1', email: 'test@test.com', name: 'User' },
          profile: {
            shippingAddress: {
              address: '123 Main St',
              apartment: 'Apt 4B',
              buildingName: 'The Tower',
              reference: 'Near the park',
              city: 'Bogotá',
              department: 'Cundinamarca',
            },
          },
        } as any,
      };
      const msg = generateOrderWhatsAppMessage(withShipping);
      expect(msg).toContain('Dirección: 123 Main St');
      expect(msg).toContain('Apartamento: Apt 4B');
      expect(msg).toContain('Edificio: The Tower');
      expect(msg).toContain('Referencia: Near the park');
      expect(msg).toContain('Ciudad: Bogotá');
      expect(msg).toContain('Departamento: Cundinamarca');
    });

    it('generates message with custom answers', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        customAnswers: [{ question: 'Color', answer: 'Red' }],
      });
      expect(msg).toContain('*Información Adicional:*');
      expect(msg).toContain('*Color:* Red');
    });

    it('generates message without orderId uses store name', () => {
      const msg = generateOrderWhatsAppMessage({ ...defaultParams, orderId: undefined });
      expect(msg).toContain('Hola, quisiera realizar el siguiente pedido');
      expect(msg).toContain('*Tienda:* Test Store');
    });

    it('handles delivery zone with string price', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        deliveryZone: { id: 1, zone: 'Zone X', price: '3000' as any } as any,
      });
      expect(msg).toContain('*Costo de Envío:* $3,000');
    });

    it('generates message without userData', () => {
      const msg = generateOrderWhatsAppMessage({ ...defaultParams, userData: null });
      expect(msg).not.toContain('*Datos del Comprador:*');
    });

    it('omits store name when comercio is missing', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        comercio: null as any,
        orderId: undefined,
      });
      expect(msg).toContain('Hola, quisiera realizar el siguiente pedido');
      expect(msg).not.toContain('*Tienda:*');
    });

    it('omits delivery section when no delivery zone', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        deliveryZone: null,
      });
      expect(msg).not.toContain('Costo de Envío');
      expect(msg).not.toContain('Envío GRATIS');
    });

    it('includes shipping data when only apartment is provided', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        userData: {
          user: { id: 'u1' },
          profile: {
            shippingAddress: { address: '', apartment: 'Apt 101' },
          },
        } as any,
      });
      expect(msg).toContain('Apartamento: Apt 101');
    });

    it('includes shipping data when only building name is provided', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        userData: {
          user: { id: 'u1' },
          profile: {
            shippingAddress: { address: '', apartment: '', buildingName: 'Tower' },
          },
        } as any,
      });
      expect(msg).toContain('Edificio: Tower');
    });

    it('includes shipping data when only reference is provided', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        userData: {
          user: { id: 'u1' },
          profile: {
            shippingAddress: { address: '', apartment: '', buildingName: '', reference: 'Near park' },
          },
        } as any,
      });
      expect(msg).toContain('Referencia: Near park');
    });

    it('skips name and email when buyer data is missing', () => {
      const msg = generateOrderWhatsAppMessage({
        ...defaultParams,
        buyerPhone: '3000000000',
        userData: {
          user: { id: 'u1' },
          profile: {},
        } as any,
      });
      expect(msg).toContain('Datos del Comprador');
      expect(msg).not.toContain('Nombre:');
      expect(msg).not.toContain('Email');
      expect(msg).toContain('Teléfono: 3000000000');
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('sets window.location.href correctly', () => {
      sendWhatsAppMessage({ phone: '573001234567', message: 'Hello World' });
      expect(mockLocation.href).toContain('wa.me/573001234567');
      expect(mockLocation.href).toContain('Hello%20World');
    });

    it('strips non-digits from phone', () => {
      sendWhatsAppMessage({ phone: '+57 (300) 123-4567', message: 'Test' });
      expect(mockLocation.href).toContain('wa.me/573001234567');
    });
  });

  describe('getRedirectionInfo', () => {
    it('returns redirect for login required without user', () => {
      const result = getRedirectionInfo('store1', null, false, { activations: { requireLogin: true } } as any);
      expect(result.needsRedirect).toBe(true);
      expect(result.redirectTo).toBe('/store1/checkout');
      expect(result.message).toContain('iniciar sesión');
    });

    it('returns redirect for userData required without complete profile', () => {
      const result = getRedirectionInfo('store1', { user: { id: '1' } } as any, false, { activations: { requireUserData: true } } as any);
      expect(result.needsRedirect).toBe(true);
      expect(result.redirectTo).toBe('/store1/checkout');
      expect(result.message).toContain('datos');
    });

    it('returns no redirect when requirements met', () => {
      const result = getRedirectionInfo('store1', { user: { id: '1' } } as any, true, { activations: {} } as any);
      expect(result.needsRedirect).toBe(false);
    });
  });

  describe('hasCustomQuestions', () => {
    it('returns true when questions exist', () => {
      expect(hasCustomQuestions({ customQuestions: [{ question: 'Q1' }] } as any)).toBe(true);
    });

    it('returns false when no questions', () => {
      expect(hasCustomQuestions({ customQuestions: [] } as any)).toBe(false);
      expect(hasCustomQuestions(null)).toBe(false);
      expect(hasCustomQuestions({} as any)).toBe(false);
    });
  });

  describe('getOrderFlow', () => {
    it('returns redirectToCheckout when login required and no user', () => {
      const result = getOrderFlow(null, false, true, false, false, false, [], [], null);
      expect(result.redirectToCheckout).toBe(true);
    });

    it('returns redirectToCheckout when userData required and incomplete', () => {
      const result = getOrderFlow({ user: { id: '1' } } as any, false, false, true, false, false, [], [], null);
      expect(result.redirectToCheckout).toBe(true);
    });

    it('returns message when cart is empty', () => {
      const result = getOrderFlow({ user: { id: '1' } } as any, true, false, false, false, false, [], [], null);
      expect(result.message).toContain('vacío');
    });

    it('returns showDeliveryModal when delivery enabled but no zone', () => {
      const result = getOrderFlow({ user: { id: '1' } } as any, true, false, false, true, false, [mockCartItem as any], [], null);
      expect(result.showDeliveryModal).toBe(true);
    });

    it('returns showCustomQuestions when questions required but no answers', () => {
      const result = getOrderFlow({ user: { id: '1' } } as any, true, false, false, false, true, [mockCartItem as any], [], null);
      expect(result.showCustomQuestions).toBe(true);
    });

    it('returns canSubmit when all requirements met', () => {
      const result = getOrderFlow({ user: { id: '1' } } as any, true, false, false, false, false, [mockCartItem as any], [], null);
      expect(result.canSubmit).toBe(true);
    });
  });

  describe('createOrderAndSendWhatsApp', () => {
    it('creates order and redirects to whatsapp', async () => {
      const mockValidation = {
        items: [{ productId: 1, quantity: 2, finalPrice: 200 }],
        subTotal: 10000,
        total: 10500,
        delivery: 5000,
        discountTotal: 0,
        taxTotal: 0,
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockValidation }); // validate
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 123 } }); // create

      const result = await createOrderAndSendWhatsApp([], { buyerName: 'Buyer' });

      expect(api.post).toHaveBeenCalledWith('/orders/validate', expect.any(Object));
      expect(api.post).toHaveBeenCalledWith('/orders', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.orderId).toBe(123);
      expect(reduxStore.dispatch).toHaveBeenCalledWith(clearCart('store1'));
      expect(mockLocation.href).toContain('wa.me');
    });

    it('filters out empty custom answers before sending', async () => {
      const mockValidation = {
        items: [{ productId: 1, quantity: 2, finalPrice: 200 }],
        subTotal: 10000,
        total: 10500,
        delivery: 5000,
        discountTotal: 0,
        taxTotal: 0,
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockValidation });
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 123 } });

      const answers = [
        { question: 'Q1', answer: '   ' },
        { question: 'Q2', answer: 'OK' },
      ];

      await createOrderAndSendWhatsApp(answers);

      const orderData = vi.mocked(api.post).mock.calls[0][1] as any;
      expect(orderData.customAnswers).toEqual([{ question: 'Q2', answer: 'OK' }]);
    });

    it('handles zero delivery cost from validation', async () => {
      const mockValidation = {
        items: [{ productId: 1, quantity: 2, finalPrice: 200 }],
        subTotal: 10000,
        total: 10500,
        delivery: 0,
        discountTotal: 0,
        taxTotal: 0,
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockValidation });
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 123 } });

      await createOrderAndSendWhatsApp();

      const messageParam = new URL(mockLocation.href).searchParams.get('text') ?? '';
      const decoded = decodeURIComponent(messageParam);
      expect(decoded).toContain('Envío GRATIS');
    });

    it('returns error if api fails', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('API Error'));
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.message).toBe('API Error');
    });

    it('returns error if store not available', async () => {
      (reduxStore.getState as any).mockReturnValue({ auth: {}, cart: { carts: {} }, ui: {} });
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.message).toContain('tienda no disponible');
    });

    it('returns error if cart is empty', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        cart: { carts: { store1: { items: [] } }, selectedDeliveryZone: null },
      });
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.message).toContain('vacío');
    });

    it('returns error if cart is missing from state', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        cart: { carts: {}, selectedDeliveryZone: null },
      });
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.message).toContain('vacío');
    });

    it('returns error if cart items are undefined', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        cart: { carts: { store1: {} }, selectedDeliveryZone: null },
      });
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.message).toContain('vacío');
    });

    it('returns redirect if login required and no user', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        auth: { userData: null },
        ui: { store: { ...mockStore, configuration: { activations: { requireLogin: true } } } },
      });
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.needsRedirect).toBe(true);
    });

    it('returns redirect if userData required and incomplete', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        ui: { store: { ...mockStore, configuration: { activations: { requireUserData: true, requireShippingData: true } } } },
      });
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.needsRedirect).toBe(true);
    });

    it('returns showCustomQuestions if questions required but no answers', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        ui: { store: { ...mockStore, configuration: { ...mockStore.configuration, customQuestions: [{ question: 'Q1' }] } } },
      });
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.showCustomQuestions).toBe(true);
    });

    it('includes shipping address and buyer phone in order payload', async () => {
      const stateWithShipping = {
        ...mockState,
        auth: {
          userData: {
            user: { id: 'u1', email: 'test@test.com', name: 'User' },
            profile: { shippingAddress: { address: 'Street 1', reference: 'Ref 1' } },
          },
        },
      };
      (reduxStore.getState as any).mockReturnValue(stateWithShipping);

      const mockValidation = {
        items: [{ productId: 1, quantity: 2, finalPrice: 200 }],
        subTotal: 10000,
        total: 10500,
        delivery: 5000,
        discountTotal: 0,
        taxTotal: 0,
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockValidation });
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 123 } });

      await createOrderAndSendWhatsApp([], { buyerPhone: '3001111111' });

      const orderData = vi.mocked(api.post).mock.calls[0][1] as any;
      expect(orderData.shippingAddress).toEqual(stateWithShipping.auth.userData.profile.shippingAddress);
      expect(orderData.buyerPhone).toBe('3001111111');
    });

    it('includes guest buyer email, document and shipping address in order payload', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        auth: { userData: null },
      });

      const mockValidation = {
        items: [{ productId: 1, quantity: 2, finalPrice: 200 }],
        subTotal: 10000,
        total: 10500,
        delivery: 0,
        discountTotal: 0,
        taxTotal: 0,
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockValidation });
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 123 } });

      const guestShipping = {
        address: 'Street 99',
        city: 'Cali',
        department: 'Valle',
        country: 'Colombia',
        reference: 'Casa verde',
      };

      await createOrderAndSendWhatsApp([], {
        buyerName: 'Guest Buyer',
        buyerPhone: '3001111111',
        buyerEmail: 'guest@buyer.com',
        buyerDocument: 'DOC999',
        shippingAddress: guestShipping as any,
      });

      const orderData = vi.mocked(api.post).mock.calls[0][1] as any;
      expect(orderData.shippingAddress).toEqual(guestShipping);
      expect(orderData.buyerEmail).toBe('guest@buyer.com');
      expect(orderData.buyerDocument).toBe('DOC999');
    });

    it('omits delivery info when delivery is disabled', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        ui: {
          store: {
            ...mockStore,
            configuration: {
              ...mockStore.configuration,
              activations: { ...mockStore.configuration.activations, deliveryEnabled: false },
            },
          },
        },
      });

      const mockValidation = {
        items: [{ productId: 1, quantity: 2, finalPrice: 200 }],
        subTotal: 10000,
        total: 10500,
        delivery: 5000,
        discountTotal: 0,
        taxTotal: 0,
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockValidation });
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 123 } });

      await createOrderAndSendWhatsApp();

      const messageParam = new URL(mockLocation.href).searchParams.get('text') ?? '';
      const decoded = decodeURIComponent(messageParam);
      expect(decoded).not.toContain('Costo de Envío');
      expect(decoded).not.toContain('Envío GRATIS');
    });

    it('handles AxiosError with response message', async () => {
      const axiosError = new AxiosError('Network Error');
      (axiosError as any).response = { data: { message: 'Custom API Error' } };
      vi.mocked(api.post).mockRejectedValue(axiosError);
      const result = await createOrderAndSendWhatsApp();
      expect(result.message).toBe('Custom API Error');
    });

    it('returns generic error when api rejects with non-error', async () => {
      vi.mocked(api.post).mockRejectedValue('boom');
      const result = await createOrderAndSendWhatsApp();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error al crear la orden');
    });
  });

  describe('createOrderAndPayWithWompi', () => {
    it('creates order and returns payment link', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { paymentLink: 'http://pay.com', orderId: 456 }
      });

      const result = await createOrderAndPayWithWompi();

      expect(api.post).toHaveBeenCalledWith('/payments/store1/order-and-pay', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.paymentLink).toBe('http://pay.com');
      expect(result.orderId).toBe(456);
      expect(reduxStore.dispatch).toHaveBeenCalledWith(clearCart('store1'));
    });

    it('returns error if no payment link', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: {} });
      const result = await createOrderAndPayWithWompi();
      expect(result.success).toBe(false);
      expect(result.message).toContain('No se recibió el link');
    });

    it('returns error if store not available', async () => {
      (reduxStore.getState as any).mockReturnValue({ auth: {}, cart: { carts: {} }, ui: {} });
      const result = await createOrderAndPayWithWompi();
      expect(result.success).toBe(false);
      expect(result.message).toContain('tienda no disponible');
    });

    it('returns error if cart is empty', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        cart: { carts: { store1: { items: [] } }, selectedDeliveryZone: null },
      });
      const result = await createOrderAndPayWithWompi();
      expect(result.success).toBe(false);
      expect(result.message).toContain('vacío');
    });

    it('returns error if cart is missing from state', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        cart: { carts: {}, selectedDeliveryZone: null },
      });
      const result = await createOrderAndPayWithWompi();
      expect(result.success).toBe(false);
      expect(result.message).toContain('vacío');
    });

    it('returns error if cart items are undefined', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        cart: { carts: { store1: {} }, selectedDeliveryZone: null },
      });
      const result = await createOrderAndPayWithWompi();
      expect(result.success).toBe(false);
      expect(result.message).toContain('vacío');
    });

    it('returns redirect if login required', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        auth: { userData: null },
        ui: { store: { ...mockStore, configuration: { activations: { requireLogin: true } } } },
      });
      const result = await createOrderAndPayWithWompi();
      expect(result.needsRedirect).toBe(true);
    });

    it('returns redirect if userData required but incomplete', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        ui: { store: { ...mockStore, configuration: { activations: { requireUserData: true, requireShippingData: true } } } },
      });
      const result = await createOrderAndPayWithWompi();
      expect(result.needsRedirect).toBe(true);
    });

    it('returns error if custom questions required with no answers', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        ui: { store: { ...mockStore, configuration: { ...mockStore.configuration, customQuestions: [{ question: 'Q1' }] } } },
      });
      const result = await createOrderAndPayWithWompi();
      expect(result.success).toBe(false);
      expect(result.message).toContain('respuestas adicionales');
    });

    it('includes shipping address and buyer info in payload', async () => {
      const stateWithShipping = {
        ...mockState,
        auth: {
          userData: {
            user: { id: 'u1', email: 'test@test.com' },
            profile: { shippingAddress: { address: 'Street 1', reference: 'Ref 1' } },
          },
        },
      };
      (reduxStore.getState as any).mockReturnValue(stateWithShipping);

      vi.mocked(api.post).mockResolvedValue({
        data: { paymentLink: 'http://pay.com', orderId: 456 }
      });

      await createOrderAndPayWithWompi([], { buyerName: 'Buyer', buyerPhone: '3001111111' });

      const payload = vi.mocked(api.post).mock.calls[0][1] as any;
      expect(payload.order.shippingAddress).toEqual(stateWithShipping.auth.userData.profile.shippingAddress);
      expect(payload.order.buyerName).toBe('Buyer');
      expect(payload.order.buyerPhone).toBe('3001111111');
    });

    it('includes guest buyer email, document and shipping address in wompi payload', async () => {
      (reduxStore.getState as any).mockReturnValue({
        ...mockState,
        auth: { userData: null },
      });

      vi.mocked(api.post).mockResolvedValue({
        data: { paymentLink: 'http://pay.com', orderId: 456 }
      });

      await createOrderAndPayWithWompi([], {
        buyerName: 'Guest Buyer',
        buyerPhone: '3001111111',
        buyerEmail: 'guest@buyer.com',
        buyerDocument: 'DOC999',
        shippingAddress: {
          address: 'Street 99',
          city: 'Cali',
          department: 'Valle',
          country: 'Colombia',
        } as any,
      });

      const payload = vi.mocked(api.post).mock.calls[0][1] as any;
      expect(payload.order.shippingAddress).toEqual({
        address: 'Street 99',
        city: 'Cali',
        department: 'Valle',
        country: 'Colombia',
      });
      expect(payload.order.buyerEmail).toBe('guest@buyer.com');
      expect(payload.order.buyerDocument).toBe('DOC999');
    });

    it('filters custom answers in payment payload', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { paymentLink: 'http://pay.com', orderId: 456 }
      });

      const answers = [
        { question: 'Q1', answer: '' },
        { question: 'Q2', answer: 'Yes' },
      ];

      await createOrderAndPayWithWompi(answers);

      const payload = vi.mocked(api.post).mock.calls[0][1] as any;
      expect(payload.order.customAnswers).toEqual([{ question: 'Q2', answer: 'Yes' }]);
    });

    it('handles AxiosError with response message', async () => {
      const axiosError = new AxiosError('Network Error');
      (axiosError as any).response = { data: { message: 'Payment Gateway Error' } };
      vi.mocked(api.post).mockRejectedValue(axiosError);
      const result = await createOrderAndPayWithWompi();
      expect(result.message).toContain('Payment Gateway Error');
    });

    it('returns generic error when api rejects with non-error', async () => {
      vi.mocked(api.post).mockRejectedValue('boom');
      const result = await createOrderAndPayWithWompi();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Error al procesar el pago: Error al procesar el pago');
    });
  });

  describe('validateOrderRequirements', () => {
    it('returns false when login required and no user', () => {
      const config = { activations: { requireLogin: true } };
      expect(validateOrderRequirements({ userData: null, config: config as any }, false)).toBe(false);
    });

    it('returns false when userData required and profile incomplete', () => {
      const config = { activations: { requireUserData: true } };
      expect(validateOrderRequirements({ userData: { user: { id: '1' } } as any, config: config as any }, false)).toBe(false);
    });

    it('returns true when all requirements met', () => {
      const config = { activations: { requireLogin: true, requireUserData: true } };
      expect(validateOrderRequirements({ userData: { user: { id: '1' } } as any, config: config as any }, true)).toBe(true);
    });

    it('returns true when no requirements', () => {
      const config = { activations: {} };
      expect(validateOrderRequirements({ userData: null, config: config as any }, false)).toBe(true);
    });
  });

  describe('checkProfileComplete', () => {
    const basicUser = { user: { id: '1', email: 'e@e.com' } };

    it('returns false if null', () => {
      expect(checkProfileComplete(null)).toBe(false);
    });

    it('returns true if only user required (default)', () => {
      (reduxStore.getState as any).mockReturnValue({
        ui: { store: { configuration: { activations: { requireUserData: true } } } }
      });
      expect(checkProfileComplete(basicUser as any)).toBe(true);
    });

    it('returns false if shipping required and missing', () => {
      (reduxStore.getState as any).mockReturnValue({
        ui: { store: { configuration: { activations: { requireUserData: true, requireShippingData: true } } } }
      });
      expect(checkProfileComplete(basicUser as any)).toBe(false);
    });

    it('returns true if shipping required and present', () => {
      (reduxStore.getState as any).mockReturnValue({
        ui: { store: { configuration: { activations: { requireUserData: true, requireShippingData: true } } } }
      });
      const userWithShip = { ...basicUser, profile: { shippingAddress: { address: 'A', reference: 'R' } } };
      expect(checkProfileComplete(userWithShip as any)).toBe(true);
    });

    it('returns true when userData not required', () => {
      (reduxStore.getState as any).mockReturnValue({
        ui: { store: { configuration: { activations: { requireUserData: false } } } }
      });
      expect(checkProfileComplete(basicUser as any)).toBe(true);
    });
  });
});
