import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { verifySignature } from 'prizma-contracts';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Flujo 5: Sincronización de inventario desde Talanton POS.
   *
   * Endpoint autenticado por firma HMAC-SHA256 (header `x-prizma-signature`).
   * El firmante (Nous/Hermes) calcula `sha256=<HMAC(body, HUB_CENTRAL_SECRET)>`
   * sobre el cuerpo JSON crudo y la envía en el header. El receptor recalcula
   * y compara con timingSafeEqual. Cualquier mismatch → 401.
   */
  @Post('sync-from-pos')
  @ApiOperation({ summary: 'Sincronizar inventario desde venta POS (Flujo 5)' })
  @ApiHeader({
    name: 'x-prizma-signature',
    description: 'Firma HMAC de Nous/Prizma',
  })
  @ApiHeader({
    name: 'x-nous-signature',
    description: 'Firma legacy de Hub Central',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Inventario sincronizado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Firma inválida o ausente',
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
    @Headers() headers: Record<string, string | undefined> | string | undefined,
    @Req() req: Request,
  ) {
    const secret = process.env.PRIZMA_NOUS_SECRET || process.env.HUB_CENTRAL_SECRET;
    if (!secret) {
      this.logger.error('HUB_CENTRAL_SECRET no configurado en el servidor');
      throw new InternalServerErrorException(
        'HUB_CENTRAL_SECRET not configured',
      );
    }

    const signature =
      typeof headers === 'string'
        ? headers
        : headers?.['x-prizma-signature'] || headers?.['x-nous-signature'];
    if (!signature) {
      throw new UnauthorizedException('Missing x-prizma-signature header');
    }

    // Usamos el body crudo que Express ya almacenó (rawBody middleware) para
    // que la firma sea estable byte-a-byte y no dependa de re-serializar el
    // body ya parseado.
    const rawBody =
      (req as Request & { rawBody?: string }).rawBody ??
      JSON.stringify(payload);

    if (!verifySignature(rawBody, signature, secret)) {
      this.logger.warn(
        `Firma inválida en /inventory/sync-from-pos (venta ${payload?.ventaId})`,
      );
      throw new UnauthorizedException('Invalid signature');
    }

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
