import { Product } from '@/types';
import { CartItem } from '@/redux/cart';

export const calculateProductTotalQuantity = (
  product: Product,
  cartItems: CartItem[]
): number => {
  if (!product || !Array.isArray(cartItems)) {
    return 0;
  }

  const directItem = cartItems.find(item => item.product.id === product.id);
  let totalQuantity = directItem ? directItem.quantity : 0;

  if (product.children && product.children.length > 0) {
    for (const child of product.children) {
      const childQuantity = calculateProductTotalQuantity(child, cartItems);
      totalQuantity += childQuantity;
    }
  }

  return totalQuantity;
};

export const calculateParentProductQuantity = (
  parentProduct: Product,
  cartItems: CartItem[]
): number => {
  return calculateProductTotalQuantity(parentProduct, cartItems);
};

export const hasSelectedVariations = (
  product: Product,
  cartItems: CartItem[]
): boolean => {
  return calculateProductTotalQuantity(product, cartItems) > 0;
};

export const getAllDescendantIds = (parentProduct: Product): number[] => {
  if (!parentProduct.children || parentProduct.children.length === 0) {
    return [parentProduct.id];
  }

  const descendantIds: number[] = [];

  for (const child of parentProduct.children) {
    if (child.children && child.children.length > 0) {
      descendantIds.push(...getAllDescendantIds(child));
    } else {
      descendantIds.push(child.id);
    }
  }

  return descendantIds;
};

export const findRootProduct = (product: Product): Product => {
  if (!product.parent) {
    return product;
  }
  return findRootProduct(product.parent);
};

export const isDescendantOf = (
  potentialDescendant: Product,
  potentialAncestor: Product
): boolean => {
  const descendantIds = getAllDescendantIds(potentialAncestor);
  return descendantIds.includes(potentialDescendant.id);
};
