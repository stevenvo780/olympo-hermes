import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/utils/firebase';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  documentNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  birthDate?: string;
  loyaltyPoints: number;
  isActive: boolean;
  notes?: string;
  totalSpent: number;
  totalOrders: number;
  userId?: string;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCustomerData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'storeId' | 'totalSpent' | 'totalOrders'>;

export type UpdateCustomerData = Partial<CreateCustomerData>;

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  averageSpent: number;
}

export interface FindCustomersParams {
  limit?: number;
  page?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useCustomers(storeId: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prizma-hermes-kjopuery2a-uc.a.run.app';

  const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchCustomers = useCallback(async (params?: FindCustomersParams) => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();

      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/customer/store/${storeId}?${searchParams.toString()}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, API_BASE_URL]);

  const fetchStats = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/customer/store/${storeId}/stats`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching customer stats:', err);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/customer/store/${storeId}`, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          const customers = Array.isArray(data) ? data : [];
          
          const totalCustomers = customers.length;
          const activeCustomers = customers.filter((customer: Customer) => 
            customer.isActive && customer.totalOrders > 0
          ).length;
          const averageSpent = customers.length > 0 
            ? customers.reduce((sum: number, customer: Customer) => sum + customer.totalSpent, 0) / customers.length
            : 0;

          setStats({
            totalCustomers,
            activeCustomers,
            averageSpent,
          });
        }
      } catch (fallbackErr) {
        console.error('Error in fallback stats calculation:', fallbackErr);
      }
    }
  }, [storeId, API_BASE_URL]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && storeId) {
        fetchCustomers();
        fetchStats();
      }
    });

    return () => unsubscribe();
  }, [storeId, fetchCustomers, fetchStats]);

  const createCustomer = useCallback(async (customerData: CreateCustomerData) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...customerData, storeId }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const newCustomer = await response.json();
      setCustomers(prev => [newCustomer, ...prev]);
      return newCustomer;
    } catch (err) {
      console.error('Error creating customer:', err);
      throw err;
    }
  }, [storeId, API_BASE_URL]);

  const updateCustomer = useCallback(async (customerId: number, customerData: Partial<Customer>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer/${customerId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const updatedCustomer = await response.json();
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? updatedCustomer : customer
      ));
      return updatedCustomer;
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  }, [API_BASE_URL]);

  const deleteCustomer = useCallback(async (customerId: number) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer/${customerId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  }, [API_BASE_URL]);

  const updateLoyaltyPoints = useCallback(async (customerId: number, points: number) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer/${customerId}/store/${storeId}/loyalty-points`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ points }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const updatedCustomer = await response.json();
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? updatedCustomer : customer
      ));
      return updatedCustomer;
    } catch (err) {
      console.error('Error updating loyalty points:', err);
      throw err;
    }
  }, [storeId, API_BASE_URL]);

  const linkUserToCustomer = useCallback(async (customerId: number, userId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer/${customerId}/store/${storeId}/link-user`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const updatedCustomer = await response.json();
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? updatedCustomer : customer
      ));
      return updatedCustomer;
    } catch (err) {
      console.error('Error linking user to customer:', err);
      throw err;
    }
  }, [storeId, API_BASE_URL]);

  return {
    customers,
    stats,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateLoyaltyPoints,
    linkUserToCustomer,
    refetch: () => {
      fetchCustomers();
      fetchStats();
    },
  };
}
