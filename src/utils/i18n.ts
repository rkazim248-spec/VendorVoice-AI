export const translations = {
  en: {
    dashboard: "Dashboard",
    customers: "Khata / Customers",
    inventory: "Inventory",
    analytics: "Analytics",
    assistant: "AI Assistant",
    settings: "Settings",
    todaysSales: "Today's Sales",
    todaysProfit: "Today's Profit",
    pendingCredit: "Pending Credit",
    stockAlerts: "Stock Alerts",
    voiceSale: "New Voice Sale",
    recentTransactions: "Recent Transactions",
    addEntry: "+ Add Entry",
    aiAdvisor: "VendorVoice AI Smart Advisor",
    quickActions: "Quick Actions",
    scanBill: "Scan Bill / Receipt",
    manageKhata: "Manage Khata",
    checkStock: "Check Stock",
    estimated: "estimated",
  }
};

export type LanguageCode = 'en';

export function getTranslation(_lang: string | undefined, key: keyof typeof translations.en): string {
  return translations.en[key] || key;
}
