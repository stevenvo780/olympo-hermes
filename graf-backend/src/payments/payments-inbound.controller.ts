import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  HttpCode,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { verifySignature } from 'prizma-contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import {
  PaymentsInboundService,
  InboundPaymentPayload,
} from './payments-inbound.service';
import { WebhookLockService } from './webhook-lock.service';

/**
 * Webhook INBOUND que el Hub (Nous) invoca tras procesar un pago/suscripción en
 * Mercado Pago. Contrato fijado por PW2 (ver PAYMENTS_MIGRATION.md apéndice):
 *
 *   POST <HERMES_API_URL>/api/webhooks/payments
 *   headers: x-prizma-signature, x-prizma-event, x-idempotency-key
 *   body:    { eventType, externalReference, ...payload }
 *
 * Verifica la firma `x-prizma-signature` con el secreto compartido del Hub.
 */
@ApiTags('payments')
@Controller('api/webhooks')
export class PaymentsInboundController {
  private readonly logger = new Logger(PaymentsInboundController.name);
  private readonly IDEMPOTENCY_TTL_HOURS = 24;

  private get hubSecret(): string | undefined {
    return process.env.NOUS_HUB_SECRET || undefined;
  }

  constructor(
    private readonly inbound: PaymentsInboundService,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyKeyRepository: Repository<IdempotencyKey>,
    private readonly webhookLock: WebhookLockService,
  ) {}

  /**
   * Devuelve la entrada de cache si existe, no expiró y NO es un "claim" en
   * curso (statusCode > 0). null en otro caso.
   */
  private async lookupCached(
    idempotencyKey: string,
  ): Promise<IdempotencyKey | null> {
    const cached = await this.idempotencyKeyRepository.findOne({
      where: { idempotencyKey },
    });
    if (!cached) return null;
    if (cached.statusCode === 0) return null; // claim en curso de otro proceso
    if (new Date() < cached.expiresAt) return cached;
    return null;
  }

  @Post('payments')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook del Hub: eventos pago.*/suscripcion.*' })
  async handle(
    @Body() body: InboundPaymentPayload,
    @Req() req: Request & { rawBody?: string },
    @Res() res: Response,
    @Headers('x-prizma-signature') signature?: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const secret = this.hubSecret;
    // Fail-closed: sin secreto configurado NO se procesa ningún webhook.
    if (!secret) {
      this.logger.error(
        'NOUS_HUB_SECRET no configurado; rechazando webhook de pagos.',
      );
      throw new InternalServerErrorException(
        'Webhook signature verification not configured',
      );
    }
    // La firma es obligatoria.
    if (!signature) {
      throw new UnauthorizedException('Missing x-prizma-signature header');
    }
    // Verificar contra el cuerpo CRUDO (estable byte-a-byte), no el body
    // re-serializado tras el ValidationPipe (que rompería la firma).
    const rawBody = req.rawBody ?? JSON.stringify(body);
    if (!verifySignature(rawBody, signature, secret)) {
      this.logger.warn('Firma x-prizma-signature inválida; webhook rechazado.');
      throw new UnauthorizedException('Invalid HMAC signature');
    }

    // ── Sin idempotencyKey: no podemos lockear ni cachear. Procesamos confiando
    //    en la idempotencia de negocio (markPaidByGateway no re-emite si ya está
    //    PAID), que sigue siendo la red de seguridad contra doble efecto.
    if (!idempotencyKey) {
      this.logger.warn(
        'Webhook inbound SIN x-idempotency-key; sin lock, confiando en la ' +
          'idempotencia de negocio (markPaidByGateway).',
      );
      const r = await this.runHandler(body);
      res.status(r.statusCode).json(r.result);
      return;
    }

    // PASO 0: cache hit antes de gastar un lock.
    const cachedBefore = await this.lookupCached(idempotencyKey);
    if (cachedBefore) {
      this.logger.debug(`Idempotencia hit: x-idempotency-key ${idempotencyKey}`);
      res.status(cachedBefore.statusCode).json(cachedBefore.cachedResponse);
      return;
    }

    // PASO 1: lock distribuido. Cierra la race de dos webhooks idénticos
    // concurrentes (cada uno en una instancia de Cloud Run) que de otro modo
    // marcarían el pedido pagado y dispararían el fan-out dos veces.
    const lock = await this.webhookLock.acquire(idempotencyKey);
    this.logger.debug(
      `Webhook inbound (idempotencyKey=${idempotencyKey}) ` +
        `lock.acquired=${lock.acquired} backend=${lock.backend}`,
    );

    if (!lock.acquired) {
      // Otro proceso lo está procesando ahora. Puede que ya haya finalizado:
      // re-chequear cache una vez.
      const cachedAfter = await this.lookupCached(idempotencyKey);
      if (cachedAfter) {
        res.status(cachedAfter.statusCode).json(cachedAfter.cachedResponse);
        return;
      }
      // Aún en proceso por el otro worker → 409 para que el Hub reintente.
      this.logger.warn(
        `idempotencyKey=${idempotencyKey} en proceso concurrente; respondiendo 409.`,
      );
      res.status(409).json({
        error: 'Webhook con la misma idempotency-key está siendo procesado',
        statusCode: 409,
      });
      return;
    }

    // PASO 2: tenemos el lock → procesar en la sección crítica.
    const { result, statusCode } = await this.runHandler(body);

    if (statusCode >= 500) {
      // Fallo transitorio: liberar el lock para permitir reintento del Hub y NO
      // cachear el error (devolvemos el 5xx sin persistir como definitivo).
      await this.webhookLock.releaseOnFailure(idempotencyKey);
    } else {
      // Éxito (o error de negocio determinista 4xx): convertir el claim en
      // cache de idempotencia con TTL y liberar el lock.
      await this.webhookLock.finalize(
        idempotencyKey,
        result,
        statusCode,
        this.IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000,
      );
    }

    res.status(statusCode).json(result);
  }

  /** Ejecuta el procesamiento del webhook capturando errores con su statusCode. */
  private async runHandler(
    body: InboundPaymentPayload,
  ): Promise<{ result: Record<string, unknown>; statusCode: number }> {
    try {
      const result = await this.inbound.handle(body);
      return { result, statusCode: 200 };
    } catch (error) {
      const statusCode = error?.status || 500;
      return {
        result: {
          error: error?.message || 'Webhook processing failed',
          statusCode,
        },
        statusCode,
      };
    }
  }
}
