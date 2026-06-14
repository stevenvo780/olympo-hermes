import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Flujo 5: Sincronización de inventario desde Sinergia POS
   */
  @Post('sync-from-pos')
  @ApiOperation({ summary: 'Sincronizar inventario desde venta POS (Flujo 5)' })
  @ApiHeader({
    name: 'x-hub-central-signature',
    description: 'Firma de seguridad de Hub Central',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventario sincronizado exitosamente',
  })
  async syncFromPOS(
    @Body()
    payload: {
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
    },
    @Headers('x-hub-central-signature') _signature: string,
  ) {
    this.logger.log(
      `🔄 Sincronización de inventario desde POS recibida: Venta ${payload.ventaId}`,
    );

    try {
      const result = await this.inventoryService.syncFromPOS(payload);

      this.logger.log(
        `✅ Inventario sincronizado exitosamente: Venta ${payload.ventaId}`,
      );

      return {
        success: true,
        ventaId: payload.ventaId,
        itemsSynced: payload.items.length,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Error sincronizando inventario desde POS:`, error);
      throw new HttpException(
        'Error sincronizando inventario desde POS',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
