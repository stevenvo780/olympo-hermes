import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentMethod } from '../order/entities/order.entity';
import { OrderService } from '../order/order.service';
import { StoreService } from '../store/store.service';

/**
 * Eventos de contrato que el Hub entrega a Hermes (ver PAYMENTS_MIGRATION.md
 * apéndice). El Hub ya consultó el estado real en MP (`getPayment` /
 * `getPreapproval`), normalizó el estado y enruta por el prefijo `hermes:` del
 * `externalReference`. Hermes solo reacciona; no habla con la pasarela.
 */
export type InboundPaymentEvent =
  | 'pago.aprobado'
  | 'pago.rechazado'
  | 'suscripcion.activada'
  | 'suscripcion.cancelada';

export interface InboundPaymentPayload {
  eventType: InboundPaymentEvent | string;
  /** `hermes:<kind>:<id...>` — la única pieza que dice a qué recurso aplica. */
  externalReference?: string;
  mpPaymentId?: string;
  mpPreapprovalId?: string;
  monto?: number;
  moneda?: string;
  motivo?: string;
  status?: string;
  [key: string]: unknown;
}

interface ParsedRef {
  producto: string;
  kind: string;
  id: string;
}

/**
 * Procesa los eventos `pago.*` / `suscripcion.*` que el Hub entrega en
 * `POST /api/webhooks/payments`. Marca el pedido pagado/fallido y dispara el
 * fan-out downstream existente (`pedido.pagado` lo emite `OrderService` al
 * transicionar a PAID, de forma transparente).
 */
@Injectable()
export class PaymentsInboundService {
  private readonly logger = new Logger(PaymentsInboundService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => StoreService))
    private readonly storeService: StoreService,
  ) {}

  /** Parsea `hermes:order:123` → { producto, kind, id }. */
  private parseRef(ref?: string): ParsedRef | null {
    if (!ref) return null;
    const segments = ref.split(':');
    if (segments.length < 3) return null;
    const [producto, kind, ...rest] = segments;
    if (!producto || !kind || rest.length === 0) return null;
    return { producto, kind, id: rest.join(':') };
  }

  async handle(payload: InboundPaymentPayload): Promise<{ ok: boolean; handled: string }> {
    const ref = this.parseRef(payload.externalReference);
    if (!ref) {
      this.logger.warn(
        `externalReference inválido o ausente: "${payload.externalReference}"; evento ${payload.eventType} ignorado.`,
      );
      return { ok: false, handled: 'invalid_reference' };
    }
    if (ref.producto !== 'hermes') {
      this.logger.warn(
        `externalReference de otro producto ("${ref.producto}"); evento ${payload.eventType} ignorado.`,
      );
      return { ok: false, handled: 'foreign_product' };
    }

    switch (payload.eventType) {
      case 'pago.aprobado':
        return this.onPaymentApproved(ref);
      case 'pago.rechazado':
        return this.onPaymentRejected(ref, payload.motivo);
      case 'suscripcion.activada':
        return this.onSubscriptionActivated(ref);
      case 'suscripcion.cancelada':
        return this.onSubscriptionCancelled(ref);
      default:
        this.logger.warn(`eventType desconocido: "${payload.eventType}"`);
        return { ok: false, handled: 'unknown_event' };
    }
  }

  /**
   * `hermes:order:<id>` aprobado → marcar PAID. `OrderService.markPaidByGateway`
   * dispara `pedido.pagado` downstream de forma idempotente (no re-emite si ya
   * estaba PAID).
   */
  private async onPaymentApproved(ref: ParsedRef): Promise<{ ok: boolean; handled: string }> {
    if (ref.kind === 'order') {
      const orderId = parseInt(ref.id, 10);
      if (Number.isNaN(orderId)) {
        this.logger.error(`orderId inválido en ref: ${ref.id}`);
        return { ok: false, handled: 'invalid_order_id' };
      }
      try {
        await this.orderService.markPaidByGateway(orderId, PaymentMethod.MERCADOPAGO);
        return { ok: true, handled: 'order_paid' };
      } catch (err) {
        this.logger.error(`Error marcando pedido ${orderId} pagado:`, err);
        return { ok: false, handled: 'order_update_failed' };
      }
    }
    if (ref.kind === 'store') {
      // Compra de tienda SaaS pagada como pago único.
      this.logger.log(`Compra de tienda aprobada (storeId=${ref.id}).`);
      return { ok: true, handled: 'store_purchase' };
    }
    this.logger.warn(`kind no soportado para pago.aprobado: ${ref.kind}`);
    return { ok: false, handled: 'unsupported_kind' };
  }

  private async onPaymentRejected(
    ref: ParsedRef,
    motivo?: string,
  ): Promise<{ ok: boolean; handled: string }> {
    if (ref.kind === 'order') {
      const orderId = parseInt(ref.id, 10);
      if (Number.isNaN(orderId)) {
        return { ok: false, handled: 'invalid_order_id' };
      }
      // El pedido se queda en PENDING (pendiente_pago). Solo se loguea el motivo;
      // no se cancela para permitir reintentos de pago del comprador.
      this.logger.warn(`Pago rechazado para pedido ${orderId}: ${motivo ?? 'sin motivo'}`);
      return { ok: true, handled: 'order_payment_rejected' };
    }
    return { ok: true, handled: 'rejected_noop' };
  }

  private async onSubscriptionActivated(
    ref: ParsedRef,
  ): Promise<{ ok: boolean; handled: string }> {
    // `hermes:plan:<userId>` — la suscripción SaaS quedó autorizada en MP.
    this.logger.log(`Suscripción SaaS activada (${ref.kind}=${ref.id}).`);
    return { ok: true, handled: 'subscription_activated' };
  }

  private async onSubscriptionCancelled(
    ref: ParsedRef,
  ): Promise<{ ok: boolean; handled: string }> {
    this.logger.log(`Suscripción SaaS cancelada (${ref.kind}=${ref.id}).`);
    return { ok: true, handled: 'subscription_cancelled' };
  }
}
