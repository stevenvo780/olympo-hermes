import { Product } from '@/types';

export const sortProductsByCategoryOrder = (products: Product[]): Product[] => {
  return products.slice().sort((a, b) => {
    const aOrder = a.orderInCategory ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.orderInCategory ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || a.id - b.id;
  });
};
