import {
  Controller,
  Post,
  Body,
  Req,
  Param,
  HttpCode,
  UseGuards,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaymentGateway } from 'prizma-payments';
import { MP_GATEWAY } from './mp-gateway.provider';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { OptionalFirebaseAuthGuard } from 'src/auth/optional-firebase-auth.guard';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import { GiftCoupon } from '@/gift-coupon/entities/gift-coupon.entity';
import { StoreService } from '@/store/store.service';

/** Webhook único del Hub: notification_url de TODO pago/suscripción. */
const HUB_WEBHOOK_URL =
  process.env.PRIZMA_HUB_WEBHOOK_URL ||
  'https://prizma-nous-578238159459.us-central1.run.app/webhooks/mercadopago';

/**
 * Endpoints de pago de cara al front (Checkout Pro / PreApproval de Mercado
 * Pago, cuenta CENTRAL). Reemplaza `WompiController` + `CustomPaymentsController`.
 */
@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(
    @Inject(MP_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly storeService: StoreService,
    @InjectRepository(GiftCoupon)
    private readonly giftCouponRepository: Repository<GiftCoupon>,
  ) {}

  // --- Pedidos de clientes finales (Checkout Pro) ---------------------------

  @Post('payments/:storeId/order-and-pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear pedido y generar checkout Mercado Pago' })
  @UseGuards(OptionalFirebaseAuthGuard)
  async orderAndPay(
    @Param('storeId') storeId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateOrderPaymentDto,
  ) {
    return this.paymentsService.orderAndPay(storeId, req.user, dto);
  }

  // --- Compra de tienda SaaS (pago único, cuenta CENTRAL) -------------------

  @Post('payments/store')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comprar tienda (checkout o cupón)' })
  async buyStore(
    @Req() req: RequestWithUser,
    @Body() details: { storeId: string; couponCode?: string },
  ) {
    if (!details.storeId) {
      throw new BadRequestException('Se requiere el ID de la tienda');
    }
    if (details.couponCode) {
      const coupon = await this.giftCouponRepository.findOne({
        where: { code: details.couponCode, used: false },
      });
      if (!coupon) {
        throw new BadRequestException('Cupón inválido o ya usado');
      }
      await this.storeService.createStoreFromPayment(
        details.storeId,
        req.user,
      );
      coupon.used = true;
      await this.giftCouponRepository.save(coupon);
      return { message: 'Tienda creada con cupón', storeId: details.storeId };
    }

    const price = Number(process.env.STORE_PRICE) || 0;
    const checkout = await this.gateway.createCheckout({
      items: [
        {
          id: details.storeId,
          title: 'Compra de tienda',
          quantity: 1,
          unit_price: price,
          currency_id: 'COP',
        },
      ],
      payer: { email: req.user.email, name: req.user.name },
      externalReference: `hermes:store:${details.storeId}`,
      notification_url: HUB_WEBHOOK_URL,
      metadata: { storeId: details.storeId },
      back_urls: {
        success: `${process.env.APP_DOMAIN}?paymentSuccessStore=true`,
      },
      auto_return: 'approved',
    });
    return { initPoint: checkout.init_point, paymentLink: checkout.init_point };
  }

  // --- Suscripción SaaS (PreApproval recurrente) ----------------------------

  @Post('payments/subscribe')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear suscripción de plan (Mercado Pago)' })
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const result = await this.subscriptionsService.createPlanSubscription({
      userId: req.user.id,
      email: req.user.email,
      planType: dto.planType,
      frequency: dto.frequency,
      backUrl: dto.backUrl,
    });
    return { success: true, ...result };
  }

  @Post('payments/cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar suscripción de plan' })
  async cancelSubscription(@Req() req: RequestWithUser) {
    return this.subscriptionsService.cancelSubscription(req.user.id);
  }
}
