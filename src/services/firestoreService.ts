import { 
  doc, 
  setDoc, 
  deleteDoc, 
  runTransaction,
  collection
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Customer, Product, Transaction, UserProfile } from '../types';

// Utility to recursively sanitize objects and remove any undefined values before sending to Firestore
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export const firestoreService = {
  async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      const ref = doc(db, 'users', userId);
      const cleanProfile = sanitizeForFirestore(profile);
      await setDoc(ref, cleanProfile, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      throw err;
    }
  },

  async saveCustomer(userId: string, customer: Customer): Promise<void> {
    try {
      const ref = doc(db, 'users', userId, 'customers', customer.id);
      const cleanCustomer = sanitizeForFirestore(customer);
      await setDoc(ref, cleanCustomer, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/customers/${customer.id}`);
      throw err;
    }
  },

  async deleteCustomer(userId: string, customerId: string): Promise<void> {
    try {
      const ref = doc(db, 'users', userId, 'customers', customerId);
      await deleteDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}/customers/${customerId}`);
      throw err;
    }
  },

  async saveProduct(userId: string, product: Product): Promise<void> {
    try {
      const ref = doc(db, 'users', userId, 'products', product.id);
      const cleanProduct = sanitizeForFirestore(product);
      await setDoc(ref, cleanProduct, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/products/${product.id}`);
      throw err;
    }
  },

  async deleteProduct(userId: string, productId: string): Promise<void> {
    try {
      const ref = doc(db, 'users', userId, 'products', productId);
      await deleteDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}/products/${productId}`);
      throw err;
    }
  },

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    try {
      const ref = doc(db, 'users', userId, 'transactions', transactionId);
      await deleteDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}/transactions/${transactionId}`);
      throw err;
    }
  },

  async saveTransactionAtomic(
    userId: string,
    tx: Transaction,
    customerUpdate?: { id: string; newBalance: number; totalPurchases: number; visitCount: number; lastTxAt: string },
    productStockDeductions?: { id: string; newStock: number }[]
  ): Promise<void> {
    const cleanTx = sanitizeForFirestore(tx);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Transaction doc ref
        const txRef = doc(db, 'users', userId, 'transactions', cleanTx.id);
        transaction.set(txRef, cleanTx);

        // 2. Customer update ref
        if (customerUpdate) {
          const custRef = doc(db, 'users', userId, 'customers', customerUpdate.id);
          const cleanCustUpdate = sanitizeForFirestore({
            outstandingBalance: customerUpdate.newBalance,
            totalPurchases: customerUpdate.totalPurchases,
            visitCount: customerUpdate.visitCount,
            lastTransactionAt: customerUpdate.lastTxAt
          });
          transaction.update(custRef, cleanCustUpdate);
        }

        // 3. Product stock deductions
        if (productStockDeductions && productStockDeductions.length > 0) {
          productStockDeductions.forEach(pDeduction => {
            const prodRef = doc(db, 'users', userId, 'products', pDeduction.id);
            transaction.update(prodRef, {
              stock: pDeduction.newStock,
              updatedAt: new Date().toISOString()
            });
          });
        }
      });
    } catch (err) {
      // If runTransaction fails (e.g. document doesn't exist yet for update), fallback to setDoc
      try {
        const txRef = doc(db, 'users', userId, 'transactions', cleanTx.id);
        await setDoc(txRef, cleanTx);
      } catch (fallbackErr) {
        handleFirestoreError(fallbackErr, OperationType.WRITE, `users/${userId}/transactions/${cleanTx.id}`);
        throw fallbackErr;
      }
    }
  }
};
