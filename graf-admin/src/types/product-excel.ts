import { AxiosError } from 'axios';
import { Product } from './product';

export interface ProductExcelRow {
  id?: number;
  sku: string | number;
  title: string;
  description: string;
  longDescription?: string;
  basePrice: number;
  stock: number | null;
  parentSku?: string | undefined;
  categoryIds: string | number | number[];
  taxIds: string | number[];
  discountIds: string | number[];
  images?: string;
  action?: 'create' | 'update' | 'delete';
}

export enum ImportOperationStatus {
  CREATED = 'created',
  UPDATED = 'updated',
  SKIPPED = 'skipped',
  DELETED = 'deleted',
  FAILED = 'failed',
}

export interface ImportResult {
  sku: string;
  row?: number;
  status: string;
  message: string;
  productId?: number;
  error?: AxiosError;
}

export const productToExcelRow = (product: Product): ProductExcelRow => {
  return {
    id: product.id,
    sku: (() => {
      const saveSku = typeof product.sku === 'string'
        ? product.sku
        : String(product.sku || '');
      return saveSku.trim();
    })(),
    title: product.title || '',
    description: product.description || '',
    longDescription: product.longDescription || '',
    basePrice: product.basePrice,
    stock: product.stock,
    parentSku: (() => {
      const p = product.parent?.sku;
      return p ? String(p).trim() : undefined;
    })(),
    categoryIds: (product.categories || []).map(c => c.id),
    taxIds: (product.taxes || []).map(t => t.id),
    discountIds: (product.discounts || []).map(d => d.id),
    images: JSON.stringify(product.images || []),
    action: 'update',
  };
};
