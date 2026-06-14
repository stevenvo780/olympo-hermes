import { prisma } from "./prisma";
import {
  fetchOrders,
  STORE_IDS,
  DEFAULT_UNIT_WEIGHT_KG,
  type GrafOrder,
} from "./graf";

function units(o: GrafOrder): number {
  return (o.items ?? []).reduce((sum, it) => sum + (it.quantity || 0), 0);
}

function mapOrder(o: GrafOrder, storeId: string) {
  const u = units(o);
  return {
    grafOrderId: o.id,
    storeId,
    zone: o.deliveryZone?.zone ?? null,
    routeGroup: o.deliveryZone?.routeGroup ?? null,
    isCarrier: Boolean(o.deliveryZone?.isCarrier),
    customerName: o.customer?.name ?? o.buyerName ?? null,
    sellerName: o.seller?.name ?? null,
    address: o.customerAddress?.address ?? o.shippingAddress?.address ?? null,
    city: o.customerAddress?.city ?? o.shippingAddress?.city ?? null,
    phone: o.buyerPhone ?? o.customerAddress?.phone ?? o.customer?.phone ?? null,
    routeDate: o.routeDate ?? null,
    units: u,
    weightKg: Math.round(u * DEFAULT_UNIT_WEIGHT_KG * 100) / 100,
    totalAmount: Number(o.amount?.total ?? 0),
    grafDistStatus: o.distStatus ?? null,
    notes: o.notes ?? null,
  };
}

export interface SyncResult {
  store: string;
  fetched: number;
  created: number;
  updated: number;
  carriers: number;
  error?: string;
}

/**
 * Pulls routed + dispatched orders from Graf and upserts them into the
 * logistics DB. Idempotent: re-running only refreshes the Graf snapshot and
 * NEVER clobbers the local logistics state (truck assignment, sequence, the
 * loaded/dispatched/delivered status set in this app).
 */
export async function syncStore(storeId: string): Promise<SyncResult> {
  const result: SyncResult = {
    store: storeId,
    fetched: 0,
    created: 0,
    updated: 0,
    carriers: 0,
  };
  try {
    const [routed, dispatched] = await Promise.all([
      fetchOrders(storeId, "routed"),
      fetchOrders(storeId, "dispatched"),
    ]);
    const orders = [...routed, ...dispatched];
    result.fetched = orders.length;

    for (const o of orders) {
      const data = mapOrder(o, storeId);
      if (data.isCarrier) result.carriers++;
      const existing = await prisma.dispatchOrder.findUnique({
        where: { grafOrderId_storeId: { grafOrderId: o.id, storeId } },
      });
      if (existing) {
        // refresh only the Graf snapshot fields; keep logistics state intact
        await prisma.dispatchOrder.update({
          where: { id: existing.id },
          data: { ...data, syncedAt: new Date() },
        });
        result.updated++;
      } else {
        await prisma.dispatchOrder.create({ data });
        result.created++;
      }
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
  }
  return result;
}

export async function syncAll(): Promise<SyncResult[]> {
  const out: SyncResult[] = [];
  for (const storeId of STORE_IDS) {
    out.push(await syncStore(storeId));
  }
  return out;
}
