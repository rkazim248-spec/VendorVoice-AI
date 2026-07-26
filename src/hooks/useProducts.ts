import { useStore } from '../context/StoreContext';

export function useProducts() {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    profile 
  } = useStore();

  const lowStockThreshold = 10;
  const lowStockProducts = products.filter(p => p.stock <= (p.minStock || lowStockThreshold));
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalValuation = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    lowStockProducts,
    outOfStockProducts,
    totalValuation,
    totalProductsCount: products.length,
    currency: profile.currency
  };
}
