import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { PaymentGateway } from 'prizma-payments';
import { MP_GATEWAY } from './mp-gateway.provider';
import { UserService } from '../user/user.service';
import { Subscription } from '../user/entities/subscription.entity';
import {
  PLAN_DETAILS,
  PlanType,
} from '../user/entities/subscription.entity';
import { PaymentFrequency } from './entities/payment-source.entity';

/** Webhook único del Hub: notification_url de TODA suscripción. */
const HUB_WEBHOOK_URL =
  process.env.PRIZMA_HUB_WEBHOOK_URL ||
  'https://prizma-nous-578238159459.us-central1.run.app/webhooks/mercadopago';

export interface CreateSubscriptionInputDto {
  userId: string;
  email: string;
  planType: PlanType;
  frequency: PaymentFrequency | string;
  /** URL pública de retorno tras autorizar la suscripción en MP. */
  backUrl?: string;
}

/**
 * Suscripciones SaaS de la tienda con Mercado Pago PreApproval (recurrencia
 * NATIVA: MP recobra solo). Cuenta CENTRAL, COP.
 *
 * Reemplaza el flujo Wompi de tokenización de tarjeta + cobros manuales +
 * `renewSubscriptions` (ya no hace falta cron de recobro). El front redirige al
 * `init_point`; cuando MP autoriza, el Hub entrega `suscripcion.activada`.
 */
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @Inject(MP_GATEWAY) private readonly gateway: PaymentGateway,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  /**
   * Crea la PreApproval recurrente para un plan SaaS y devuelve el `init_point`
   * al que el front debe redirigir (Checkout de suscripción de MP).
   */
  async createPlanSubscription(data: CreateSubscriptionInputDto): Promise<{
    initPoint: string;
    subscriptionId: string;
    status: string;
  }> {
    const user = await this.userService.findOne(data.userId);
    if (!user) {
      throw new BadRequestException({
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    const plan = PLAN_DETAILS[data.planType];
    if (!plan || data.planType === PlanType.FREE) {
      throw new BadRequestException('Plan inválido para suscripción');
    }

    const annually = data.frequency === PaymentFrequency.ANNUALLY;
    const amount = annually ? Math.round(plan.price * 12 * 0.8) : plan.price;

    try {
      const result = await this.gateway.createSubscription({
        payerEmail: data.email,
        reason: `Suscripción ${plan.name} (${annually ? 'anual' : 'mensual'})`,
        auto_recurring: {
          frequency: annually ? 12 : 1,
          frequency_type: 'months',
          amount,
          currency: 'COP',
        },
        externalReference: `hermes:plan:${data.userId}`,
        back_url: data.backUrl || process.env.APP_DOMAIN || HUB_WEBHOOK_URL,
        notification_url: HUB_WEBHOOK_URL,
      });

      return {
        initPoint: result.init_point,
        subscriptionId: result.id,
        status: result.status,
      };
    } catch (error) {
      this.logger.error(
        'Error creando suscripción Mercado Pago:',
        error?.message || error,
      );
      throw new BadRequestException(
        `Error al crear la suscripción: ${error?.message || 'desconocido'}`,
      );
    }
  }

  /** Cancela la suscripción local (vuelve al plan FREE). */
  async cancelSubscription(userId: string): Promise<Subscription> {
    return this.userService.cancelUserSubscription(userId);
  }
}
