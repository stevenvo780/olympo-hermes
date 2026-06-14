import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Order } from '../order/entities/order.entity';
import { DistOrderService, FindOrdersFilter } from './dist-order.service';
import { User } from '../user/entities/user.entity';

const STATUS_LABEL: Record<string, string> = {
  queued: 'En cola',
  accepted: 'Aceptado',
  routed: 'Enrutado',
  dispatched: 'Despachado',
  canceled: 'Anulado',
};

@Injectable()
export class ExportService {
  constructor(private readonly orderService: DistOrderService) {}

  /**
   * Builds the consolidated workbook the office uses to invoice and load.
   * Sheet "Consolidado": one row per order line. Sheet "Rutas": orders
   * grouped/classified by zone.
   */
  async buildConsolidated(
    storeId: string,
    user: User,
    filter: FindOrdersFilter,
  ): Promise<Buffer> {
    const orders = await this.orderService.findAll(storeId, user, filter);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(this.consolidatedRows(orders)),
      'Consolidado',
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(this.routeRows(orders)),
      'Rutas',
    );

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private consolidatedRows(orders: Order[]): (string | number)[][] {
    const header = [
      'Pedido',
      'Fecha',
      'Vendedor',
      'Cliente',
      'Documento',
      'Zona',
      'Estado',
      'Sede',
      'Dirección',
      'Teléfono',
      'Producto',
      'SKU',
      'Cantidad',
      'Precio Unit.',
      'Subtotal',
    ];
    const rows: (string | number)[][] = [header];

    for (const order of orders) {
      const date = order.createdAt
        ? new Date(order.createdAt).toISOString().split('T')[0]
        : '';
      const zone = order.deliveryZone?.zone ?? 'Sin zona';
      const status = STATUS_LABEL[order.distStatus ?? ''] ?? order.distStatus;
      const addr = order.customerAddress;
      const items = order.items ?? [];
      if (items.length === 0) {
        rows.push([
          order.id,
          date,
          order.seller?.name ?? '',
          order.customer?.name ?? order.buyerName ?? '',
          order.customer?.documentNumber ?? '',
          zone,
          status,
          addr?.label ?? '',
          addr?.address ?? '',
          order.buyerPhone ?? addr?.phone ?? '',
          '',
          '',
          0,
          0,
          0,
        ]);
        continue;
      }
      for (const item of items) {
        const qty = item.quantity;
        const unit = Number(item.unitPrice);
        rows.push([
          order.id,
          date,
          order.seller?.name ?? '',
          order.customer?.name ?? order.buyerName ?? '',
          order.customer?.documentNumber ?? '',
          zone,
          status,
          addr?.label ?? '',
          addr?.address ?? '',
          order.buyerPhone ?? addr?.phone ?? '',
          item.product?.title ?? '',
          item.product?.sku ?? '',
          qty,
          unit,
          qty * unit,
        ]);
      }
    }
    return rows;
  }

  private routeRows(orders: Order[]): (string | number)[][] {
    const header = [
      'Zona',
      'Ruta',
      'Transportadora',
      'Pedido',
      'Cliente',
      'Dirección',
      'Teléfono',
      'Estado',
      'Total',
    ];
    // The route sheet drives the load/cargue, so canceled orders are excluded
    // (they will not be dispatched). Carrier zones sort last — they are picked
    // up a single day, not routed with Medellín (F2), matching the routing view.
    const sorted = [...orders]
      .filter((o) => o.distStatus !== 'canceled')
      .sort((a, b) => {
        const carrierA = a.deliveryZone?.isCarrier ? 1 : 0;
        const carrierB = b.deliveryZone?.isCarrier ? 1 : 0;
        if (carrierA !== carrierB) return carrierA - carrierB;
        return (a.deliveryZone?.zone ?? 'zzz').localeCompare(
          b.deliveryZone?.zone ?? 'zzz',
        );
      });
    const rows: (string | number)[][] = [header];
    for (const order of sorted) {
      const z = order.deliveryZone;
      rows.push([
        z?.zone ?? 'Sin zona',
        z?.routeGroup ?? '',
        z?.isCarrier ? 'Sí' : 'No',
        order.id,
        order.customer?.name ?? order.buyerName ?? '',
        order.customerAddress?.address ?? '',
        order.buyerPhone ?? order.customerAddress?.phone ?? '',
        STATUS_LABEL[order.distStatus ?? ''] ?? order.distStatus ?? '',
        Number(order.amount?.total ?? 0),
      ]);
    }
    return rows;
  }
}
