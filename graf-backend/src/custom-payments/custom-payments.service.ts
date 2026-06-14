import { Injectable, BadRequestException } from '@nestjs/common';
import { CredentialsService } from '../credentials/credentials.service';
import { OrderService } from '../order/order.service';
import { ConfigService } from '../config/config.service';
import axios from 'axios';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { RequestWithUser } from '../auth/types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentLinkMapping } from '../wompi/entities/payment-link.entity';
import { UpdateOrderDto } from '../order/dto/update-order.dto';
import { OrderStatus, PaymentMethod } from '../order/entities/order.entity';
import { Store } from 'src/store/entities/store.entity';
import { User } from '../user/entities/user.entity';

export interface WompiWebhookPayload {
  event: string;
  data?: {
    transaction?: {
      id: string;
      status: string;
      payment_link_id?: string;
    };
  };
}

@Injectable()
export class CustomPaymentsService {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly orderService: OrderService,
    private readonly configService: ConfigService,
    @InjectRepository(PaymentLinkMapping)
    private readonly paymentLinkRepository: Repository<PaymentLinkMapping>,
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
      paymentMethod: dto.order?.paymentMethod ?? PaymentMethod.WOMPI,
      store: store,
    });

    let privateKey: string;
    let publicKey: string;
    try {
      const credentials = await this.credentialsService.getCredentials(
        storeId,
        store.owner,
      );
      privateKey = credentials.privateKey;
      publicKey = credentials.publicKey;
    } catch (error) {
      console.error(
        `Error retrieving Wompi credentials for store ${storeId}:`,
        error?.message || error,
      );
      throw new BadRequestException(
        'Error al obtener las credenciales de pago. Verifique que las credenciales de Wompi estén configuradas correctamente.',
      );
    }

    // Auto-detect Wompi environment based on key prefix
    const wompiBaseUrl = publicKey?.startsWith('pub_prod')
      ? 'https://production.wompi.co/v1'
      : (process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1');

    const payload = {
      name: `Order #${order.id}`,
      description: `Payment for order ${order.id}`,
      amount_in_cents: Math.round(order.amount.total * 100),
      currency: 'COP',
      sku: `order_${order.id}`,
      redirect_url: dto.redirectUrl,
      single_use: true,
      collect_shipping: false,
    };
    console.log(
      'Creating payment link with payload:',
      JSON.stringify(payload, null, 2),
      `Wompi URL: ${wompiBaseUrl}`,
    );
    try {
      const response = await axios.post(
        `${wompiBaseUrl}/payment_links`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${privateKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(JSON.stringify(response.data, null, 2));
      const paymentLinkId = response.data.data.id;
      const paymentLink = `https://checkout.wompi.co/l/${paymentLinkId}`;
      await this.paymentLinkRepository.save({
        paymentLinkId,
        user: (user ? { id: user.id } : { id: store.owner.id }) as User,
        sku: `order_${order.id}`,
        storeId: storeId,
      });
      return { order, paymentLink };
    } catch (error) {
      const errMsg =
        (error?.response &&
          `Wompi ${error.response.status}: ${JSON.stringify(
            error.response.data,
          )}`) ||
        error?.message ||
        'Unknown error';
      console.error('Error creating payment link:', errMsg);
      throw new BadRequestException(
        `Error al generar el link de pago: ${errMsg}`,
      );
    }
  }

  async handleWebhook(storeId: string, payload: WompiWebhookPayload) {
    if (payload.event === 'transaction.updated') {
      const tx = payload.data?.transaction;
      if (tx?.status === 'APPROVED' && tx.payment_link_id) {
        const mapping = await this.paymentLinkRepository.findOne({
          where: { paymentLinkId: tx.payment_link_id, storeId },
          relations: ['user'],
        });
        if (mapping?.sku?.startsWith('order_')) {
          const orderId = parseInt(mapping.sku.split('_')[1], 10);
          const updateDto: UpdateOrderDto = {
            status: OrderStatus.PAID,
            paymentMethod: PaymentMethod.WOMPI,
          };
          const store = await this.storeRepository.findOne({
            where: { id: storeId },
            relations: ['owner'],
          });
          try {
            const order = await this.orderService.updateOrder(
              orderId,
              updateDto,
              store.owner,
            );
            if (!order) {
              throw new BadRequestException(`Order ${orderId} not found`);
            }
          } catch (err) {
            console.error(
              `Error processing order ${orderId} payment webhook:`,
              err,
            );
          }
        }
      }
    }
    return { success: true };
  }
}
