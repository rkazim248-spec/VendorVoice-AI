import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        record: 'Record Voice',
        customers: 'Khata Debtors',
        inventory: 'Inventory',
        analytics: 'Analytics',
        assistant: 'AI Assistant',
        ocr: 'Scan Bill',
        settings: 'Settings'
      },
      dashboard: {
        title: 'VendorVoice Dashboard',
        subtitle: 'Smart voice-first bookkeeping & inventory manager',
        quickRecord: 'Record Voice Sale',
        todaySales: 'Today Sales',
        pendingCredit: 'Pending Khata',
        todayProfit: "Today's Profit",
        lowStock: 'Low Stock Alert',
        totalCustomers: 'Total Debtors',
        quickActions: 'Quick Actions',
        scanBill: 'Scan Bill (OCR)',
        askAi: 'Ask AI Assistant',
        addCustomer: 'Add Customer',
        recentTransactions: 'Recent Transactions',
        advisorTitle: 'VendorVoice AI Smart Advisor',
        guidanceTitle: 'Feature Guidance & How-To',
        deleteTxTitle: 'Delete Transaction?',
        confirmDeleteTx: 'Are you sure you want to delete this transaction entry?'
      },
      customers: {
        title: 'Khata Debtors & Customers',
        subtitle: 'Track customer balances, credit risk, and payment collections',
        callCustomer: 'Call Customer',
        whatsappReminder: 'WhatsApp Reminder',
        collectDebt: 'Collect Payment',
        addCustomer: 'Add New Customer',
        outstandingBalance: 'Outstanding Balance',
        deleteCustomer: 'Delete Customer',
        transactionHistory: 'Transaction History',
        clearBalanceNotice: 'This customer has an outstanding balance. Deleting will permanently clear their ledger record and balance.'
      },
      inventory: {
        title: 'Inventory & Stock Management',
        subtitle: 'Track product stock levels, cost prices, and margins',
        addProduct: 'Add New Product',
        voiceRestock: 'Voice Restock',
        deleteProduct: 'Delete Product',
        lowStock: 'Low Stock'
      },
      settings: {
        title: 'Store Settings & Preferences',
        subtitle: 'Configure business details, theme & cloud backup',
        businessProfile: 'Business Profile',
        appTheme: 'App Theme',
        cloudSync: 'Firebase Cloud Sync',
        replayWalkthrough: 'Replay Guided Tour'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
