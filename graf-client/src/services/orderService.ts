import {
  Config,
  OrderStatus,
  Product,
  Store,
  ShippingAddress,
  UserData,
  DeliveryZone,
} from '@/types';
import api from '@/utils/axios';
import { formatNumberWithCommas } from '@/utils/formatters';
import reduxStore from '@/redux/store';
import { clearCart } from '@/redux/cart';
import { AxiosError } from 'axios';

export interface CartItem {
  product: Product;
  quantity: number;
  finalPrice: number;
}

interface OrderItemInput {
  product: { id: number; name: string };
  quantity: number;
  unitPrice: number;
}

interface OrderDataInput {
  user?: { id: string };
  store: Store;
  items: OrderItemInput[];
  shippingAddress?: ShippingAddress;
  status: OrderStatus;
  customAnswers: { question: string; answer: string }[];
  deliveryZoneId?: number;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerDocument?: string;
}

interface ValidateOrderItem {
  productId: number;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  finalPrice: number;
  totalPrice: number;
}

export interface ValidateOrderResult {
  items: ValidateOrderItem[];
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  delivery?: number;
  total: number;
}

interface WhatsAppParams {
  phone: string;
  message: string;
}

export interface OrderMessageParams {
  comercio: Store;
  cartItems: CartItem[];
  total: number;
  subtotal: number;
  userData: UserData | null;
  orderId?: number | null;
  customAnswers?: { question: string; answer: string }[];
  deliveryZone?: DeliveryZone | null;
  customMessage?: string | null;
  discountTotal?: number;
  taxTotal?: number;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerDocument?: string;
  shippingAddress?: ShippingAddress;
}

export interface OrderResult {
  success: boolean;
  message: string;
  needsRedirect: boolean;
  redirectTo?: string;
  orderId?: number;
  showCustomQuestions?: boolean;
}

export interface RedirectInfo {
  needsRedirect: boolean;
  redirectTo?: string;
  message: string;
}

/**
 * Construye el texto listo para enviar por WhatsApp con el detalle del pedido.
 * Lanza error si el carrito está vacío.
 */
export const generateOrderWhatsAppMessage = ({
  comercio,
  cartItems,
  total,
  subtotal,
  userData,
  orderId = null,
  customAnswers = [],
  deliveryZone = null,
  customMessage = null,
  discountTotal = 0,
  taxTotal = 0,
  buyerName,
  buyerPhone,
  buyerEmail,
  buyerDocument,
  shippingAddress,
}: OrderMessageParams): string => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('No hay productos en el carrito');
  }

  const productList = cartItems
    .map(
      (item) =>
        `${item.quantity} *x* *${item.product.title}* = *$${formatNumberWithCommas(
          item.finalPrice,
        )}* \n`,
    )
    .join('\n');

  const customAnswersText =
    customAnswers && customAnswers.length > 0
      ? '\n✏️ *Información Adicional:*\n' +
        customAnswers.map((a) => `*${a.question}:* ${a.answer}`).join('\n')
      : '';

  let message: string;
  if (orderId && comercio) {
    message = `*Pedido #${orderId}*\n--------------------------------\n${productList}\n--------------------------------\n${customAnswersText}`;
  } else {
    const storeName = comercio ? `*Tienda:* ${comercio.name}\n` : '';
    message = `Hola, quisiera realizar el siguiente pedido:\n${storeName}--------------------------------\n${productList}\n--------------------------------\n${customAnswersText}`;
  }

  message += `\n\n💰 *Subtotal:* $${formatNumberWithCommas(subtotal)}`;

  if (discountTotal > 0) {
    message += `\n🔖 *Descuentos:* -$${formatNumberWithCommas(discountTotal)}`;
  }
  
  if (taxTotal > 0) {
    message += `\n🧾 *Impuestos:* +$${formatNumberWithCommas(taxTotal)}`;
  }

  if (deliveryZone) {
    const deliveryCost = typeof deliveryZone.price === 'number' 
      ? deliveryZone.price 
      : Number(deliveryZone.price);
    
    if (deliveryCost > 0) {
      message += `\n📦 *Costo de Envío:* $${formatNumberWithCommas(deliveryCost)}`;
      message += `\n🚚 *Zona de Envío:* ${deliveryZone.zone}`;
    } else {
      message += `\n🎉 *Envío GRATIS*`;
      message += `\n🚚 *Zona de Envío:* ${deliveryZone.zone}`;
    }
  }

  message += `\n💰 *Total:* $${formatNumberWithCommas(total)}`;

  const hasAnyBuyerData = userData || buyerName || buyerPhone || buyerEmail || buyerDocument;
  const shippingData = shippingAddress || userData?.profile?.shippingAddress;
  const hasShippingData = shippingData && (
    shippingData.address || 
    shippingData.apartment || 
    shippingData.buildingName || 
    shippingData.reference
  );

  if (hasAnyBuyerData || hasShippingData) {
    message += '\n\n👤 *Datos del Comprador:*';

    const nombre = buyerName || userData?.user?.name;
    if (nombre) {
      message += `\n👤 Nombre: ${nombre}`;
    }

    const email = buyerEmail || userData?.user?.email;
    if (email) {
      message += `\n📧 Email: ${email}`;
    }

    const telefono = buyerPhone || userData?.profile?.additionalPhone;
    if (telefono) {
      message += `\n📞 Teléfono: ${telefono}`;
    }

    const documento = buyerDocument || userData?.profile?.documentNumber || userData?.user?.documentNumber;
    if (documento) {
      message += `\n🪪ID Documento: ${documento}`;
    }

    if (shippingData?.address) {
      message += `\n📍 Dirección: ${shippingData.address}`;
    }
    if (shippingData?.apartment) {
      message += `\n🏢 Apartamento: ${shippingData.apartment}`;
    }
    if (shippingData?.buildingName) {
      message += `\n🏛️ Edificio: ${shippingData.buildingName}`;
    }
    if (shippingData?.reference) {
      message += `\n📌 Referencia: ${shippingData.reference}`;
    }
    if (shippingData?.city) {
      message += `\n🌆 Ciudad: ${shippingData.city}`;
    }
    if (shippingData?.department) {
      message += `\n🗺️ Departamento: ${shippingData.department}`;
    }
  }

  if (customMessage) {
    message += `\n💬 ${customMessage}`;
  }

  return message;
};

export const sendWhatsAppMessage = ({ phone, message }: WhatsAppParams): void => {
  if (typeof window === 'undefined') {
    throw new Error('sendWhatsAppMessage must run in browser');
  }
  const digits = `${phone}`.replace(/\D/g, '');
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  window.location.href = url;
};

export const validateOrderRequirements = (
  { userData, config }: Pick<{ userData: UserData | null; config: Config | null }, 'userData' | 'config'>,
  isProfileComplete: boolean,
): boolean => {
  const requireLogin = config?.activations?.requireLogin ?? false;
  const requireUserData = config?.activations?.requireUserData ?? false;
  
  if (requireLogin && !userData) return false;
  if (requireUserData && !isProfileComplete) return false;
  return true;
};

export const getRedirectionInfo = (
  storeId: string,
  userData: UserData | null,
  isProfileComplete: boolean,
  config: Config | null,
): RedirectInfo => {
  const requireLogin = config?.activations?.requireLogin ?? false;
  const requireUserData = config?.activations?.requireUserData ?? false;
  
  if (requireLogin && !userData) {
    return {
      needsRedirect: true,
      redirectTo: `/${storeId}/checkout`,
      message: 'Debes iniciar sesión para continuar',
    };
  }
  if (requireUserData && !isProfileComplete) {
    return {
      needsRedirect: true,
      redirectTo: `/${storeId}/checkout`,
      message: 'Completa tus datos para finalizar la compra',
    };
  }
  return { needsRedirect: false, message: 'Todos los requisitos están cumplidos' };
};

export const checkProfileComplete = (userData: UserData | null): boolean => {
  if (!userData) return false;

  const hasUser = Boolean(
    userData &&
    userData.user &&
    userData.user.id &&
    userData.user.email
  );

  const state = reduxStore.getState();
  const config = state.ui.store?.configuration;
  const requireUserData = config?.activations?.requireUserData ?? false;
  const requireShippingData = config?.activations?.requireShippingData ?? false;

  if (requireUserData) {
    if (requireShippingData) {
      const hasAddress = Boolean(
        userData.profile?.shippingAddress?.address &&
        userData.profile?.shippingAddress?.reference
      );
      return hasUser && hasAddress;
    }
    return hasUser;
  }

  return hasUser;
};

export const hasCustomQuestions = (config: Config | null): boolean => {
  return Boolean(config?.customQuestions && config.customQuestions.length > 0);
};

export const hasRequiredCustomQuestions = (config: Config | null): boolean => {
  return Boolean(
    config?.customQuestions?.some(q => q.required !== false)
  );
};

const requiredQuestionsAnswered = (
  config: Config | null,
  answers: { question: string; answer: string }[],
): boolean => {
  const requiredQuestions = config?.customQuestions?.filter(q => q.required !== false) || [];
  if (requiredQuestions.length === 0) return true;
  return requiredQuestions.every(q =>
    answers.some(a => a.question === q.question && a.answer.trim() !== '')
  );
};

export interface OrderFlowResult {
  redirectToCheckout?: boolean;
  showDeliveryModal?: boolean;
  showCustomQuestions?: boolean;
  canSubmit?: boolean;
  message?: string;
}

export function getOrderFlow(
  userData: UserData | null | undefined,
  isProfileComplete: boolean,
  requireLogin: boolean,
  requireUserData: boolean,
  deliveryEnabled: boolean,
  hasQuestions: boolean,
  currentCart: CartItem[] | null | undefined,
  customAnswers: { question: string; answer: string }[],
  selectedZone: DeliveryZone | null | undefined,
): OrderFlowResult {
  if (requireLogin && !userData) {
    return { redirectToCheckout: true, message: 'Se requiere login' };
  }
  if (requireUserData && (!userData || !isProfileComplete)) {
    return { redirectToCheckout: true, message: 'Completar datos de usuario' };
  }
  if (!currentCart || currentCart.length === 0) {
    return { message: 'El carrito está vacío' };
  }

  if (deliveryEnabled && !selectedZone) {
    return { showDeliveryModal: true };
  }
  if (hasQuestions && customAnswers.length === 0) {
    return { showCustomQuestions: true };
  }
  return { canSubmit: true };
}

export const createOrderAndSendWhatsApp = async (
  customAnswers: { question: string; answer: string }[] = [],
  buyerInfo?: {
    buyerName?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    buyerDocument?: string;
    shippingAddress?: ShippingAddress;
  },
): Promise<OrderResult> => {
  const state = reduxStore.getState();
  const { userData } = state.auth;
  const { carts } = state.cart;
  const config = state.ui.store?.configuration;
  const deliveryZone = state.cart.selectedDeliveryZone;
  const comercio = state.ui.store;

  if (!comercio || !config) {
    return {
      success: false,
      message: 'Información de la tienda no disponible. Recargue la página.',
      needsRedirect: false,
    };
  }

  const storeId = comercio.id;
  const currentCart = carts[storeId] || { items: [] };
  const cartItems = currentCart.items || [];
  if (cartItems.length === 0) {
    return { success: false, message: 'El carrito está vacío', needsRedirect: false };
  }

  const requireLogin = config.activations?.requireLogin ?? false;
  const requireUserData = config.activations?.requireUserData ?? false;
  const isProfileComplete = checkProfileComplete(userData);
  const hasConfiguredQuestions = hasCustomQuestions(config);
  const filteredAnswers = customAnswers.filter((a) => a.answer.trim() !== '');

  // buyerInfo from the checkout wizard satisfies buyer-data requirements
  const hasBuyerInfo = Boolean(buyerInfo?.buyerName && buyerInfo?.buyerPhone);

  if (requireLogin && !userData) {
    return {
      success: false,
      message: 'Debes iniciar sesión para continuar',
      needsRedirect: true,
      redirectTo: `/${storeId}/checkout`,
    };
  }
  if (requireUserData && !isProfileComplete && !hasBuyerInfo) {
    return {
      success: false,
      message: 'Completa tus datos para finalizar la compra',
      needsRedirect: true,
      redirectTo: `/${storeId}/checkout`,
    };
  }
  if (hasConfiguredQuestions && !requiredQuestionsAnswered(config, filteredAnswers)) {
    return {
      success: false,
      message: 'Se requieren respuestas adicionales',
      needsRedirect: false,
      showCustomQuestions: true,
    };
  }

  const storePhone = `${comercio.phonePrefix}${comercio.phoneNumber}`;

  const orderItemsInput: OrderItemInput[] = cartItems.map((item) => ({
    product: { id: item.product.id, name: item.product.title },
    quantity: item.quantity,
    unitPrice: Number(item.product.basePrice),
  }));

  const resolvedShippingAddress = buyerInfo?.shippingAddress || userData?.profile?.shippingAddress;

  const orderData: OrderDataInput = {
    store: comercio,
    items: orderItemsInput,
    status: OrderStatus.PENDING,
    customAnswers: filteredAnswers,
    ...(deliveryZone && { deliveryZoneId: deliveryZone.id }),
    ...(userData?.user && {
      user: { id: userData.user.id },
    }),
    ...(resolvedShippingAddress && {
      shippingAddress: resolvedShippingAddress,
    }),
    ...(buyerInfo?.buyerName && { buyerName: buyerInfo.buyerName }),
    ...(buyerInfo?.buyerPhone && { buyerPhone: buyerInfo.buyerPhone }),
    ...(buyerInfo?.buyerEmail && { buyerEmail: buyerInfo.buyerEmail }),
    ...(buyerInfo?.buyerDocument && { buyerDocument: buyerInfo.buyerDocument }),
  };

  try {

    const { data: validation } = await api.post<ValidateOrderResult>(
      '/orders/validate',
      orderData,
    );
    const {
      items: validatedItems,
      subTotal,
      discountTotal,
      taxTotal,
      delivery,
      total,
    } = validation;

    const response = await api.post('/orders', orderData);
    const orderId = response.data.id;

    const cartForMessage: CartItem[] = validatedItems.map((v) => {
      const cartItem = cartItems.find((c) => c.product.id === v.productId);
      if (!cartItem) {
        throw new Error(`Producto ${v.productId} no encontrado en carrito`);
      }
      const prod = cartItem.product;
      return { product: prod, quantity: v.quantity, finalPrice: Number(v.finalPrice) };
    });

    const deliveryInfo = deliveryZone && config.activations.deliveryEnabled
      ? { ...deliveryZone, price: delivery || 0 }
      : null;

    const message = generateOrderWhatsAppMessage({
      comercio,
      cartItems: cartForMessage,
      total: Number(total),
      subtotal: Number(subTotal),
      userData,
      orderId,
      customAnswers: filteredAnswers,
      deliveryZone: deliveryInfo,
      customMessage: config.customMessage,
      discountTotal: Number(discountTotal),
      taxTotal: Number(taxTotal),
      buyerName: buyerInfo?.buyerName,
      buyerPhone: buyerInfo?.buyerPhone,
      buyerEmail: buyerInfo?.buyerEmail,
      buyerDocument: buyerInfo?.buyerDocument,
      shippingAddress: resolvedShippingAddress,
    });

    reduxStore.dispatch(clearCart(storeId));
    sendWhatsAppMessage({ phone: storePhone, message });

    return {
      success: true,
      message: 'Orden creada y enviada por WhatsApp',
      needsRedirect: true,
      redirectTo: `/${storeId}`,
      orderId,
    };
  } catch (error: unknown) {
    let errorMessage = error instanceof Error ? error.message : 'Error al crear la orden';
    if (error instanceof AxiosError && error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    return { success: false, message: errorMessage, needsRedirect: false };
  }
}

export interface WompiPaymentResult {
  success: boolean;
  message: string;
  paymentLink?: string;
  orderId?: number;
  needsRedirect?: boolean;
  redirectTo?: string;
}

export const createOrderAndPayWithWompi = async (
  customAnswers: { question: string; answer: string }[] = [],
  buyerInfo?: {
    buyerName?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    buyerDocument?: string;
    shippingAddress?: ShippingAddress;
  }
): Promise<WompiPaymentResult> => {
  const state = reduxStore.getState();
  const { userData } = state.auth;
  const { carts } = state.cart;
  const config = state.ui.store?.configuration;
  const deliveryZone = state.cart.selectedDeliveryZone;
  const comercio = state.ui.store;

  if (!comercio || !config) {
    return {
      success: false,
      message: 'Información de la tienda no disponible. Recargue la página.',
    };
  }

  const storeId = comercio.id;
  const currentCart = carts[storeId] || { items: [] };
  const cartItems = currentCart.items || [];
  
  if (cartItems.length === 0) {
    return { success: false, message: 'El carrito está vacío' };
  }

  const requireLogin = config.activations?.requireLogin ?? false;
  const requireUserData = config.activations?.requireUserData ?? false;
  const isProfileComplete = checkProfileComplete(userData);
  const hasConfiguredQuestions = hasCustomQuestions(config);
  const filteredAnswers = customAnswers.filter((a) => a.answer.trim() !== '');

  // buyerInfo from the checkout wizard satisfies buyer-data requirements
  const hasBuyerInfo = Boolean(buyerInfo?.buyerName && buyerInfo?.buyerPhone);

  if (requireLogin && !userData) {
    return {
      success: false,
      message: 'Debes iniciar sesión para continuar',
      needsRedirect: true,
      redirectTo: `/${storeId}/checkout`,
    };
  }
  
  if (requireUserData && !isProfileComplete && !hasBuyerInfo) {
    return {
      success: false,
      message: 'Completa tus datos para finalizar la compra',
      needsRedirect: true,
      redirectTo: `/${storeId}/checkout`,
    };
  }
  
  if (hasConfiguredQuestions && !requiredQuestionsAnswered(config, filteredAnswers)) {
    return {
      success: false,
      message: 'Se requieren respuestas adicionales',
    };
  }

  const orderItemsInput: OrderItemInput[] = cartItems.map((item) => ({
    product: { id: item.product.id, name: item.product.title },
    quantity: item.quantity,
    unitPrice: Number(item.product.basePrice),
  }));

  const resolvedShippingAddress = buyerInfo?.shippingAddress || userData?.profile?.shippingAddress;

  const orderPayload = {
    store: comercio,
    items: orderItemsInput,
    status: OrderStatus.PENDING,
    customAnswers: filteredAnswers,
    ...(deliveryZone && { deliveryZoneId: deliveryZone.id }),
    ...(userData?.user && {
      user: { id: userData.user.id },
    }),
    ...(resolvedShippingAddress && {
      shippingAddress: resolvedShippingAddress,
    }),
    ...(buyerInfo?.buyerName && { buyerName: buyerInfo.buyerName }),
    ...(buyerInfo?.buyerPhone && { buyerPhone: buyerInfo.buyerPhone }),
    ...(buyerInfo?.buyerEmail && { buyerEmail: buyerInfo.buyerEmail }),
    ...(buyerInfo?.buyerDocument && { buyerDocument: buyerInfo.buyerDocument }),
  };

  const redirectUrl = `${window.location.origin}/${storeId}/order-success`;

  try {
    const response = await api.post(`/payments/${storeId}/order-and-pay`, {
      order: orderPayload,
      redirectUrl,
    });

    if (!response.data.paymentLink) {
      throw new Error('No se recibió el link de pago');
    }

    reduxStore.dispatch(clearCart(storeId));

    return {
      success: true,
      message: 'Redirigiendo al pago...',
      paymentLink: response.data.paymentLink,
      orderId: response.data.orderId,
    };
  } catch (error: unknown) {
    let errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago';
    
    if (error instanceof AxiosError && error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return { 
      success: false, 
      message: `Error al procesar el pago: ${errorMessage}` 
    };
  }
};
