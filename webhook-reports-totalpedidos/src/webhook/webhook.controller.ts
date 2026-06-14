import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { OrderBody, Order } from './types';
import {
  transformOrderData,
  prepareReportRows,
  initializeTotalProductsPerClient,
} from './utils';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleOrder(@Body() body: OrderBody) {
    try {
      const orderData = transformOrderData(body.order);

      await this.webhookService.saveHistory(orderData);

      const productOrderData = await this.webhookService.getProductOrderData();
      const orders = await this.webhookService.getOrders();

      const productQuantities = {};
      const clients = [];
      const clientObservations: { [key: string]: string } = {};

      orders.forEach((order) => {
        order.productos.forEach((product) => {
          if (!productQuantities[product.nombre]) {
            productQuantities[product.nombre] = {};
          }
          const clientDocument = this.getClientDocumentFromOrder(order);
          if (clientDocument) {
            this.addProductQuantity(productQuantities, product, clientDocument);
            clientObservations[clientDocument] =
              this.getObservationFromOrder(order);
            if (!clients.includes(clientDocument)) {
              clients.push(clientDocument);
            }
          }
        });
      });

      const totalProductsPerClient = initializeTotalProductsPerClient(clients);
      const rows = prepareReportRows(
        productQuantities,
        clients,
        totalProductsPerClient,
      );

      const productOrder = productOrderData.map((item) => item.nombre);
      rows.sort(
        (a, b) =>
          productOrder.indexOf(String(a[0])) -
          productOrder.indexOf(String(b[0])),
      );

      await this.webhookService.updateReportSheet(
        rows,
        clients,
        clientObservations,
      );

      return { message: 'Order data received and processed successfully' };
    } catch {
      throw new HttpException(
        'Failed to process order data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private addProductQuantity(
    productQuantities: any,
    product: any,
    clientDocument: string,
  ) {
    if (productQuantities[product.nombre][clientDocument]) {
      productQuantities[product.nombre][clientDocument] += product.cantidad;
    } else {
      productQuantities[product.nombre][clientDocument] = product.cantidad;
    }
  }

  private getObservationFromOrder(order: Order): string {
    const observationQuestion = order.preguntas.find(
      (q) => q.pregunta === 'OBSERVACIONES',
    );
    return observationQuestion?.respuesta || '';
  }

  private getClientDocumentFromOrder(order: Order): string | null {
    const clientDocumentQuestion = order.preguntas.find(
      (q) => q.pregunta === 'NIT/DOCUMENTO DE CLIENTE*',
    );
    return clientDocumentQuestion?.respuesta || null;
  }
}
