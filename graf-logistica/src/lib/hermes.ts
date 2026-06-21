// Read-only client for the Hermes backend (NestJS distribution module).
// prizma-hermes-logistica NEVER writes to Hermes; it only pulls routed/dispatched
// orders to build the loading/dispatch layer in its OWN database.

const HERMES_API_URL = process.env.HERMES_API_URL ?? "http://localhost:3000";
const HERMES_API_KEY = process.env.HERMES_API_KEY ?? "";

export const STORE_IDS = (process.env.HERMES_STORE_IDS ?? "hermes-dist")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DEFAULT_UNIT_WEIGHT_KG = Number(
  process.env.DEFAULT_UNIT_WEIGHT_KG ?? "1.5",
);

export interface HermesOrder {
  id: number;
  distStatus?: string;
  routeDate?: string | null;
  notes?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  amount?: { total?: number } | null;
  seller?: { id: number; name: string; code?: string } | null;
  deliveryZone?: {
    id: number;
    zone: string;
    routeGroup?: string | null;
    isCarrier?: boolean;
    code?: string;
  } | null;
  customer?: { id: number; name: string; phone?: string | null } | null;
  customerAddress?: {
    id: number;
    address: string;
    city?: string | null;
    phone?: string | null;
    label?: string | null;
  } | null;
  shippingAddress?: { address?: string; city?: string } | null;
  items?: Array<{ quantity: number }> | null;
}

class HermesError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function hermesGet(path: string): Promise<unknown> {
  const url = `${HERMES_API_URL}${path}`;
  const res = await fetch(url, {
    headers: { "x-api-key": HERMES_API_KEY, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new HermesError(
      `Hermes ${res.status} en ${path}: ${body.slice(0, 200)}`,
      res.status,
    );
  }
  return res.json();
}

/** Pull orders in a given distribution status for a store. */
export async function fetchOrders(
  storeId: string,
  status: "routed" | "dispatched" | "accepted" | "queued",
): Promise<HermesOrder[]> {
  const data = (await hermesGet(
    `/distribution/orders?storeId=${encodeURIComponent(storeId)}&status=${status}`,
  )) as HermesOrder[];
  return Array.isArray(data) ? data : [];
}

export function isHermesConfigured(): boolean {
  return Boolean(HERMES_API_URL && HERMES_API_KEY);
}

export function hermesBaseUrl(): string {
  return HERMES_API_URL;
}
