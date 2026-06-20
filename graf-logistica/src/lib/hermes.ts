// Read-only client for the Graf backend (NestJS distribution module).
// graf-logistica NEVER writes to Graf; it only pulls routed/dispatched orders
// to build the loading/dispatch layer in its OWN database.

const GRAF_API_URL = process.env.GRAF_API_URL ?? "http://localhost:3004";
const GRAF_API_KEY = process.env.GRAF_API_KEY ?? "";

export const STORE_IDS = (process.env.GRAF_STORE_IDS ?? "graf-dist")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DEFAULT_UNIT_WEIGHT_KG = Number(
  process.env.DEFAULT_UNIT_WEIGHT_KG ?? "1.5",
);

export interface GrafOrder {
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

class GrafError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function grafGet(path: string): Promise<unknown> {
  const url = `${GRAF_API_URL}${path}`;
  const res = await fetch(url, {
    headers: { "x-api-key": GRAF_API_KEY, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GrafError(
      `Graf ${res.status} en ${path}: ${body.slice(0, 200)}`,
      res.status,
    );
  }
  return res.json();
}

/** Pull orders in a given distribution status for a store. */
export async function fetchOrders(
  storeId: string,
  status: "routed" | "dispatched" | "accepted" | "queued",
): Promise<GrafOrder[]> {
  const data = (await grafGet(
    `/distribution/orders?storeId=${encodeURIComponent(storeId)}&status=${status}`,
  )) as GrafOrder[];
  return Array.isArray(data) ? data : [];
}

export function isGrafConfigured(): boolean {
  return Boolean(GRAF_API_URL && GRAF_API_KEY);
}

export function grafBaseUrl(): string {
  return GRAF_API_URL;
}
