import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaymentGateway } from 'prizma-payments';
import { MP_GATEWAY } from './mp-gateway.provider';
import { OrderService } from '../order/order.service';
import { ConfigService } from '../config/config.service';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { RequestWithUser } from '../auth/types';
import { PaymentMethod } from '../order/entities/order.entity';
import { Store } from 'src/store/entities/store.entity';

/** Webhook único del Hub: notification_url de TODO pago/suscripción. */
const HUB_WEBHOOK_URL =
  process.env.PRIZMA_HUB_WEBHOOK_URL ||
  'https://prizma-nous-578238159459.us-central1.run.app/webhooks/mercadopago';

/**
 * Pagos de PEDIDOS con Mercado Pago Checkout Pro (cuenta CENTRAL, COP).
 *
 * Reemplaza el `CustomPaymentsService` de Wompi:
 *   - YA NO resuelve credenciales por `store_id` (cuenta CENTRAL, sin OAuth).
 *   - Crea una Preference (`createCheckout`) y devuelve su `init_point`; el front
 *     redirige ahí. El pedido queda `pendiente_pago` (PENDING) hasta que el Hub
 *     entregue `pago.aprobado` y `PaymentsInboundService` lo marque PAID.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(MP_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly orderService: OrderService,
    private readonly configService: ConfigService,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async orderAndPay(
    storeId: string,
    user: RequestWithUser['user'],
    dto: CreateOrderPaymentDto,
  ) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['owner'],
    });
    if (!store) {
      throw new BadRequestException('Store not found');
    }
    const config = await this.configService.getConfigByStore(
      storeId,
      store.owner,
    );
    if (!config.enablePaymentLinks) {
      throw new BadRequestException(
        'Payment links are disabled for this store',
      );
    }

    const order = await this.orderService.createOrder(user, {
      ...dto.order,
      paymentMethod: dto.order?.paymentMethod ?? PaymentMethod.MERCADOPAGO,
      store: store,
    });

    const items = (order.items || []).map((it) => {
      const product = it.product as unknown as { title?: string; id?: number };
      return {
        id: String(product?.id ?? ''),
        title: product?.title || `Producto ${product?.id ?? ''}`,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unitPrice ?? it.finalPrice) || 0,
        currency_id: 'COP',
      };
    });

    // Fallback: si no hay items detallados, cobrar el total como un solo ítem.
    if (items.length === 0) {
      items.push({
        id: String(order.id),
        title: `Pedido #${order.id}`,
        quantity: 1,
        unit_price: Number(order.amount?.total) || 0,
        currency_id: 'COP',
      });
    }

    try {
      const checkout = await this.gateway.createCheckout({
        items,
        payer: {
          email: order.buyerName ? undefined : undefined,
          name: order.buyerName || undefined,
        },
        externalReference: `hermes:order:${order.id}`,
        notification_url: HUB_WEBHOOK_URL,
        metadata: { storeId, orderId: String(order.id) },
        back_urls: {
          success: dto.redirectUrl,
          failure: dto.redirectUrl,
          pending: dto.redirectUrl,
        },
        auto_return: 'approved',
      });

      // Contrato con el front: `paymentLink` = init_point de MP (antes era el
      // checkout link de Wompi). `initPoint` se expone explícito para claridad.
      return {
        order,
        paymentLink: checkout.init_point,
        initPoint: checkout.init_point,
        orderId: order.id,
      };
    } catch (error) {
      const errMsg = error?.message || 'Unknown error';
      this.logger.error('Error creando checkout Mercado Pago:', errMsg);
      throw new BadRequestException(
        `Error al generar el link de pago: ${errMsg}`,
      );
    }
  }
}
