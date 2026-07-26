import { useStore } from '../context/StoreContext';

export function useCustomers() {
  const { 
    customers, 
    selectedCustomer, 
    setSelectedCustomer, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    collectPayment 
  } = useStore();

  return {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    collectPayment,
    totalOutstandingBalance: customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0),
    totalCustomersCount: customers.length
  };
}
