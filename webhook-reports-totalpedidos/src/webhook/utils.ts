import {
  ProductQuantities,
  TotalProductsPerClient,
  Order,
  OrderData,
} from './types';
import { DateTime } from 'luxon';

export function prepareReportRows(
  productQuantities: ProductQuantities,
  clients: string[],
  totalProductsPerClient: TotalProductsPerClient,
): (string | number)[][] {
  const rows: (string | number)[][] = [];
  let totalGeneral = 0;

  for (const product in productQuantities) {
    const row: (string | number)[] = [product];
    let total = 0;
    clients.forEach((client) => {
      const quantity = productQuantities[product][client] || 0;
      row.push(quantity);
      totalProductsPerClient[client] += quantity;
      total += quantity;
      totalGeneral += quantity;
    });
    row.push(total);
    rows.push(row);
  }

  const finalRow: (string | number)[] = ['Total'];
  clients.forEach((client) => {
    finalRow.push(totalProductsPerClient[client]);
  });
  finalRow.push(totalGeneral);
  rows.push(finalRow);

  return rows;
}

export function initializeTotalProductsPerClient(
  clients: string[],
): TotalProductsPerClient {
  const totalProductsPerClient: TotalProductsPerClient = {};
  clients.forEach((client) => {
    totalProductsPerClient[client] = 0;
  });
  return totalProductsPerClient;
}

export function transformOrderData(order: Order): OrderData {
  return {
    ...order,
    additional_info: JSON.stringify(order.additional_info),
    preguntas: JSON.stringify(order.preguntas),
    productos: JSON.stringify(order.productos),
  };
}

export function convertOrderDataToOrder(orderData: OrderData): Order {
  return {
    ...orderData,
    productos: JSON.parse(orderData.productos),
    preguntas: JSON.parse(orderData.preguntas),
  };
}

export function getCurrentDateInBogota(): string {
  try {
    const bogotaDate = DateTime.now().setZone('America/Bogota');
    return bogotaDate.toFormat('yyyy-MM-dd');
  } catch (error) {
    console.error('Error al obtener la fecha actual:', error);
    return '';
  }
}
