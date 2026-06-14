// Distribution service. Uses the shared axios `api` instance so every request
// gets the base URL + auth headers (Firebase Bearer in prod, x-api-key in the
// demo). All endpoints live at the backend root and require a `storeId` query
// param.
import api from "@/utils/axios";

export type DistOrderStatus =
  | "queued"
  | "accepted"
  | "routed"
  | "dispatched"
  | "canceled";

export interface Seller {
  id: number;
  name: string;
  code: string;
  phone?: string;
  active: boolean;
}

export interface Zone {
  id: number;
  zone: string;
  code?: string;
  routeGroup?: string;
  isCarrier: boolean;
  active: boolean;
}

export interface CustomerAddress {
  id: number;
  label: string;
  address: string;
  city?: string;
  phone?: string;
  contactName?: string;
  isDefault: boolean;
}

export interface Customer {
  id: number;
  name: string;
  documentNumber?: string;
  phone?: string;
  deliveryZoneId?: number;
  zone?: Zone;
  addresses: CustomerAddress[];
}

export interface OrderItem {
  id?: number;
  product: { id: number; title: string; sku: string; basePrice: number };
  quantity: number;
  unitPrice: number;
}

export interface DistOrder {
  id: number;
  createdAt: string;
  distStatus: DistOrderStatus;
  routeDate?: string | null;
  seller?: Seller;
  customer?: Customer;
  customerAddress?: CustomerAddress;
  deliveryZone?: Zone;
  buyerName?: string;
  buyerPhone?: string;
  notes?: string;
  items: OrderItem[];
  amount: { total: number };
}

export interface Product {
  id: number;
  title: string;
  sku: string;
  basePrice: number;
}

export interface OrderFilters {
  sellerId?: number;
  deliveryZoneId?: number;
  status?: DistOrderStatus;
  startDate?: string;
  endDate?: string;
  routeStartDate?: string;
  routeEndDate?: string;
  search?: string;
}

export interface RoutingGroup {
  zoneId: number | null;
  zone: string;
  routeGroup: string | null;
  isCarrier: boolean;
  orders: DistOrder[];
}

export interface InventoryItem {
  productId: number;
  title: string;
  required: number;
  available: number;
  ok: boolean;
}

export interface InventoryCheck {
  orderId: number;
  allOk: boolean;
  items: InventoryItem[];
}

export interface UpdateItemsPayload {
  items: { productId: number; quantity: number; unitPrice?: number }[];
  notes?: string;
  buyerPhone?: string;
}

// Strip out undefined/empty values so we only send meaningful params.
function clean(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) out[k] = v;
  });
  return out;
}

export const distributionService = {
  getSellers: async (storeId: string): Promise<Seller[]> => {
    const { data } = await api.get<Seller[]>("/distribution/sellers", {
      params: { storeId },
    });
    return data;
  },

  getZones: async (storeId: string): Promise<Zone[]> => {
    const { data } = await api.get<Zone[]>("/distribution/zones", {
      params: { storeId },
    });
    return data;
  },

  getProducts: async (storeId: string): Promise<Product[]> => {
    const { data } = await api.get<Product[]>("/distribution/products", {
      params: { storeId },
    });
    return data;
  },

  getCustomers: async (storeId: string, search?: string): Promise<Customer[]> => {
    const { data } = await api.get<Customer[]>("/distribution/customers", {
      params: clean({ storeId, search }),
    });
    return data;
  },

  getOrders: async (
    storeId: string,
    filters: OrderFilters = {},
  ): Promise<DistOrder[]> => {
    const { data } = await api.get<DistOrder[]>("/distribution/orders", {
      params: { storeId, ...clean(filters) },
    });
    return data;
  },

  getRouting: async (storeId: string): Promise<RoutingGroup[]> => {
    const { data } = await api.get<RoutingGroup[]>(
      "/distribution/orders/routing",
      { params: { storeId } },
    );
    return data;
  },

  transition: async (
    storeId: string,
    id: number,
    to: DistOrderStatus,
    routeDate?: string,
  ): Promise<DistOrder> => {
    const { data } = await api.post<DistOrder>(
      `/distribution/orders/${id}/transition`,
      { to, routeDate },
      { params: { storeId } },
    );
    return data;
  },

  cancel: async (storeId: string, id: number): Promise<DistOrder> => {
    const { data } = await api.post<DistOrder>(
      `/distribution/orders/${id}/cancel`,
      {},
      { params: { storeId } },
    );
    return data;
  },

  updateItems: async (
    storeId: string,
    id: number,
    payload: UpdateItemsPayload,
  ): Promise<DistOrder> => {
    const { data } = await api.patch<DistOrder>(
      `/distribution/orders/${id}/items`,
      payload,
      { params: { storeId } },
    );
    return data;
  },

  setRouteDate: async (
    storeId: string,
    id: number,
    routeDate: string | null,
  ): Promise<DistOrder> => {
    const { data } = await api.patch<DistOrder>(
      `/distribution/orders/${id}/route-date`,
      { routeDate },
      { params: { storeId } },
    );
    return data;
  },

  getInventory: async (
    storeId: string,
    id: number,
  ): Promise<InventoryCheck> => {
    const { data } = await api.get<InventoryCheck>(
      `/distribution/orders/${id}/inventory`,
      { params: { storeId } },
    );
    return data;
  },

  assignRoute: async (
    storeId: string,
    orderIds: number[],
    routeDate?: string,
  ): Promise<{ updated: number }> => {
    const { data } = await api.post<{ updated: number }>(
      "/distribution/orders/routing/assign",
      { orderIds, routeDate },
      { params: { storeId } },
    );
    return data;
  },

  exportDownload: async (
    storeId: string,
    filters: OrderFilters = {},
  ): Promise<void> => {
    const response = await api.get("/distribution/orders/export", {
      params: { storeId, ...clean(filters) },
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type:
        response.headers?.["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "consolidado.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
