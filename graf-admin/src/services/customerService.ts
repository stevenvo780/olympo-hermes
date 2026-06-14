import api from '@/utils/axios';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  userId?: string;
  storeId: string;
  loyaltyPoints: number;
  isActive: boolean;
  totalSpent: number;
  totalOrders: number;
  lastOrderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  averageSpent: number;
  totalRevenue: number;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  userId?: string;
  storeId: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
}

export interface CustomerExcelRow {
  email: string;
  name?: string;
  phone?: string;
  documentNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  action?: 'create' | 'update' | 'delete';
}

export interface ImportCustomersResponse {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  failed: number;
  results: {
    email: string;
    status: string;
    message: string;
    name?: string;
  }[];
}

export class CustomerService {
  static async getStoreCustomers(storeId: string): Promise<Customer[]> {
    const response = await api.get(`/customer/store/${storeId}`);
    return response.data;
  }

  static async getStoreCustomerStats(storeId: string): Promise<CustomerStats> {
    const response = await api.get(`/customer/store/${storeId}/stats`);
    return response.data;
  }

  static async getCustomerById(customerId: string): Promise<Customer> {
    const response = await api.get(`/customer/${customerId}`);
    return response.data;
  }

  static async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const response = await api.post('/customer', data);
    return response.data;
  }

  static async updateCustomer(customerId: string, data: UpdateCustomerData): Promise<Customer> {
    const response = await api.patch(`/customer/${customerId}`, data);
    return response.data;
  }

  static async deleteCustomer(customerId: string): Promise<void> {
    await api.delete(`/customer/${customerId}`);
  }

  static async exportCustomers(storeId: string, includeInactive = false): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }
    const response = await api.get(`/customer/store/${storeId}/export?${params.toString()}`);
    return response.data;
  }

  static async importCustomersFromExcel(
    storeId: string,
    rows: CustomerExcelRow[]
  ): Promise<ImportCustomersResponse> {
    const response = await api.post(`/customer/store/${storeId}/import`, { rows });
    return response.data;
  }

  static async exportCustomersToExcel(
    storeId: string, 
    startDate?: string, 
    endDate?: string, 
    limit = 20000
  ): Promise<Blob> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }

    const response = await api.get(`/customer/store/${storeId}/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }
}
