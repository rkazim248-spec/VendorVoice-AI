import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext';
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ArrowUpRight, 
  Share2, 
  Receipt, 
  Mic, 
  Plus, 
  Users, 
  ScanLine, 
  Bot, 
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Trash2,
  BookOpen
} from 'lucide-react';
import { Transaction } from '../types';

import heroImg from '../assets/images/vendor_voice_hero_1785073034523.jpg';
import voiceImg from '../assets/images/voice_mic_wave_1785074444408.jpg';
import khataImg from '../assets/images/khata_ledger_app_1785074462259.jpg';
import ocrImg from '../assets/images/ocr_receipt_scan_1785074478649.jpg';
import readyImg from '../assets/images/ready_retail_store_1785075087779.jpg';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const { 
    profile, 
    transactions, 
    customers, 
    products, 
    setActiveView, 
    setVoiceModalOpen, 
    setOcrModalOpen, 
    setSelectedReceipt,
    setSelectedCustomer,
    deleteTransaction
  } = useStore();

  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [activeGuidanceTab, setActiveGuidanceTab] = useState<'voice' | 'khata' | 'ocr' | 'languages'>('voice');

  // Time based greeting
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const vendorName = profile.displayName || 'Shopkeeper';

  // Calculate Today's Totals
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayTx = transactions.filter(t => new Date(t.createdAt).getTime() >= todayStart);

  const todaySales = todayTx
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const todayExpenses = todayTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  // Estimated profit margin from profile setting minus expenses
  const marginRatio = (profile.defaultProfitMargin ?? 28) / 100;
  const todayProfit = Math.max(0, Math.round(todaySales * marginRatio - todayExpenses));

  // Pending total credit across all customers
  const totalPendingCredit = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

  // Low stock products count
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Fetch AI Insights on mount / transaction update
  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const res = await fetch('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeSummary: {
              todaySales,
              todayProfit,
              totalPendingCredit,
              lowStockCount: lowStockProducts.length,
              customerCount: customers.length,
              recentTxCount: todayTx.length
            }
          })
        });
        const data = await res.json();
        if (isMounted && data.insights) {
          setAiInsights(data.insights);
        }
      } catch (e) {
        if (isMounted) {
          setAiInsights([
            `Daily sales reaching ${profile.currency}${todaySales}. Dairy & Pantry items leading sales today.`,
            `Total pending customer credit is ${profile.currency}${totalPendingCredit}. Remind Ali & Fatima for timely collection.`,
            `${lowStockProducts.length} items running low on stock. Consider placing supplier orders soon.`
          ]);
        }
      } finally {
        if (isMounted) setLoadingInsights(false);
      }
    };

    fetchInsights();
    return () => { isMounted = false; };
  }, [transactions.length, customers.length]);

  const handleShareWhatsApp = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `*Receipt from ${profile.businessName}*\nDate: ${new Date(tx.createdAt).toLocaleDateString()}\nCustomer: ${tx.customerName}\nTotal Amount: ${profile.currency}${tx.totalAmount}\nAmount Paid: ${profile.currency}${tx.paidAmount}\nOutstanding Credit: ${profile.currency}${tx.creditAmount}\n\nThank you for shopping with us!`;
    const url = `https://wa.me/${tx.customerPhone ? tx.customerPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 rounded-3xl shadow-xl shadow-blue-600/20">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-100/90">
            {profile.businessName} • Daily Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 text-white drop-shadow-sm">
            {greetingTime}, {vendorName}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-50 font-medium mt-1 leading-relaxed">
            Speak natural voice commands to record sales, collect credit & track stock.
          </p>
        </div>

        <button
          onClick={() => setVoiceModalOpen(true)}
          className="self-start sm:self-center px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>New Voice Sale</span>
        </button>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Sales */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2.5 tracking-tight">
            {profile.currency}{todaySales.toFixed(2)}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            {todayTx.filter(t => t.type === 'sale').length} transactions
          </span>
        </div>

        {/* Today's Est. Profit */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Profit
            </span>
            <div className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2.5 tracking-tight">
            {profile.currency}{todayProfit.toFixed(2)}
          </p>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
            Net est. margin ({profile.defaultProfitMargin || 28}%)
          </span>
        </div>

        {/* Pending Credit (Khata Debt) */}
        <div 
          onClick={() => setActiveView('customers')}
          className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Credit
            </span>
            <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2.5 tracking-tight">
            {profile.currency}{totalPendingCredit.toFixed(2)}
          </p>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 mt-1">
            Collect from {customers.filter(c => c.outstandingBalance > 0).length} customers <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => setActiveView('inventory')}
          className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stock Alerts
            </span>
            <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2.5 tracking-tight">
            {lowStockProducts.length} Items
          </p>
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1 mt-1">
            Low stock reorder needed <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Feature Guidance & Professional Layout Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
        <div className="md:col-span-7 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">{t('dashboard.guidanceTitle', 'Feature Guidance & How-To')}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Master Your Retail Store with Voice & Automation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              VendorVoice handles your sales, customer khata credit balances, and inventory updates using Gemini Voice AI.
            </p>
          </div>

          {/* Guidance Sub-Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveGuidanceTab('voice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeGuidanceTab === 'voice' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              🎤 Voice Entry
            </button>
            <button
              onClick={() => setActiveGuidanceTab('khata')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeGuidanceTab === 'khata' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              📖 Khata Ledger
            </button>
            <button
              onClick={() => setActiveGuidanceTab('ocr')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeGuidanceTab === 'ocr' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              📄 Bill Scanner
            </button>
            <button
              onClick={() => setActiveGuidanceTab('languages')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeGuidanceTab === 'languages' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              🌐 Multilingual
            </button>
          </div>

          {/* Guidance Tab Content */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            {activeGuidanceTab === 'voice' && (
              <p>
                <strong className="text-blue-600 dark:text-blue-400">Pro Tip:</strong> Tap the floating mic button or press "Record Voice Sale". Speak e.g., <em>"Sold 2 bags of sugar to Ali for $10 on credit"</em>. AI will parse items and update Ali's Khata balance immediately.
              </p>
            )}
            {activeGuidanceTab === 'khata' && (
              <p>
                <strong className="text-amber-600 dark:text-amber-400">Khata Management:</strong> Customer debts update automatically. Go to <strong>Khata Debtors</strong> to send WhatsApp reminders or collect payments. Deleting a customer permanently clears their record and ledger balance.
              </p>
            )}
            {activeGuidanceTab === 'ocr' && (
              <p>
                <strong className="text-purple-600 dark:text-purple-400">Bill Scan (OCR):</strong> Upload or snap photos of supplier paper receipts. Gemini OCR extracts line items, quantities, and cost prices into your inventory.
              </p>
            )}
            {activeGuidanceTab === 'languages' && (
              <p>
                <strong className="text-indigo-600 dark:text-indigo-400">Multilingual Voice AI:</strong> Configure your preferred Voice AI & Display languages in Settings (English, Urdu, Hindi, Spanish, Arabic, Bengali, French).
              </p>
            )}
          </div>
        </div>

        {/* Feature Image Illustration */}
        <div className="md:col-span-5 relative min-h-[180px] md:min-h-full bg-slate-950 overflow-hidden flex items-center justify-center">
          <img 
            src={
              activeGuidanceTab === 'voice' ? voiceImg :
              activeGuidanceTab === 'khata' ? khataImg :
              activeGuidanceTab === 'ocr' ? ocrImg :
              readyImg
            } 
            alt="VendorVoice guidance banner" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900/60 via-transparent to-transparent" />
        </div>
      </div>

      {/* AI Smart Insights Card */}
      <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-100">
              VendorVoice AI Smart Advisor
            </h3>
          </div>
          {loadingInsights && <span className="text-xs text-blue-400 animate-pulse">Analyzing...</span>}
        </div>

        <div className="space-y-2">
          {aiInsights.length > 0 ? (
            aiInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                <p className="leading-relaxed">{insight}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">Loading AI shop advice based on today's transaction volume...</p>
          )}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setVoiceModalOpen(true)}
          className="p-3.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-2xl text-left transition-colors flex items-center gap-3 group"
        >
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-blue-900 dark:text-blue-100">Voice Sale</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-300">Speak transaction</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('customers')}
          className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-left transition-colors flex items-center gap-3 group"
        >
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-emerald-900 dark:text-emerald-100">Collect Payment</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-300">Clear khata debt</span>
          </div>
        </button>

        <button
          onClick={() => setOcrModalOpen(true)}
          className="p-3.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-2xl text-left transition-colors flex items-center gap-3 group"
        >
          <div className="p-2 bg-purple-600 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
            <ScanLine className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-purple-900 dark:text-purple-100">Scan Bill</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-300">OCR receipt import</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('assistant')}
          className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-left transition-colors flex items-center gap-3 group"
        >
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-bold text-indigo-900 dark:text-indigo-100">AI Assistant</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-300">Ask store questions</span>
          </div>
        </button>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Recent Transactions
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Live ledger entries recorded by voice or scan
            </p>
          </div>

          <button
            onClick={() => setVoiceModalOpen(true)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
          >
            + Add Entry
          </button>
        </div>

        <div className="space-y-2.5">
          {transactions.slice(0, 8).map((tx) => (
            <div
              key={tx.id}
              onClick={() => setSelectedReceipt(tx)}
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  tx.type === 'expense'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                    : tx.type === 'payment_received'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                    : tx.creditAmount > 0
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                }`}>
                  {tx.customerName ? tx.customerName[0].toUpperCase() : 'W'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">
                      {tx.customerName}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                      tx.type === 'expense'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        : tx.creditAmount > 0
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {tx.type === 'expense'
                        ? 'Expense'
                        : tx.type === 'payment_received'
                        ? 'Payment Received'
                        : tx.creditAmount > 0
                        ? `Credit ${profile.currency}${tx.creditAmount}`
                        : 'Paid'}
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {tx.items && tx.items.length > 0 
                      ? tx.items.map(i => `${i.quantity} ${i.name}`).join(', ') 
                      : tx.notes || 'General ledger entry'}
                  </p>

                  <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="text-right flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    {profile.currency}{tx.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 capitalize block">
                    {tx.paymentMethod}
                  </span>
                </div>

                {/* Action Buttons: WhatsApp Share & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleShareWhatsApp(tx, e)}
                    className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors shrink-0"
                    title="Share Receipt on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTxToDelete(tx);
                    }}
                    className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shrink-0"
                    title="Delete Transaction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Transaction?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete the entry for <span className="font-bold text-slate-900 dark:text-white">"{txToDelete.customerName || 'Walk-in Customer'}"</span> of <span className="font-bold text-slate-900 dark:text-white">{profile.currency}{txToDelete.totalAmount.toFixed(2)}</span>?
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(txToDelete.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Type / Method:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{txToDelete.type} ({txToDelete.paymentMethod})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = txToDelete.id;
                  setTxToDelete(null);
                  await deleteTransaction(targetId);
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
