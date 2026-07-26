export type AppView = 
  | 'dashboard' 
  | 'record' 
  | 'customers' 
  | 'inventory' 
  | 'analytics' 
  | 'assistant' 
  | 'ocr' 
  | 'settings';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  businessName: string;
  currency: string;
  defaultProfitMargin?: number;
  phone?: string;
  address?: string;
  gstVatNumber?: string;
  logoUrl?: string;
  language: string;
  displayLanguage?: 'en';
  theme: 'light' | 'dark';
  hasSeenOnboarding?: boolean;
}

export type CreditRiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  outstandingBalance: number;
  totalPurchases: number;
  visitCount: number;
  creditRisk?: CreditRiskLevel;
  riskReason?: string;
  lastTransactionAt?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  unit: string;
  category: string;
  barcode?: string;
  supplier?: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface TransactionItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export type TransactionType = 'sale' | 'payment_received' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  type: TransactionType;
  totalAmount: number;
  paidAmount: number;
  creditAmount: number;
  paymentMethod: 'cash' | 'online' | 'card' | 'credit' | 'split';
  items: TransactionItem[];
  rawSpeech?: string;
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataCard?: any;
}

export interface ReceiptData {
  transaction: Transaction;
  businessName: string;
  currency: string;
  phone?: string;
}
