import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  RequestTimeoutException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  PaymentFrequency,
  PaymentSource,
} from './entities/payment-source.entity';
import {
  PLAN_DETAILS,
  PlanType,
  Subscription,
} from '../user/entities/subscription.entity';
import { UserService } from '../user/user.service';
import { v4 as uuidv4 } from 'uuid';
import { PaymentLinkMapping } from './entities/payment-link.entity';
import { PendingWompiSubscription } from './entities/pending-wompi-subscription.entity';
import axiosWompi from '@/utils/axiosWompiInstance';
import { encrypt, decrypt } from '@/utils/encrypt';
import { StoreService } from '../store/store.service';
import { extractWompiErrorDetails } from './wompi.util';
import * as crypto from 'crypto';
import { User } from '../user/entities/user.entity';
import {
  DetailTransaction,
  PendingSubscription,
  RenewedSubscriptionSummary,
  TransactionResult,
  WompiWebhookPayload,
} from './wompi.types';
import { OrderService } from '../order/order.service';
import { UpdateOrderDto } from '../order/dto/update-order.dto';
import { OrderStatus } from '../order/entities/order.entity';

@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);
  /**
   * MECANISMO DE PERSISTENCIA (FIXED):
   * pendingSubscriptions se persistió en tabla PendingWompiSubscription.
   * Transactionnes pendientes sobreviven reinicio/multi-instancia.
   *
   * Flujo:
   * 1. processSubscription guarda un registro en PendingWompiSubscription.
   * 2. await Promise espera 60s (WEBHOOK_TIMEOUT).
   * 3. Si webhook llega a otra instancia → busca por transactionId en DB.
   * 4. Si timeout → cron limpia registros expirados.
   */
  private readonly WEBHOOK_TIMEOUT = 60000;

  constructor(
    @InjectRepository(PaymentSource)
    private paymentSourceRepository: Repository<PaymentSource>,
    @InjectRepository(PendingWompiSubscription)
    private pendingWompiRepository: Repository<PendingWompiSubscription>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @InjectRepository(PaymentLinkMapping)
    private paymentLinkRepository: Repository<PaymentLinkMapping>,
    @Inject(forwardRef(() => StoreService))
    private storeService: StoreService,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
  ) {}

  async createUniquePaymentLink(data: {
    name: string;
    description: string;
    sku: string;
    userId: string;
    amountInCents: number;
    redirectUrl: string;
    storeId: string;
  }): Promise<string> {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        amount_in_cents: data.amountInCents || null,
        currency: 'COP',
        sku: data.sku,
        redirect_url: data.redirectUrl || null,
        single_use: true,
        collect_shipping: false,
      };
      const response = await axiosWompi.post('/payment_links', payload);
      const paymentLinkId = response.data.data.id;
      await this.paymentLinkRepository.save({
        paymentLinkId,
        user: { id: data.userId } as User,
        sku: data.sku,
        storeId: data.storeId,
      });

      const wompiCheckoutUrl = `https://checkout.wompi.co/l/${paymentLinkId}`;

      return wompiCheckoutUrl;
    } catch (error) {
      this.logger.error(
        'Error creating unique payment link:',
        JSON.stringify(error.response?.data || error.message, null, 2),
      );

      const errorDetail = extractWompiErrorDetails(error);
      throw new BadRequestException({
        message: 'Error al crear enlace de pago',
        details: errorDetail.message,
        code: errorDetail.code,
      });
    }
  }

  async processSubscription(data: {
    userId: string;
    email: string;
    planType: PlanType;
    frequency: string;
    tokenId: string;
    acceptanceToken: string;
    acceptPersonalAuthToken: string;
  }): Promise<Subscription> {
    const user = await this.userService.findOne(data.userId);
    if (!user) {
      throw new BadRequestException({
        message: 'Usuario no encontrado',
        details: 'El usuario no existe',
        code: 'USER_NOT_FOUND',
      });
    }
    try {
      const sourceResponse = await axiosWompi.post('/payment_sources', {
        type: 'CARD',
        token: data.tokenId,
        customer_email: data.email,
        acceptance_token: data.acceptanceToken,
        accept_personal_auth: data.acceptPersonalAuthToken,
      });

      if (sourceResponse.data.data?.status !== 'AVAILABLE') {
        const errorMessage =
          sourceResponse.data.data?.status_message ||
          'La fuente de pago no está disponible';
        throw new BadRequestException({
          message: 'Error al crear la fuente de pago',
          details: errorMessage,
          code: 'PAYMENT_SOURCE_UNAVAILABLE',
        });
      }

      const sourceId = sourceResponse.data.data.id;

      let planPrice = PLAN_DETAILS[data.planType].price;
      if (data.frequency === PaymentFrequency.ANNUALLY) {
        planPrice = planPrice * 12 * 0.8;
      }
      const reference = `sub-${data.planType}-${uuidv4().substring(0, 8)}`;

      const transactionResult = await this.createTransaction({
        sourceId,
        amountInCents: Math.round(planPrice * 100),
        email: data.email,
        reference,
        description: `Suscripción ${data.planType} - ${data.frequency}`,
        detail: {
          planType: data.planType,
          frequency: data.frequency as PaymentFrequency,
          userId: data.userId,
          sourceId: encrypt(String(sourceId), process.env.ENCRYPTION_KEY),
        },
      });

      if (!transactionResult.success) {
        throw new BadRequestException({
          message: 'Error al procesar la transacción',
          details: transactionResult.error.message,
          code: transactionResult.error.code,
          additionalInfo: transactionResult.error.details,
        });
      }

      const transaction = transactionResult.transaction;

      // Persistir suscripción pendiente en DB (para multi-instancia/reinicio).
      const expiresAt = new Date(Date.now() + this.WEBHOOK_TIMEOUT);
      await this.pendingWompiRepository.save({
        transactionId: transaction.id,
        userId: data.userId,
        subscriptionData: {
          planType: data.planType,
          frequency: data.frequency,
          sourceId: sourceId,
        },
        expiresAt,
      });

      const subscriptionPromise = await new Promise<Subscription>(
        (resolve, reject) => {
          const timer = setTimeout(async () => {
            // Limpiar registro expirado.
            await this.pendingWompiRepository.delete({
              transactionId: transaction.id,
            });
            reject(
              new RequestTimeoutException(
                'Tiempo de espera excedido para la confirmación del pago',
              ),
            );
          }, this.WEBHOOK_TIMEOUT);

          // Guardar en Map local SOLO para este request (para resolver la Promise).
          // La DB es la fuente de verdad para multi-instancia.
          (this as any).__localPendingSubscriptions = (this as any).__localPendingSubscriptions || new Map();
          (this as any).__localPendingSubscriptions.set(transaction.id, {
            resolve,
            reject,
            timer,
          });
        },
      );

      return subscriptionPromise;
    } catch (error) {
      this.logger.error(
        'Error processing subscription:',
        JSON.stringify(error.response?.data || error.message, null, 2),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorDetail = extractWompiErrorDetails(error);

      throw new BadRequestException({
        message: 'Error al procesar la suscripción',
        details: errorDetail.message,
        code: errorDetail.code,
      });
    }
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const paymentSources = await this.paymentSourceRepository.find({
      where: { user: { id: userId }, active: true },
    });
    for (const ps of paymentSources) {
      ps.active = false;
      await this.paymentSourceRepository.save(ps);
    }
    return await this.userService.cancelUserSubscription(userId);
  }

  async renewSubscriptions(): Promise<RenewedSubscriptionSummary[]> {
    const now = new Date();
    const renewedSubscriptions: RenewedSubscriptionSummary[] = [];
    const expiredSources = await this.paymentSourceRepository.find({
      where: { nextCharge: LessThan(now), active: true },
      relations: ['user'],
    });
    for (const source of expiredSources) {
      try {
        const sourceIdString = decrypt(
          source.sourceId,
          process.env.ENCRYPTION_KEY,
        );
        const sourceId = parseInt(sourceIdString, 10);

        if (isNaN(sourceId)) {
          this.logger.error(
            `Invalid sourceId for PaymentSource ${source.id}: ${sourceIdString}`,
          );
          continue;
        }

        const plan = PLAN_DETAILS[source.planType];
        if (!plan) {
          this.logger.warn(`Plan not found for planType: ${source.planType}`);
          continue;
        }
        let finalPrice = plan.price;
        if (source.frequency === PaymentFrequency.ANNUALLY) {
          finalPrice = finalPrice * 12 * 0.8;
        }
        const amountInCents = Math.round(finalPrice * 100);

        const transactionResult = await this.createTransaction({
          sourceId,
          amountInCents,
          email: source.user.email,
          reference: `renew-${source.id}-${Date.now()}`,
          description: `Renovación ${source.planType} - ${source.frequency}`,
          recurrent: true,
          detail: {
            planType: source.planType,
            frequency: source.frequency,
            userId: source.user.id,
            sourceId: source.sourceId,
          },
        });

        const transaction = transactionResult.transaction;

        // Persistir renovación pendiente en DB.
        const expiresAt = new Date(Date.now() + this.WEBHOOK_TIMEOUT);
        await this.pendingWompiRepository.save({
          transactionId: transaction.id,
          userId: source.user.id,
          subscriptionData: {
            planType: source.planType,
            frequency: source.frequency,
            sourceId: sourceId,
          },
          expiresAt,
        });

        await new Promise<Subscription>((resolve, reject) => {
          const timer = setTimeout(async () => {
            // Limpiar registro expirado.
            await this.pendingWompiRepository.delete({
              transactionId: transaction.id,
            });
            reject(
              new RequestTimeoutException(
                'Tiempo de espera excedido para la confirmación del pago',
              ),
            );
          }, this.WEBHOOK_TIMEOUT);

          // Map local solo para este request.
          (this as any).__localPendingSubscriptions = (this as any).__localPendingSubscriptions || new Map();
          (this as any).__localPendingSubscriptions.set(transaction.id, {
            resolve,
            reject,
            timer,
          });
        });

        renewedSubscriptions.push({
          id: source.id,
          userEmail: source.user.email,
          planType: source.planType,
          renewedAt: new Date().toISOString(),
        });
      } catch (error) {
        const errorDetail = extractWompiErrorDetails(error);
        this.logger.error(
          `Error renewing PaymentSource ${source.id}:`,
          errorDetail.message,
          errorDetail.details || '',
        );
      }
    }
    this.logger.log(
      'Resumen de suscripciones renovadas:',
      renewedSubscriptions,
    );
    return renewedSubscriptions;
  }

  async handleWebhookEvent(payload: WompiWebhookPayload): Promise<{
    storePurchases: number;
    subscriptionsProcessed: number;
    rejectedSubscriptions: number;
  }> {
    this.validateSignature(payload);
    const summary = {
      storePurchases: 0,
      subscriptionsProcessed: 0,
      rejectedSubscriptions: 0,
    };

    if (payload.event === 'transaction.updated') {
      const transaction = payload.data?.transaction;
      const paymentLinkId = transaction?.payment_link_id;

      if (transaction?.status === 'APPROVED' && paymentLinkId) {
        const mapping = await this.paymentLinkRepository.findOne({
          where: { paymentLinkId },
          relations: ['user'],
        });
        if (mapping) {
          if (mapping.sku === process.env.WOMPI_STORE_SKU) {
            await this.storeService.createStoreFromPayment(
              mapping.storeId,
              mapping.user,
            );
            summary.storePurchases++;
          } else if (mapping.sku?.startsWith('order_')) {
            const orderId = parseInt(mapping.sku.split('_')[1], 10);
            try {
              // Use markPaidByGateway sin validación de permisos de usuario
              // (el webhook de Wompi ya está autenticado)
              await this.orderService.markPaidByGateway(
                orderId,
                'wompi' as any,
              );
            } catch (err) {
              this.logger.error(`Error marking order ${orderId} as paid:`, err);
            }
          }
        }
      }

      if (transaction && !transaction.payment_link_id) {
        // Buscar en DB (fuente de verdad multi-instancia).
        const pendingWompi = await this.pendingWompiRepository.findOne({
          where: { transactionId: transaction.id },
        });

        if (!pendingWompi || new Date() > pendingWompi.expiresAt) {
          // Registr expirado o no existe.
          throw new NotFoundException(
            'No se encontró la suscripción pendiente o la transacción expiró',
          );
        }

        // Buscar en Map local (resolver la Promise).
        const localMapObj = (this as any).__localPendingSubscriptions || new Map();
        const pendingSubscription = localMapObj.get(transaction.id);

        if (pendingSubscription) {
          clearTimeout(pendingSubscription.timer);
        }
        if (transaction.status === 'APPROVED') {
          const dataTransaction = JSON.parse(
            transaction.payment_method.payment_description,
          );
          try {
            const user = await this.userService.findOne(dataTransaction.userId);
            if (!user) {
              throw new NotFoundException('Usuario no encontrado');
            }
            let paymentSource = await this.paymentSourceRepository.findOne({
              where: { sourceId: dataTransaction.sourceId },
            });
            let nextCharge = new Date();
            if (!paymentSource) {
              paymentSource = new PaymentSource();
              nextCharge = this.calculateNextChargeDate(
                dataTransaction.frequency,
              );
            } else {
              if (paymentSource.frequency === PaymentFrequency.MONTHLY) {
                nextCharge.setMonth(nextCharge.getMonth() + 1);
              } else if (
                paymentSource.frequency === PaymentFrequency.ANNUALLY
              ) {
                nextCharge.setFullYear(nextCharge.getFullYear() + 1);
              }
            }
            paymentSource.sourceId = dataTransaction.sourceId;
            paymentSource.user = user;
            paymentSource.planType = dataTransaction.planType;
            paymentSource.frequency = dataTransaction.frequency;
            paymentSource.nextCharge = nextCharge;
            paymentSource.active = true;
            await this.paymentSourceRepository.save(paymentSource);
            const subscription = await this.userService.confirmSubscription(
              dataTransaction.planType,
              dataTransaction.userId,
              paymentSource,
            );
            if (pendingSubscription) {
              pendingSubscription.resolve(subscription);
            }
            summary.subscriptionsProcessed++;
          } catch (error) {
            if (pendingSubscription) pendingSubscription.reject(error);
            summary.rejectedSubscriptions++;
          }
        } else if (
          transaction.status === 'DECLINED' ||
          transaction.status === 'ERROR' ||
          transaction.status === 'VOIDED'
        ) {
          if (pendingSubscription) {
            pendingSubscription.reject(
              new BadRequestException({
                message: 'Pago rechazado',
                details:
                  transaction.status_message || 'La transacción fue rechazada',
                code: transaction.status,
              }),
            );
          }
          summary.rejectedSubscriptions++;
        }

        // Limpiar registros de DB y Map local.
        await this.pendingWompiRepository.delete({
          transactionId: transaction.id,
        });
        localMapObj.delete(transaction.id);
      }
    }
    console.info('Resumen del procesamiento del webhook:', summary);
    return summary;
  }

  private async createTransaction(data: {
    sourceId: number;
    amountInCents: number;
    email: string;
    reference: string;
    description: string;
    recurrent?: boolean;
    detail: DetailTransaction;
  }): Promise<TransactionResult> {
    try {
      const response = await axiosWompi.post('/transactions', {
        amount_in_cents: data.amountInCents,
        currency: 'COP',
        customer_email: data.email,
        reference: data.reference,
        payment_source_id: data.sourceId,
        payment_method: {
          installments: 1,
          payment_description: JSON.stringify(data.detail),
        },
        recurrent: data.recurrent || false,
      });

      return {
        success: true,
        transaction: response.data.data,
      };
    } catch (error) {
      this.logger.error(
        'Error creating transaction:',
        JSON.stringify(error.response?.data || error, null, 2),
      );

      const errorDetail = extractWompiErrorDetails(error);

      return {
        success: false,
        transaction: null,
        error: {
          code: errorDetail.code,
          message: errorDetail.message,
          details: errorDetail.details,
        },
      };
    }
  }

  private validateSignature(payload: WompiWebhookPayload): void {
    const receivedChecksum = payload.signature.checksum;
    if (!receivedChecksum) {
      throw new UnauthorizedException('Checksum de evento no proporcionado');
    }
    const properties = payload.signature.properties;
    if (!properties || !Array.isArray(properties)) {
      throw new BadRequestException('Propiedades de firma inválidas');
    }
    let concatenatedString = '';
    for (const prop of properties) {
      const parts = prop.split('.');
      let value: Record<string, unknown> = payload.data as Record<
        string,
        unknown
      >;
      for (const part of parts) {
        if (!value || value[part] === undefined) {
          throw new BadRequestException(
            `Propiedad ${prop} no encontrada en los datos`,
          );
        }
        value = value[part] as Record<string, unknown>;
      }
      concatenatedString += String(value);
    }
    concatenatedString += payload.timestamp;
    concatenatedString += process.env.WOMPI_EVENTS_SECRET;
    const hmac = crypto.createHash('sha256');
    const computedChecksum = hmac
      .update(concatenatedString)
      .digest('hex')
      .toUpperCase();
    if (computedChecksum !== String(receivedChecksum).toUpperCase()) {
      this.logger.error(
        `Firma inválida. Esperada: ${computedChecksum}, Recibida: ${receivedChecksum}`,
      );
      throw new UnauthorizedException('Firma de evento inválida');
    }
  }

  private calculateNextChargeDate(frequency: string): Date {
    const nextDate = new Date();
    if (frequency === PaymentFrequency.MONTHLY) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === PaymentFrequency.ANNUALLY) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    return nextDate;
  }
}
