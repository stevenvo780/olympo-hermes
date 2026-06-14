// Distribution endpoints client for the seller (vendedor) order-taking view.
// Uses the shared axios instance so auth (Firebase Bearer in production,
// x-api-key in the demo) and the loading/refresh interceptors are applied.
// Every distribution endpoint is auth-scoped and requires a ?storeId= query.

import api from '@/utils/axios';

export interface Seller {
  id: number;
  name: string;
  code: string;
}

export interface Zone {
  id: number;
  zone: string;
  isCarrier: boolean;
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
  zone?: Zone;
  addresses: CustomerAddress[];
}

export interface Product {
  id: number;
  title: string;
  sku: string;
  basePrice: number;
}

export interface CreatedOrder {
  id: number;
  distStatus: string;
  amount: { total: number };
  deliveryZone?: Zone;
}

export interface CreateCustomerAddressPayload {
  label: string;
  address: string;
  city?: string;
  phone?: string;
  contactName?: string;
  isDefault?: boolean;
}

export interface CreateCustomerPayload {
  name: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  deliveryZoneId?: number;
  addresses?: CreateCustomerAddressPayload[];
}

export interface CreateOrderPayload {
  sellerId: number;
  customerId: number;
  customerAddressId?: number;
  items: { productId: number; quantity: number; unitPrice?: number }[];
  notes?: string;
  buyerPhone?: string;
}

export const distributionService = {
  getSellers: async (storeId: string): Promise<Seller[]> => {
    const { data } = await api.get<Seller[]>('/distribution/sellers', {
      params: { storeId },
    });
    return data;
  },

  getZones: async (storeId: string): Promise<Zone[]> => {
    const { data } = await api.get<Zone[]>('/distribution/zones', {
      params: { storeId },
    });
    return data;
  },

  getProducts: async (storeId: string): Promise<Product[]> => {
    const { data } = await api.get<Product[]>('/distribution/products', {
      params: { storeId },
    });
    return data;
  },

  getCustomers: async (storeId: string, search?: string): Promise<Customer[]> => {
    const { data } = await api.get<Customer[]>('/distribution/customers', {
      params: { storeId, ...(search ? { search } : {}) },
    });
    return data;
  },

  createCustomer: async (
    storeId: string,
    payload: CreateCustomerPayload,
  ): Promise<Customer> => {
    const { data } = await api.post<Customer>('/distribution/customers', payload, {
      params: { storeId },
    });
    return data;
  },

  addAddress: async (
    storeId: string,
    customerId: number,
    payload: CreateCustomerAddressPayload,
  ): Promise<CustomerAddress> => {
    const { data } = await api.post<CustomerAddress>(
      `/distribution/customers/${customerId}/addresses`,
      payload,
      { params: { storeId } },
    );
    return data;
  },

  createOrder: async (
    storeId: string,
    payload: CreateOrderPayload,
  ): Promise<CreatedOrder> => {
    const { data } = await api.post<CreatedOrder>('/distribution/orders', payload, {
      params: { storeId },
    });
    return data;
  },
};
