import { Injectable, Logger } from '@nestjs/common';
import { ProductStockService } from '@/product/modules/stock/product-stock.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly productStockService: ProductStockService) {}

  /**
   * Flujo 5: Sincroniza inventario desde venta POS
   */
  async syncFromPOS(payload: {
    ventaId: number;
    storeId: string;
    items: Array<{
      productId: number;
      productName: string;
      quantitySold: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    totalAmount: number;
    timestamp: string;
    source: string;
    metadata: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    this.logger.log(
      `🔄 Procesando sincronización de inventario - Venta POS ${payload.ventaId}`,
    );

    const results = [];

    try {
      for (const item of payload.items) {
        this.logger.log(
          `📦 Procesando item: ${item.productName} (ID: ${item.productId}) - Cantidad vendida: ${item.quantitySold}`,
        );

        try {
          const stockResult = await this.productStockService.decrementStock(
            item.productId,
            payload.storeId,
            item.quantitySold,
            payload.source,
          );

          results.push({
            productId: item.productId,
            productName: item.productName,
            quantityDecremented: item.quantitySold,
            success: true,
            newStock: stockResult?.newStock || 'unknown',
            result: stockResult,
          });

          this.logger.log(
            `✅ Stock actualizado para producto ${item.productId}: -${item.quantitySold}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Error actualizando stock para producto ${item.productId}:`,
            error,
          );

          results.push({
            productId: item.productId,
            productName: item.productName,
            quantityDecremented: 0,
            success: false,
            error: error.message,
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      this.logger.log(
        `📊 Resumen sincronización Venta POS ${payload.ventaId}: ${successful} exitosos, ${failed} fallidos`,
      );

      return {
        ventaId: payload.ventaId,
        storeId: payload.storeId,
        totalItems: payload.items.length,
        successful,
        failed,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `❌ Error general en syncFromPOS para venta ${payload.ventaId}:`,
        error,
      );
      throw error;
    }
  }
}
