import type { Product } from '@/types';

export const collectLeafBasePrices = (product: Product): number[] => {
  const collect = (p: Product): number[] => {
    if (!p.children || p.children.length === 0) return [Number(p.basePrice) || 0];
    return p.children.flatMap((c) => collect(c as Product));
  };
  return collect(product);
};

export const getPriceRange = (product: Product): { min: number; max: number } => {
  const values = collectLeafBasePrices(product);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max };
};

export const hasVariations = (product: Product): boolean => !!(product.children && product.children.length > 0);

