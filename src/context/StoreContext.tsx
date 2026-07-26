import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';
import { Toast, ToastMessage } from '../components/Toast';
import { useAuth } from './AuthContext';
import i18n from '../lib/i18n';
import { 
  AppView, 
  Customer, 
  Product, 
  Transaction, 
  UserProfile 
} from '../types';

const defaultProfile: UserProfile = {
  uid: '',
  email: '',
  displayName: '',
  businessName: 'My Store',
  currency: '$',
  defaultProfitMargin: 28,
  language: 'English',
  displayLanguage: 'en',
  theme: 'light',
  hasSeenOnboarding: false
};

interface StoreContextType {
  profile: UserProfile;
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  selectedReceipt: Transaction | null;
  setSelectedReceipt: (t: Transaction | null) => void;
  voiceModalOpen: boolean;
  setVoiceModalOpen: (open: boolean) => void;
  ocrModalOpen: boolean;
  setOcrModalOpen: (open: boolean) => void;
  toast: ToastMessage | null;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>, options?: { silent?: boolean }) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (c: Customer, options?: { silent?: boolean }) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, 'id' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProfile: (p: Partial<UserProfile>) => Promise<void>;
  collectPayment: (customerId: string, amount: number, paymentMethod: 'cash' | 'online' | 'card', notes?: string) => Promise<Transaction>;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [ocrModalOpen, setOcrModalOpen] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = { id: 't_' + Date.now() + Math.random(), type, message };
    setToasts(prev => [...prev.slice(-2), newToast]);
  };

  const removeToast = (id?: string) => {
    if (!id) {
      setToasts([]);
    } else {
      setToasts(prev => prev.filter(t => t.id !== id));
    }
  };

  // Lock i18n framework language to English
  useEffect(() => {
    i18n.changeLanguage('en');
  }, []);

  // Initial demo seed data
  const sampleDemoCustomers: Customer[] = [
    {
      id: 'cust_ali',
      userId: 'demo_vendor_101',
      name: 'Ali Ahmed',
      phone: '+923001234567',
      outstandingBalance: 25,
      totalPurchases: 185,
      visitCount: 6,
      lastTransactionAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
      id: 'cust_fatima',
      userId: 'demo_vendor_101',
      name: 'Fatima Khan',
      phone: '+923009876543',
      outstandingBalance: 0,
      totalPurchases: 210,
      visitCount: 8,
      lastTransactionAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
    },
    {
      id: 'cust_priya',
      userId: 'demo_vendor_101',
      name: 'Priya Sharma',
      phone: '+923005551234',
      outstandingBalance: 40,
      totalPurchases: 120,
      visitCount: 4,
      lastTransactionAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
    }
  ];

  const sampleDemoProducts: Product[] = [
    {
      id: 'prod_rice',
      userId: 'demo_vendor_101',
      name: 'Basmati Rice (5kg)',
      category: 'Grains',
      costPrice: 12,
      price: 16,
      stock: 18,
      minStock: 5,
      unit: 'kg',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_oil',
      userId: 'demo_vendor_101',
      name: 'Cooking Oil (1L)',
      category: 'Oils',
      costPrice: 4,
      price: 6,
      stock: 24,
      minStock: 10,
      unit: 'bottle',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_milk',
      userId: 'demo_vendor_101',
      name: 'Dairy Milk & Drinks',
      category: 'Dairy',
      costPrice: 1.5,
      price: 2.5,
      stock: 4,
      minStock: 10,
      unit: 'pack',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_tea',
      userId: 'demo_vendor_101',
      name: 'Tea Packets (250g)',
      category: 'Beverages',
      costPrice: 3,
      price: 4.5,
      stock: 32,
      minStock: 8,
      unit: 'pcs',
      updatedAt: new Date().toISOString()
    }
  ];

  const sampleDemoTransactions: Transaction[] = [
    {
      id: 'tx_demo_1',
      userId: 'demo_vendor_101',
      type: 'sale',
      customerName: 'Ali Ahmed',
      customerId: 'cust_ali',
      totalAmount: 45,
      paidAmount: 20,
      creditAmount: 25,
      paymentMethod: 'split',
      rawSpeech: 'Ali ko 2 chawal ke bag aur 1 oil bottle bechi. Total 45. 20 naqad aur 25 udhaar.',
      items: [
        { name: 'Basmati Rice (5kg)', quantity: 2, unit: 'kg', unitPrice: 16, totalPrice: 32 },
        { name: 'Cooking Oil (1L)', quantity: 1, unit: 'bottle', unitPrice: 13, totalPrice: 13 }
      ],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      notes: 'Urdu voice sale parsed automatically'
    },
    {
      id: 'tx_demo_2',
      userId: 'demo_vendor_101',
      type: 'sale',
      customerName: 'Fatima Khan',
      customerId: 'cust_fatima',
      totalAmount: 32,
      paidAmount: 32,
      creditAmount: 0,
      paymentMethod: 'cash',
      rawSpeech: 'Fatima ne 5 doodh ke pack aur 2 chai ke dabba liye. Full cash paid.',
      items: [
        { name: 'Dairy Milk & Drinks', quantity: 5, unit: 'pack', unitPrice: 2.5, totalPrice: 12.5 },
        { name: 'Tea Packets (250g)', quantity: 2, unit: 'pcs', unitPrice: 4.5, totalPrice: 9 }
      ],
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      notes: 'Paid in full cash'
    }
  ];

  // Firestore Realtime Synchronization or Demo Mode Fallback
  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
      setCustomers([]);
      setProducts([]);
      setTransactions([]);
      setSelectedCustomer(null);
      setSelectedReceipt(null);
      return;
    }

    const userId = user.uid;

    // Handle Demo / Guest Mode locally
    if ((user as any).isDemo || userId.startsWith('demo_')) {
      const savedProfile = localStorage.getItem('vv_demo_profile');
      if (savedProfile) {
        try { setProfile(JSON.parse(savedProfile)); } catch (e) { setProfile(defaultProfile); }
      } else {
        setProfile({
          uid: userId,
          email: user.email || 'vendor@shop.com',
          displayName: user.displayName || 'Demo Vendor',
          businessName: 'VendorVoice Retail Shop',
          currency: '$',
          defaultProfitMargin: 28,
          language: 'English',
          displayLanguage: 'en',
          theme: 'light',
          hasSeenOnboarding: false
        });
      }

      const savedCust = localStorage.getItem('vv_demo_customers');
      setCustomers(savedCust ? JSON.parse(savedCust) : sampleDemoCustomers);

      const savedProd = localStorage.getItem('vv_demo_products');
      setProducts(savedProd ? JSON.parse(savedProd) : sampleDemoProducts);

      const savedTx = localStorage.getItem('vv_demo_transactions');
      setTransactions(savedTx ? JSON.parse(savedTx) : sampleDemoTransactions);

      return;
    }

    // 1. User Profile Listener
    const profileRef = doc(db, 'users', userId);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        const initialProfile: UserProfile = {
          uid: userId,
          email: user.email || '',
          displayName: user.displayName || 'Vendor',
          businessName: user.displayName ? `${user.displayName}'s Shop` : 'My Retail Shop',
          currency: '$',
          defaultProfitMargin: 28,
          language: 'English',
          displayLanguage: 'en',
          theme: 'light',
          hasSeenOnboarding: false
        };
        setDoc(profileRef, initialProfile, { merge: true }).catch(() => {});
        setProfile(initialProfile);
      }
    }, (error) => {
      console.warn('Firestore User profile error:', error);
    });

    // 2. Customers Listener
    const custRef = collection(db, 'users', userId, 'customers');
    const unsubCust = onSnapshot(custRef, (snap) => {
      const list: Customer[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Customer));
      setCustomers(list);
    }, (error) => {
      console.warn('Firestore Customers list error:', error);
    });

    // 3. Products Listener
    const prodRef = collection(db, 'users', userId, 'products');
    const unsubProd = onSnapshot(prodRef, (snap) => {
      const list: Product[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
      setProducts(list);
    }, (error) => {
      console.warn('Firestore Products list error:', error);
    });

    // 4. Transactions Listener
    const txRef = collection(db, 'users', userId, 'transactions');
    const qTx = query(txRef, orderBy('createdAt', 'desc'));
    const unsubTx = onSnapshot(qTx, (snap) => {
      const list: Transaction[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Transaction));
      setTransactions(list);
    }, (error) => {
      console.warn('Firestore Transactions list error:', error);
    });

    return () => {
      unsubProfile();
      unsubCust();
      unsubProd();
      unsubTx();
    };
  }, [user]);

  // Sync state to localStorage when in Demo mode
  useEffect(() => {
    if ((user as any)?.isDemo || user?.uid?.startsWith('demo_')) {
      try { localStorage.setItem('vv_demo_customers', JSON.stringify(customers)); } catch (e) {}
    }
  }, [customers, user]);

  useEffect(() => {
    if ((user as any)?.isDemo || user?.uid?.startsWith('demo_')) {
      try { localStorage.setItem('vv_demo_products', JSON.stringify(products)); } catch (e) {}
    }
  }, [products, user]);

  useEffect(() => {
    if ((user as any)?.isDemo || user?.uid?.startsWith('demo_')) {
      try { localStorage.setItem('vv_demo_transactions', JSON.stringify(transactions)); } catch (e) {}
    }
  }, [transactions, user]);

  useEffect(() => {
    if ((user as any)?.isDemo || user?.uid?.startsWith('demo_')) {
      try { localStorage.setItem('vv_demo_profile', JSON.stringify(profile)); } catch (e) {}
    }
  }, [profile, user]);

  const updateProfile = async (partial: Partial<UserProfile>) => {
    const updated = { ...profile, ...partial };
    setProfile(updated);

    if (user) {
      try {
        await firestoreService.saveUserProfile(user.uid, updated);
        showToast('Settings saved successfully');
      } catch (err) {
        showToast('Failed to update settings in cloud', 'error');
      }
    }
  };

  const addCustomer = async (cData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    if (!user) throw new Error('User authentication required');
    const newId = 'cust_' + Date.now();
    const newCust: Customer = {
      ...cData,
      id: newId,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    setCustomers(prev => [newCust, ...prev.filter(c => c.id !== newId)]);

    try {
      await firestoreService.saveCustomer(user.uid, newCust);
      showToast(`Added customer "${newCust.name}"`);
    } catch (err) {
      showToast('Saved customer locally (Cloud sync failed)', 'info');
    }

    return newCust;
  };

  const updateCustomer = async (cust: Customer, options?: { silent?: boolean }) => {
    if (!user) return;
    if (selectedCustomer && selectedCustomer.id === cust.id) {
      setSelectedCustomer(cust);
    }

    setCustomers(prev => prev.map(c => c.id === cust.id ? cust : c));

    try {
      await firestoreService.saveCustomer(user.uid, cust);
      if (!options?.silent) {
        showToast(`Updated customer "${cust.name}"`);
      }
    } catch (err) {
      if (!options?.silent) {
        showToast('Updated locally (Cloud sync failed)', 'info');
      }
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!user) return;
    const targetCust = customers.find(c => c.id === id);
    const name = targetCust ? targetCust.name : 'Customer';

    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer(null);
    }

    // Permanently clear balance in Firestore and local state first to prevent dirty metrics
    if (targetCust && targetCust.outstandingBalance > 0) {
      try {
        await firestoreService.saveCustomer(user.uid, {
          ...targetCust,
          outstandingBalance: 0
        });
      } catch (err) {
        // Fallback to deletion
      }
    }

    setCustomers(prev => prev.filter(c => c.id !== id));

    try {
      await firestoreService.deleteCustomer(user.uid, id);
      showToast(`Deleted customer "${name}" and cleared remaining balance`);
    } catch (err) {
      showToast('Deleted locally (Cloud sync failed)', 'info');
    }
  };

  const addProduct = async (pData: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> => {
    if (!user) throw new Error('User authentication required');
    const newId = 'prod_' + Date.now();
    const newProd: Product = {
      ...pData,
      id: newId,
      userId: user.uid,
      updatedAt: new Date().toISOString()
    };

    setProducts(prev => [newProd, ...prev.filter(p => p.id !== newId)]);

    try {
      await firestoreService.saveProduct(user.uid, newProd);
      showToast(`Added product "${newProd.name}"`);
    } catch (err) {
      showToast('Saved product locally (Cloud sync failed)', 'info');
    }

    return newProd;
  };

  const updateProduct = async (prod: Product) => {
    if (!user) return;
    const updated = { ...prod, updatedAt: new Date().toISOString() };
    setProducts(prev => prev.map(p => p.id === prod.id ? updated : p));

    try {
      await firestoreService.saveProduct(user.uid, updated);
      showToast(`Updated product "${prod.name}"`);
    } catch (err) {
      showToast('Updated locally (Cloud sync failed)', 'info');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    const targetProd = products.find(p => p.id === id);
    const name = targetProd ? targetProd.name : 'Product';

    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      await firestoreService.deleteProduct(user.uid, id);
      showToast(`Deleted product "${name}"`);
    } catch (err) {
      showToast('Deleted locally (Cloud sync failed)', 'info');
    }
  };

  const addTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    options?: { silent?: boolean }
  ): Promise<Transaction> => {
    if (!user) throw new Error('User authentication required');
    const txId = 'tx_' + Date.now();
    const nowStr = new Date().toISOString();
    const currentUserId = user.uid;

    // 1. Resolve customer
    let custId = txData.customerId;
    let custName = txData.customerName || 'Walk-in Customer';

    let custToUpdateInCloud: { id: string; newBalance: number; totalPurchases: number; visitCount: number; lastTxAt: string } | undefined = undefined;

    if (custName && custName !== 'Walk-in Customer' && custName !== 'Expense' && custName !== 'Shop Expense') {
      const existingCust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
      if (existingCust) {
        custId = existingCust.id;
        const newBal = (existingCust.outstandingBalance || 0) + (txData.creditAmount || 0);
        const updatedCust: Customer = {
          ...existingCust,
          outstandingBalance: Math.max(0, newBal),
          totalPurchases: (existingCust.totalPurchases || 0) + (txData.totalAmount || 0),
          visitCount: (existingCust.visitCount || 0) + 1,
          lastTransactionAt: nowStr
        };
        custToUpdateInCloud = {
          id: existingCust.id,
          newBalance: Math.max(0, newBal),
          totalPurchases: (existingCust.totalPurchases || 0) + (txData.totalAmount || 0),
          visitCount: (existingCust.visitCount || 0) + 1,
          lastTxAt: nowStr
        };
        setCustomers(prev => prev.map(c => c.id === existingCust.id ? updatedCust : c));
      } else {
        const newCust = await addCustomer({
          userId: currentUserId,
          name: custName,
          phone: txData.customerPhone || '',
          outstandingBalance: txData.creditAmount || 0,
          totalPurchases: txData.totalAmount || 0,
          visitCount: 1,
          creditRisk: txData.creditAmount > 0 ? 'Medium Risk' : 'Low Risk',
          riskReason: txData.creditAmount > 0 ? 'New customer with pending balance.' : 'New customer paid in full.'
        });
        custId = newCust.id;
      }
    }

    // 2. Inventory deduction
    const productDeductions: { id: string; newStock: number }[] = [];
    const deductedNames: string[] = [];

    if (txData.items && txData.items.length > 0 && txData.type === 'sale') {
      txData.items.forEach(item => {
        const matchingProd = products.find(p => 
          p.name.toLowerCase().includes(item.name.toLowerCase()) || 
          item.name.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchingProd) {
          const newStock = Math.max(0, matchingProd.stock - item.quantity);
          productDeductions.push({ id: matchingProd.id, newStock });
          deductedNames.push(`${matchingProd.name} (${matchingProd.stock} → ${newStock})`);
          setProducts(prev => prev.map(p => p.id === matchingProd.id ? { ...p, stock: newStock, updatedAt: nowStr } : p));
        }
      });
    }

    const newTx: Transaction = {
      ...txData,
      id: txId,
      customerId: custId,
      customerName: custName,
      userId: currentUserId,
      createdAt: nowStr
    };

    setTransactions(prev => [newTx, ...prev]);

    if (!options?.silent) {
      if (deductedNames.length > 0) {
        showToast(`Sale saved. Stock auto-deducted: ${deductedNames.join(', ')}`);
      } else {
        showToast('Transaction saved to ledger');
      }
    }

    try {
      await firestoreService.saveTransactionAtomic(user.uid, newTx, custToUpdateInCloud, productDeductions);
    } catch (err) {
      if (!options?.silent) {
        showToast('Saved locally (Cloud sync failed)', 'info');
      }
    }

    return newTx;
  };

  const collectPayment = async (
    customerId: string, 
    amount: number, 
    paymentMethod: 'cash' | 'online' | 'card',
    notes?: string
  ): Promise<Transaction> => {
    if (!user) throw new Error('User authentication required');
    const cust = customers.find(c => c.id === customerId);
    const custName = cust ? cust.name : 'Customer';

    if (cust) {
      const newBal = Math.max(0, cust.outstandingBalance - amount);
      await updateCustomer({
        ...cust,
        outstandingBalance: newBal,
        lastTransactionAt: new Date().toISOString()
      }, { silent: true });
    }

    const tx = await addTransaction({
      userId: user.uid,
      customerId: customerId,
      customerName: custName,
      type: 'payment_received',
      totalAmount: amount,
      paidAmount: amount,
      creditAmount: 0,
      paymentMethod: paymentMethod,
      items: [],
      notes: notes || `Collected debt payment of ${profile.currency}${amount} from ${custName}.`
    }, { silent: true });

    showToast(`Payment of ${profile.currency}${amount} collected from ${custName}`);
    return tx;
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const targetTx = transactions.find(t => t.id === id);
    const label = targetTx ? `${profile.currency}${targetTx.totalAmount.toFixed(2)} transaction` : 'Transaction';

    if (selectedReceipt && selectedReceipt.id === id) {
      setSelectedReceipt(null);
    }

    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      await firestoreService.deleteTransaction(user.uid, id);
      showToast(`Deleted ${label}`);
    } catch (err) {
      showToast('Deleted locally (Cloud sync failed)', 'info');
    }
  };

  return (
    <StoreContext.Provider value={{
      profile,
      customers,
      products,
      transactions,
      activeView,
      setActiveView,
      selectedCustomer,
      setSelectedCustomer,
      selectedReceipt,
      setSelectedReceipt,
      voiceModalOpen,
      setVoiceModalOpen,
      ocrModalOpen,
      setOcrModalOpen,
      toast: toasts.length > 0 ? toasts[toasts.length - 1] : null,
      toasts,
      showToast,
      addTransaction,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addProduct,
      updateProduct,
      deleteProduct,
      updateProfile,
      collectPayment,
      deleteTransaction
    }}>
      {children}
      <Toast toasts={toasts} onClose={removeToast} />
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

