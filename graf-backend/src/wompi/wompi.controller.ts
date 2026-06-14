import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Query,
  Res,
  HttpStatus,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { WompiService } from './wompi.service';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RequestWithUser } from '@/auth/types';
import { CreditCardPaymentDto } from './dto/credit-card-payment.dto';
import { PaymentLinkMapping } from './entities/payment-link.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { GiftCoupon } from '@/gift-coupon/entities/gift-coupon.entity';
import { StoreService } from '@/store/store.service';

@Controller('wompi')
export class WompiController {
  private readonly logger = new Logger(WompiController.name);

  constructor(
    private readonly wompiService: WompiService,
    @InjectRepository(PaymentLinkMapping)
    private paymentLinkRepository: Repository<PaymentLinkMapping>,
    @InjectRepository(GiftCoupon)
    private giftCouponRepository: Repository<GiftCoupon>,
    private readonly storeService: StoreService,
  ) {}

  @Post('payment-link/store')
  @UseGuards(FirebaseAuthGuard)
  async createStorePaymentLink(
    @Req() req: RequestWithUser,
    @Body() details: { storeId: string; couponCode?: string },
  ) {
    if (details.couponCode) {
      const coupon = await this.giftCouponRepository.findOne({
        where: { code: details.couponCode, used: false },
      });
      if (!coupon) {
        throw new BadRequestException('Cupón inválido o ya usado');
      }
      await this.storeService.createStoreFromPayment(details.storeId, req.user);
      coupon.used = true;
      await this.giftCouponRepository.save(coupon);
      return { message: 'Tienda creada con cupón', storeId: details.storeId };
    }
    if (!details.storeId) {
      throw new BadRequestException('Se requiere el ID de la tienda');
    }
    try {
      return await this.wompiService.createUniquePaymentLink({
        name: 'Compra de tienda',
        description: 'Compra de una nueva tienda',
        sku: process.env.WOMPI_STORE_SKU || 'DEFAULT_STORE_SKU',
        userId: req.user.id,
        amountInCents: Number(process.env.STORE_PRICE) * 100,
        redirectUrl: `${process.env.APP_DOMAIN}?paymentSuccessStore=true`,
        storeId: details.storeId,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Error al crear enlace de pago para la tienda',
        details: error.message,
      });
    }
  }

  @Post('subscribe')
  @UseGuards(FirebaseAuthGuard)
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() paymentData: CreditCardPaymentDto,
  ) {
    try {
      const result = await this.wompiService.processSubscription({
        userId: req.user.id,
        email: req.user.email,
        ...paymentData,
      });

      return {
        success: true,
        subscription: result,
        message: 'Suscripción confirmada correctamente',
      };
    } catch (error) {
      console.error(
        'Error procesando la suscripción:',
        JSON.stringify(error.response?.data || error.message, null, 2),
      );

      if (
        error instanceof BadRequestException ||
        error instanceof RequestTimeoutException
      ) {
        throw error;
      }

      throw new BadRequestException({
        message: 'Error procesando la suscripción',
        details: error.message || 'Error desconocido',
      });
    }
  }

  @Post('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  cancelSubscription(@Req() req: RequestWithUser) {
    return this.wompiService.cancelSubscription(req.user.id);
  }

  @Post('renew-subscriptions')
  async renewSubscriptions(@Query('accessKey') accessKey: string) {
    if (accessKey !== process.env.RENEWAL_ACCESS_KEY) {
      throw new BadRequestException('Clave de acceso inválida');
    }
    try {
      return await this.wompiService.renewSubscriptions();
    } catch (error) {
      this.logger.error('Error en renovación de suscripciones:', error);
      throw new BadRequestException({
        message: 'Error en renovación de suscripciones',
        details: error.message,
      });
    }
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const payload = req.body;
      const summary = await this.wompiService.handleWebhookEvent(payload);

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        summary,
      });
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error procesando webhook',
        details: error.message,
      });
    }
  }
}
