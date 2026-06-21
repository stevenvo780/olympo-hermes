import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsInboundController } from './payments-inbound.controller';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';
import { PaymentsInboundService } from './payments-inbound.service';
import { WebhookLockService } from './webhook-lock.service';
import { mpGatewayProvider } from './mp-gateway.provider';
import { Order } from '../order/entities/order.entity';
import { Store } from '../store/entities/store.entity';
import { GiftCoupon } from '../gift-coupon/entities/gift-coupon.entity';
import { PaymentSource } from './entities/payment-source.entity';
import { PaymentLinkMapping } from './entities/payment-link.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { OrderModule } from '../order/order.module';
import { StoreModule } from '../store/store.module';
import { UserModule } from '../user/user.module';
import { ConfigModule as AppConfigModule } from '../config/config.module';

/**
 * Módulo de pagos sobre `prizma-payments` (Mercado Pago, cuenta CENTRAL Prizma).
 *
 * Reemplaza a `WompiModule` + `CustomPaymentsModule`:
 *   - Checkout Pro de pedidos (`PaymentsService`).
 *   - PreApproval de planes SaaS (`SubscriptionsService`).
 *   - Webhook inbound del Hub `pago.*`/`suscripcion.*` (`PaymentsInboundService`).
 *
 * Las entidades históricas `PaymentSource` / `PaymentLinkMapping` se conservan
 * (mismos nombres de tabla) para no perder datos de conciliación.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Store,
      GiftCoupon,
      PaymentSource,
      PaymentLinkMapping,
      IdempotencyKey,
    ]),
    forwardRef(() => OrderModule),
    StoreModule,
    forwardRef(() => UserModule),
    AppConfigModule,
  ],
  controllers: [PaymentsController, PaymentsInboundController],
  providers: [
    mpGatewayProvider,
    PaymentsService,
    SubscriptionsService,
    PaymentsInboundService,
    WebhookLockService,
  ],
  exports: [PaymentsService, SubscriptionsService, PaymentsInboundService],
})
export class PaymentsModule {}
