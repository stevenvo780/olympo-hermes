import { Injectable } from '@nestjs/common';
import { GoogleSheet } from './google-sheets';
import { OrderData, Product, Order } from './types';
import { getCurrentDateInBogota, convertOrderDataToOrder } from './utils';

@Injectable()
export class WebhookService {
  private static historySheet: GoogleSheet | null = null;
  private static reportsSheet: GoogleSheet | null = null;
  private static productsSheet: GoogleSheet | null = null;

  constructor() {
    if (!WebhookService.historySheet) {
      WebhookService.historySheet = new GoogleSheet(
        process.env.URL_GOOGLE_SHEET_HISTORY,
      );
    }
    if (!WebhookService.reportsSheet) {
      WebhookService.reportsSheet = new GoogleSheet(
        process.env.URL_GOOGLE_SHEET_REPORTS,
      );
    }
    if (!WebhookService.productsSheet) {
      WebhookService.productsSheet = new GoogleSheet(
        process.env.URL_GOOGLE_SHEET_PRODUCTS,
      );
    }
  }

  async saveHistory(orderData: OrderData) {
    const sheetDate = getCurrentDateInBogota();
    try {
      await WebhookService.historySheet!.doc.loadInfo();
      let index = null;
      const existingSheet =
        WebhookService.historySheet!.doc.sheetsByTitle[sheetDate];
      if (!existingSheet) {
        const sheet = await WebhookService.historySheet!.addSheet(
          sheetDate,
          Object.keys(orderData),
        );
        index = sheet.index;
      } else {
        index = existingSheet.index;
      }
      if (index === null)
        throw new Error('No se pudo obtener la hoja de pedidos.');

      await WebhookService.historySheet!.sheetsPost(orderData, index);
    } catch (error) {
      console.error('Error al guardar el pedido en la hoja de pedidos:', error);
      throw new Error('Error al guardar el pedido en la hoja de pedidos.');
    }
  }

  async getProductOrderData(): Promise<Product[]> {
    await WebhookService.productsSheet!.doc.loadInfo();
    const productOrderData = await WebhookService.productsSheet!.sheetsGet(0);
    if (!productOrderData || productOrderData.length === 0) {
      throw new Error('No se encontraron datos en la hoja de productos.');
    }
    return productOrderData as Product[];
  }

  async getOrders(): Promise<Order[]> {
    const sheetDate = getCurrentDateInBogota();
    await WebhookService.historySheet!.doc.loadInfo();
    const sheetIndex =
      await WebhookService.historySheet!.getSheetIndexByName(sheetDate);
    const orderData = await WebhookService.historySheet!.sheetsGet(sheetIndex);
    const orders = orderData.map(convertOrderDataToOrder);
    if (!orders || orders.length === 0) {
      throw new Error('No se encontraron datos en la hoja de pedidos.');
    }
    return orders;
  }

  async updateReportSheet(
    rows: (string | number)[][],
    clients: string[],
    clientObservations: { [key: string]: string },
  ) {
    const sheetDate = getCurrentDateInBogota();
    await WebhookService.reportsSheet!.doc.loadInfo();
    const headers = ['Productos', ...clients, 'Total'];

    let index =
      await WebhookService.reportsSheet!.getSheetIndexByName(sheetDate);
    if (index === -1) {
      const sheet = await WebhookService.reportsSheet!.addSheet(
        sheetDate,
        headers,
      );
      index = sheet.index;
    }
    await WebhookService.reportsSheet!.clearSheet(index);
    await WebhookService.reportsSheet!.createColumns(headers);

    rows.forEach((row) => {
      const total = row.pop();
      row.push(total);
    });

    await WebhookService.reportsSheet!.sheetsCreateMassive(rows, index);

    const observationRow = ['Observaciones'];
    clients.forEach((client) => {
      observationRow.push(clientObservations[client] || '');
    });
    observationRow.push('');

    await WebhookService.reportsSheet!.sheetsPost(observationRow);
  }
}
