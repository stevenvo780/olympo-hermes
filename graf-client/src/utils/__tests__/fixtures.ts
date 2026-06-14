import type { Category, DeliveryZone, Product, Store } from '@/types';

const defaultStore = {} as Store;

export const makeProduct = (overrides: Partial<Product> = {}): Product => {
  const hasBasePrice = Object.prototype.hasOwnProperty.call(
    overrides,
    'basePrice',
  );

  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Product',
    description: overrides.description ?? '',
    stock: overrides.stock ?? 10,
    images: overrides.images ?? [],
    variationType: overrides.variationType ?? '',
    value: overrides.value ?? '',
    sku: overrides.sku ?? '',
    parent: overrides.parent,
    children: overrides.children ?? [],
    taxes: overrides.taxes ?? [],
    discounts: overrides.discounts ?? [],
    categories: overrides.categories ?? [],
    store: overrides.store ?? defaultStore,
    orderItems: overrides.orderItems ?? [],
    orderInCategory: overrides.orderInCategory,
    basePrice: hasBasePrice ? (overrides.basePrice ?? 0) : 0,
    discountPrice: overrides.discountPrice ?? 0,
    netPrice: overrides.netPrice ?? 0,
    taxPrice: overrides.taxPrice ?? 0,
    priceWithTax: overrides.priceWithTax ?? 0,
    totalPrice: overrides.totalPrice ?? 0,
    isParentProduct: overrides.isParentProduct ?? false,
    canAddToCart: overrides.canAddToCart ?? true,
    hasStock: overrides.hasStock ?? true,
    firstImageUrl: overrides.firstImageUrl ?? null,
    displayPrice: overrides.displayPrice ?? 0,
  };
};

export const makeCategory = (overrides: Partial<Category> = {}): Category => {
  const hasChildren = Object.prototype.hasOwnProperty.call(overrides, 'children');
  const hasParent = Object.prototype.hasOwnProperty.call(overrides, 'parent');

  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Category',
    description: overrides.description,
    imageUrl: overrides.imageUrl,
    store: overrides.store ?? defaultStore,
    products: overrides.products ?? [],
    parent: hasParent ? (overrides.parent as Category) : (null as unknown as Category),
    children: hasChildren ? (overrides.children as Category[]) : [],
  };
};

export const makeDeliveryZone = (
  overrides: Partial<DeliveryZone> = {},
): DeliveryZone => ({
  id: overrides.id ?? 1,
  zone: overrides.zone ?? 'Zone',
  price: overrides.price ?? 0,
  freeShippingThreshold: overrides.freeShippingThreshold,
  estimatedTime: overrides.estimatedTime ?? '1-2 days',
  store: overrides.store ?? defaultStore,
});
