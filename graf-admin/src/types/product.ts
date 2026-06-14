import type { Tax, Discount, Category, Store } from './index';

export interface BaseProduct {
  id: number;
  title: string;
  description?: string;
  longDescription?: string;
  basePrice: number;
  stock: number | null;
  images?: string[];
  sku: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  longDescription?: string;
  basePrice: number;
  stock: number | null;
  sku: string;
  images?: string[];
  parent?: Product | null;
  children?: Product[];
  taxes?: Tax[];
  discounts?: Discount[];
  categories?: Category[];
  store: Store;
  orderItems?: unknown[];
  orderInCategory?: number;
  enabled?: boolean;
}

export interface ProductPayload extends Omit<BaseProduct, 'id'> {
  title: string;
  description?: string;
  longDescription?: string;
  basePrice: number;
  stock: number | null;
  images?: string[];
  sku: string;
  taxIds: number[];
  discountIds: number[];
  categoryIds: number[];
  parentId?: number;
}

export interface SelectOption {
  value: number;
  label: string;
}

export interface FilterParams {
  limit: number;
  offset: number;
  minPrice?: number;
  maxPrice?: number;
  text?: string;
  category?: number;
  discount?: boolean;
  exist?: boolean;
}

export interface VariationPayload {
  title: string;
  basePrice: string;
  stock: string;
}

export interface VariationSectionProps {
  currentProduct: Product;
  storeId: string;
  fetchProducts: () => void;
}
