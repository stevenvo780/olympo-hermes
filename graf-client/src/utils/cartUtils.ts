import { DeliveryZone, Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  finalPrice: number;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  items: number;
}

export const calculateCartTotals = (items: CartItem[] = [], selectedDeliveryZone?: DeliveryZone | null): CartTotals => {
  if (items.length === 0) {
    return {
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      total: 0,
      items: 0
    };
  }
  
  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.product.basePrice) * item.quantity), 
    0
  );
  
  const discountTotal = items.reduce(
    (acc, item) => acc + ((Number(item.product.discountPrice)) * item.quantity), 
    0
  );
  
  const taxTotal = items.reduce(
    (acc, item) => acc + ((Number(item.product.taxPrice)) * item.quantity), 
    0
  );
  
  let total = items.reduce(
    (acc, item) => acc + (Number(item.product.totalPrice) * item.quantity),
    0
  );

  const itemCount = items.reduce(
    (acc, item) => acc + item.quantity, 
    0
  );

  if (selectedDeliveryZone) {
    const deliveryPrice = selectedDeliveryZone.freeShippingThreshold && 
                          subtotal >= selectedDeliveryZone.freeShippingThreshold
      ? 0
      : Number(selectedDeliveryZone.price);
    total += deliveryPrice;
  }
  
  return {
    subtotal,
    discountTotal,
    taxTotal,
    total,
    items: itemCount
  };
};
