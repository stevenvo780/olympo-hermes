import api from '@/utils/axios';
import { User, Product, DeliveryZone, Tax } from '@/types';
import { Order } from '@/types/order';

export interface OrderItem {
  product: { id: number };
  quantity: number;
  unitPrice: number;
  finalPrice?: number;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'wompi' | 'bold' | 'credit';

export interface CreateOrderData {
  userId?: string;
  customerId?: number;
  items: OrderItem[];
  customAnswers: { question: string; answer: string }[];
  deliveryZoneId?: number;
  taxIds?: number[];
  paymentMethod?: PaymentMethod;
  creditDays?: number;
  notes?: string;
  status?: string;
  documents?: string[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

export interface ValidateOrderData {
  items: Array<{
    product: { id: number };
    quantity: number;
  }>;
  deliveryZoneId?: number;
  taxIds?: number[];
  store: { id: string };
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

export interface ValidateOrderResponse {
  items: Array<{
    productId: number;
    quantity: number;
    basePrice: number;
    unitPrice: number;
    finalPrice: number;
    totalPrice: number;
  }>;
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  delivery?: number;
  total: number;
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface FindUsersResponse {
  users: User[];
  total: number;
}

export class OrderService {
  static async validateOrder(data: ValidateOrderData): Promise<ValidateOrderResponse> {
    const response = await api.post('/orders/validate', data);
    return response.data;
  }

  static async createOrder(storeId: string, data: CreateOrderData): Promise<Order> {
    const orderData = {
      ...data,
      store: { id: storeId }
    };
    const response = await api.post('/orders', orderData);
    return response.data;
  }

  static async searchUsers(query: string, limit = 10): Promise<FindUsersResponse> {
    const response = await api.get('/user', {
      params: {
        search: query,
        limit,
        offset: 0
      }
    });
    return response.data;
  }

  static async searchCustomers(storeId: string, query: string): Promise<User[]> {
    const response = await api.get(`/customer/store/${storeId}`);
    const customers: User[] = response.data;
    
    if (!query || query.length < 2) {
      return customers;
    }

    const lowerQuery = query.toLowerCase();
    return customers.filter((customer: User) => {
      const name = (customer.name || '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      return name.includes(lowerQuery) || email.includes(lowerQuery);
    });
  }

  static async searchProducts(
    storeId: string, 
    query: string, 
    limit = 20,
    offset = 0
  ): Promise<PaginatedProductsResponse> {
    const response = await api.get(`/products/${storeId}`, {
      params: {
        text: query,
        limit,
        offset,
        exist: true
      }
    });
    return response.data;
  }

  static async getDeliveryZones(storeId: string): Promise<DeliveryZone[]> {
    const response = await api.get(`/delivery-zones/${storeId}`);
    return response.data;
  }

  static async getTaxes(storeId: string): Promise<Tax[]> {
    const response = await api.get(`/taxes/${storeId}`);
    return response.data;
  }

  static async createCustomer(storeId: string, data: {
    name: string;
    email?: string;
    phone?: string;
    documentNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    birthDate?: string;
    notes?: string;
    storeId: string;
  }): Promise<User> {
    const response = await api.post('/customer', data);
    return response.data;
  }
}
