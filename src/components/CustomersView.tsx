import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  DollarSign, 
  UserPlus, 
  Calendar, 
  ChevronRight, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer, CreditRiskLevel } from '../types';

export const CustomersView: React.FC = () => {
  const { t } = useTranslation();
  const { 
    customers, 
    transactions, 
    profile, 
    addCustomer, 
    updateCustomer,
    deleteCustomer,
    collectPayment, 
    selectedCustomer, 
    setSelectedCustomer,
    showToast
  } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showCollectModal, setShowCollectModal] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // New Customer Form State
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(0);

  // Collect Payment Form State
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'cash' | 'online' | 'card'>('cash');
  const [collectNotes, setCollectNotes] = useState<string>('');
  const [isCollecting, setIsCollecting] = useState<boolean>(false);

  // AI Credit Risk Assessment State
  const [assessingRisk, setAssessingRisk] = useState<boolean>(false);
  const [riskAssessment, setRiskAssessment] = useState<{ risk: CreditRiskLevel; explanation: string } | null>(null);

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.phone && c.phone.includes(searchQuery));
    if (!matchesSearch) return false;

    if (filterRisk === 'has_balance') return c.outstandingBalance > 0;
    if (filterRisk === 'High Risk') return c.creditRisk === 'High Risk';
    if (filterRisk === 'Medium Risk') return c.creditRisk === 'Medium Risk';
    if (filterRisk === 'Low Risk') return c.creditRisk === 'Low Risk';

    return true;
  });

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (editingCustomer) {
      const updated = {
        ...editingCustomer,
        name: newName,
        phone: newPhone,
        outstandingBalance: Number(newOpeningBalance) || 0
      };
      await updateCustomer(updated);
      setEditingCustomer(null);
    } else {
      await addCustomer({
        userId: profile.uid,
        name: newName,
        phone: newPhone,
        outstandingBalance: Number(newOpeningBalance) || 0,
        totalPurchases: Number(newOpeningBalance) || 0,
        visitCount: newOpeningBalance > 0 ? 1 : 0,
        creditRisk: newOpeningBalance > 50 ? 'High Risk' : newOpeningBalance > 0 ? 'Medium Risk' : 'Low Risk',
        riskReason: newOpeningBalance > 0 ? 'Initial opening debt recorded.' : 'New customer registered.'
      });
      setShowAddModal(false);
    }

    setNewName('');
    setNewPhone('');
    setNewOpeningBalance(0);
  };

  const handleAssessCreditRisk = async (cust: Customer) => {
    setAssessingRisk(true);
    try {
      const custTx = transactions.filter(t => t.customerId === cust.id || t.customerName.toLowerCase() === cust.name.toLowerCase());
      const res = await fetch('/api/credit-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: cust.name,
          balance: cust.outstandingBalance,
          totalPurchases: cust.totalPurchases,
          visitCount: cust.visitCount,
          transactionHistory: custTx.slice(0, 5)
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setRiskAssessment(data.result);
      }
    } catch (e) {
      setRiskAssessment({
        risk: cust.outstandingBalance > 50 ? 'High Risk' : cust.outstandingBalance > 0 ? 'Medium Risk' : 'Low Risk',
        explanation: 'Regular buyer. AI recommends keeping credit under limit.'
      });
    } finally {
      setAssessingRisk(false);
    }
  };

  const handleOpenCustomerDetail = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCollectAmount(cust.outstandingBalance || 0);
    handleAssessCreditRisk(cust);
  };

  const handleCollectPaymentSubmit = async () => {
    if (!selectedCustomer || collectAmount <= 0 || isCollecting) return;
    setIsCollecting(true);

    try {
      await collectPayment(selectedCustomer.id, Number(collectAmount), collectMethod, collectNotes);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setShowCollectModal(false);
    } catch (e) {
      console.error('Failed to collect payment:', e);
    } finally {
      setIsCollecting(false);
    }
  };

  const handleOpenWhatsAppReminder = (cust: Customer) => {
    const text = `Hello ${cust.name}, hope you are doing well!\nThis is a friendly reminder regarding your pending balance of *${profile.currency}${cust.outstandingBalance}* at *${profile.businessName}*.\n\nPlease clear it at your earliest convenience. Thank you!`;
    const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Customer Khata & Credit Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track customer balances, credit risk ratings & send WhatsApp reminders
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer by name or phone..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Customers' },
            { id: 'has_balance', label: 'Has Debt/Balance' },
            { id: 'Low Risk', label: 'Low Risk' },
            { id: 'Medium Risk', label: 'Medium Risk' },
            { id: 'High Risk', label: 'High Risk' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterRisk(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterRisk === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredCustomers.map(cust => (
          <div
            key={cust.id}
            onClick={() => handleOpenCustomerDetail(cust)}
            className="p-4 sm:p-4.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer hover:scale-[1.01] flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                {cust.avatarUrl ? (
                  <img
                    src={cust.avatarUrl}
                    alt={cust.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                    {cust.name[0].toUpperCase()}
                  </div>
                )}

                {/* Risk Indicator Dot */}
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  cust.creditRisk === 'High Risk'
                    ? 'bg-rose-500'
                    : cust.creditRisk === 'Medium Risk'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {cust.name}
                </h3>
                {cust.phone ? (
                  <a
                    href={`tel:${cust.phone.replace(/[^0-9+]/g, '') || cust.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1 mt-0.5"
                    title={`Call ${cust.name}`}
                  >
                    <Phone className="w-3 h-3 shrink-0" />
                    {cust.phone}
                  </a>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No phone recorded
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cust.creditRisk === 'High Risk'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                      : cust.creditRisk === 'Medium Risk'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {cust.creditRisk || 'Low Risk'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cust.visitCount} visits
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Outstanding
              </span>
              <span className={`text-base font-extrabold ${
                cust.outstandingBalance > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {profile.currency}{cust.outstandingBalance.toFixed(2)}
              </span>

              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-end gap-0.5 mt-1 group-hover:translate-x-1 transition-transform">
                View Khata <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">Try searching another name or add a new customer.</p>
          </div>
        )}
      </div>

      {/* Customer Profile Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                {selectedCustomer.name[0].toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedCustomer.name}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {selectedCustomer.phone ? (
                    <a
                      href={`tel:${selectedCustomer.phone.replace(/[^0-9+]/g, '') || selectedCustomer.phone}`}
                      className="hover:underline font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {selectedCustomer.phone}
                    </a>
                  ) : (
                    <span>No phone recorded</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total Purchases: {profile.currency}{selectedCustomer.totalPurchases} • {selectedCustomer.visitCount} visits
                </p>
              </div>
            </div>

            {/* Outstanding Balance Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] font-semibold text-amber-100 uppercase tracking-wider block">
                  Pending Khata Debt Balance
                </span>
                <span className="text-2xl font-extrabold mt-0.5 block">
                  {profile.currency}{selectedCustomer.outstandingBalance.toFixed(2)}
                </span>
              </div>

              {selectedCustomer.outstandingBalance > 0 && (
                <button
                  onClick={() => setShowCollectModal(true)}
                  className="px-4 py-2 bg-white text-orange-700 hover:bg-amber-50 font-extrabold rounded-xl text-xs shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  Collect Payment
                </button>
              )}
            </div>

            {/* AI Credit Risk Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  AI Credit Risk Assessment Engine
                </span>

                {assessingRisk ? (
                  <span className="text-[11px] font-semibold text-blue-500 animate-pulse">Evaluating...</span>
                ) : (
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    riskAssessment?.risk === 'High Risk' || selectedCustomer.creditRisk === 'High Risk'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {riskAssessment?.risk || selectedCustomer.creditRisk || 'Low Risk'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {riskAssessment?.explanation || selectedCustomer.riskReason || 'Analyzed repayment patterns against order volume.'}
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 gap-2">
              {selectedCustomer.phone && (
                <a
                  href={`tel:${selectedCustomer.phone.replace(/[^0-9+]/g, '') || selectedCustomer.phone}`}
                  className="py-2.5 px-3 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-blue-200/60 dark:border-blue-800/60"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {t('customers.callCustomer', 'Call Customer')}
                </a>
              )}

              <button
                onClick={() => handleOpenWhatsAppReminder(selectedCustomer)}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp Reminder
              </button>
            </div>

            {/* Edit & Delete Customer Options */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(selectedCustomer);
                  setNewName(selectedCustomer.name);
                  setNewPhone(selectedCustomer.phone || '');
                  setNewOpeningBalance(selectedCustomer.outstandingBalance || 0);
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Edit Customer Details
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedCustomer.outstandingBalance > 0) {
                    showToast(`Cannot delete customer "${selectedCustomer.name}" because they have a pending balance of ${profile.currency}${selectedCustomer.outstandingBalance.toFixed(2)}. Please clear or settle balance first.`, 'error');
                    return;
                  }
                  setCustomerToDelete(selectedCustomer);
                }}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Delete Customer
              </button>
            </div>

            {/* Customer Transaction Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Transaction History Timeline
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {transactions
                  .filter(t => t.customerId === selectedCustomer.id || t.customerName.toLowerCase() === selectedCustomer.name.toLowerCase())
                  .map(t => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {t.type === 'payment_received' ? 'Debt Payment Cleared' : 'Sale Transaction'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()} • {t.paymentMethod}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {profile.currency}{t.totalAmount}
                        </span>
                        {t.creditAmount > 0 && (
                          <span className="text-[10px] font-semibold text-amber-600">
                            Credit +{profile.currency}{t.creditAmount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showCollectModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Collect Payment from {selectedCustomer.name}
              </h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Amount Collected ({profile.currency})
              </label>
              <input
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['cash', 'online', 'card'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCollectMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                      collectMethod === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCollectPaymentSubmit}
              disabled={isCollecting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {isCollecting ? 'Recording Payment...' : 'Confirm Payment & Update Khata'}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <form onSubmit={handleSaveCustomer} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ali Khan"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number (Optional)</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. +44 7890 112233"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Initial Balance ({profile.currency})</label>
              <input
                type="number"
                value={newOpeningBalance}
                onChange={(e) => setNewOpeningBalance(Number(e.target.value))}
                placeholder="0"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              Save Customer
            </button>
          </form>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('customers.deleteCustomer', 'Delete Customer?')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{customerToDelete.name}"</span>?
              </p>
              {customerToDelete.outstandingBalance > 0 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-semibold text-left mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1 shrink-0" />
                  <span>This customer has an outstanding debt of <strong className="underline">{profile.currency}{customerToDelete.outstandingBalance.toFixed(2)}</strong>. Deleting will permanently clear this balance and remove their ledger history.</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = customerToDelete.id;
                  setCustomerToDelete(null);
                  setSelectedCustomer(null);
                  await deleteCustomer(targetId);
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                Yes, Clear & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
