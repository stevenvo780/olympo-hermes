import { useState, useEffect, useCallback } from 'react';
import { 
  CustomerService, 
  Customer, 
  CustomerStats, 
  CreateCustomerData, 
  UpdateCustomerData 
} from '@/services/customerService';

export const useCustomers = (storeId: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const customersData = await CustomerService.getStoreCustomers(storeId);
      setCustomers(customersData);

      try {
        const statsData = await CustomerService.getStoreCustomerStats(storeId);
        setStats(statsData);
      } catch (statsError) {
        console.warn('Error loading customer stats:', statsError);

      }

    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  const createCustomer = async (customerData: CreateCustomerData) => {
    try {
      const newCustomer = await CustomerService.createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);

      fetchCustomers();
      
      return newCustomer;
    } catch (err) {
      console.error('Error creating customer:', err);
      throw err;
    }
  };

  const updateCustomer = async (id: string, customerData: UpdateCustomerData) => {
    try {
      const updatedCustomer = await CustomerService.updateCustomer(id, customerData);
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? updatedCustomer : customer
        )
      );
      
      return updatedCustomer;
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await CustomerService.deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));

      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    stats,
    isLoading,
    error,
    refetch: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
