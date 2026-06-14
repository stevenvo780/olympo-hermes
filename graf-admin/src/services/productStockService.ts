/**
 * Servicio frontend para operaciones de stock de productos
 * Aprovecha la nueva arquitectura modular del backend con servicios específicos
 */
import api from '@/utils/axios';

export interface StockUpdateResult {
  productId: number;
  productName: string;
  previousStock: number | null;
  newStock: number | null;
  source: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface StockOperationOptions {
  source?: string;
  reason?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export class ProductStockService {
  /**
   * Actualiza el stock de un producto usando el endpoint específico de stock
   */
  static async updateStock(
    productId: number,
    storeId: string,
    newStock: number,
    options: StockOperationOptions = {}
  ): Promise<StockUpdateResult> {
    const response = await api.patch(`/products/${storeId}/stock/${productId}`, {
      stock: newStock,
      source: options.source || 'admin-panel',
      reason: options.reason || 'Manual stock update from admin panel',
      orderId: options.orderId,
      metadata: options.metadata
    });
    
    return response.data;
  }

  /**
   * Incrementa el stock de un producto (útil para devoluciones)
   */
  static async incrementStock(
    productId: number,
    storeId: string,
    quantity: number,
    options: StockOperationOptions = {}
  ): Promise<StockUpdateResult> {
    const response = await api.patch(`/products/${storeId}/stock/${productId}/increment`, {
      quantity,
      reason: options.reason || 'Stock increment from admin panel',
      devolucionId: options.orderId,
      metadata: options.metadata
    });
    
    return response.data;
  }

  /**
   * Decrementa el stock de un producto (útil para ventas directas)
   */
  static async decrementStock(
    productId: number,
    storeId: string,
    quantity: number,
    options: StockOperationOptions & { ventaId?: number } = {}
  ): Promise<StockUpdateResult> {
    const response = await api.patch(`/products/${storeId}/stock/${productId}/decrement`, {
      decrementBy: quantity,
      source: options.source || 'admin-panel',
      ventaId: options.ventaId,
      reason: options.reason || 'Stock decrement from admin panel',
      metadata: options.metadata
    });
    
    return response.data;
  }
}
