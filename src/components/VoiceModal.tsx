import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Mic, 
  Square, 
  Sparkles, 
  Save, 
  Edit3, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  User, 
  Package, 
  DollarSign, 
  CreditCard,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TransactionItem, TransactionType } from '../types';

export const VoiceModal: React.FC = () => {
  const { 
    voiceModalOpen, 
    setVoiceModalOpen, 
    addTransaction, 
    setSelectedReceipt, 
    profile, 
    customers 
  } = useStore();

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');

  // Structured AI Parsed Preview State
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [txType, setTxType] = useState<TransactionType>('sale');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'card' | 'credit' | 'split'>('cash');
  const [notes, setNotes] = useState<string>('');
  const [hasParsedCard, setHasParsedCard] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Web Speech API ref & real-time transcript ref to avoid stale closures
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const handleParseVoiceRef = useRef<((text: string) => void) | null>(null);

  const handleParseVoice = async (textToParse: string) => {
    if (!textToParse || textToParse.trim().length === 0) return;

    setIsParsing(true);
    setParseError('');

    try {
      const res = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechText: textToParse,
          language: 'Urdu',
          currency: profile.currency
        })
      });

      const data = await res.json();
      if (data.success && data.transaction) {
        const tx = data.transaction;
        setCustomerName(tx.customerName || 'Walk-in Customer');
        setCustomerPhone(tx.customerPhone || '');
        const type: TransactionType = tx.transactionType || 'sale';
        setTxType(type);

        const parsedItems = tx.items || [];
        setItems(parsedItems);

        // Accurate math calculation for items total vs totalAmount/paid/credit
        const itemsSum = parsedItems.reduce((sum: number, it: any) => {
          const itemPrice = Number(it.totalPrice) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0));
          return sum + itemPrice;
        }, 0);

        let total = Number(tx.totalAmount) || itemsSum || 0;
        let paid = Number(tx.paidAmount) || 0;
        let credit = Number(tx.creditAmount) || 0;

        if (type === 'sale') {
          if (itemsSum > 0 && total !== itemsSum) {
            total = itemsSum;
          }
          if (paid === 0 && credit === 0) {
            paid = total;
            credit = 0;
          } else if (paid > 0 && credit === 0 && total > paid) {
            credit = Math.max(0, total - paid);
          } else if (credit > 0 && paid === 0 && total > credit) {
            paid = Math.max(0, total - credit);
          } else {
            credit = Math.max(0, total - paid);
          }
        } else {
          // Debt payment received or Expense
          if (paid > 0) total = paid;
          credit = 0;
        }

        setTotalAmount(total);
        setPaidAmount(paid);
        setCreditAmount(credit);
        setPaymentMethod(tx.paymentMethod || 'cash');
        setNotes(tx.notes || '');
        setHasParsedCard(true);
      } else {
        throw new Error('Parsing failed');
      }
    } catch (err: any) {
      console.error('Failed to parse speech:', err);
      setParseError('AI speech parser offline or busy. You can edit fields manually below.');
      // Fallback preview
      setCustomerName('Walk-in Customer');
      setItems([{ name: 'General Grocery Goods', quantity: 1, unit: 'pcs', unitPrice: 10, totalPrice: 10 }]);
      setTotalAmount(10);
      setPaidAmount(10);
      setCreditAmount(0);
      setHasParsedCard(true);
    } finally {
      setIsParsing(false);
    }
  };

  // Synchronize ref on every render
  useEffect(() => {
    handleParseVoiceRef.current = handleParseVoice;
  });

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.lang = 'ur-PK'; // Always detect speech in Urdu

        recognition.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
          }
          transcriptRef.current = fullText;
          setTranscript(fullText);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          const currentText = transcriptRef.current.trim();
          if (currentText.length > 0 && handleParseVoiceRef.current) {
            handleParseVoiceRef.current(currentText);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = () => {
    setParseError('');
    setTranscript('');
    transcriptRef.current = '';
    setIsListening(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition start error:', e);
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition stop error:', e);
      }
    }
    const currentText = transcriptRef.current.trim();
    if (currentText.length > 0) {
      handleParseVoice(currentText);
    }
  };

  // Synchronized calculation handlers for manual editing
  const handleTotalChange = (val: number) => {
    const newTotal = Math.max(0, val);
    setTotalAmount(newTotal);
    setCreditAmount(Math.max(0, newTotal - paidAmount));
  };

  const handlePaidChange = (val: number) => {
    const newPaid = Math.max(0, val);
    setPaidAmount(newPaid);
    setCreditAmount(Math.max(0, totalAmount - newPaid));
  };

  const handleCreditChange = (val: number) => {
    const newCredit = Math.max(0, val);
    setCreditAmount(newCredit);
    setPaidAmount(Math.max(0, totalAmount - newCredit));
  };

  // Shortcut presets for instant testing (Urdu Speech)
  const presets = [
    {
      label: 'Ali Sale (Urdu Udhaar)',
      text: 'Ali ko 2 chawal ke bag aur 1 oil bottle bechi. Total 45 rupay. 20 naqad diye aur 25 udhaar.'
    },
    {
      label: 'Fatima Sale (Urdu Cash)',
      text: 'Fatima ne 5 olpers doodh aur 2 chai ke packet liye. Total 32 rupay naqad adaa kiye.'
    },
    {
      label: 'Debt Repayment (Urdu Debt)',
      text: 'Priya se purana 20 rupay ka udhaar vasool hua.'
    },
    {
      label: 'Shop Expense (Urdu Expense)',
      text: 'Dukan ke bijli ke bill aur bulb ke liye 15 rupay kharch kiye.'
    }
  ];

  const handleApplyPreset = (presetText: string) => {
    setTranscript(presetText);
    handleParseVoice(presetText);
  };

  const handleSaveTransaction = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const createdTx = await addTransaction({
        userId: profile.uid,
        customerName,
        customerPhone,
        type: txType,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        creditAmount: Number(creditAmount),
        paymentMethod,
        items,
        rawSpeech: transcript,
        notes
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });

      // Close voice modal and open digital receipt modal
      setVoiceModalOpen(false);
      setSelectedReceipt(createdTx);
    } catch (e) {
      console.error('Error saving transaction:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!voiceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto transition-all">
        {/* Close Button */}
        <button
          onClick={() => setVoiceModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-200/60 dark:border-emerald-800/60">
            <Mic className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            Urdu Voice AI Active
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Speak Your Transaction
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            VendorVoice automatically detects and parses your speech in Urdu into structured ledger entries.
          </p>
        </div>

        {/* Giant Mic Section */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing rings when listening */}
            {isListening && (
              <>
                <span className="absolute w-32 h-32 rounded-full bg-blue-500/20 animate-ping" />
                <span className="absolute w-28 h-28 rounded-full bg-blue-500/30 animate-pulse" />
              </>
            )}

            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all transform shadow-xl ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-600/40 scale-105'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-600/35 hover:scale-105 active:scale-95'
              }`}
            >
              {isListening ? (
                <>
                  <Square className="w-8 h-8 fill-white" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-9 h-9" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Tap to Talk</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1.5">
            {isListening ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" /> Listening... Speak now
              </span>
            ) : (
              'Tap microphone and describe sale or debt'
            )}
          </p>
        </div>

        {/* Live Transcription Box */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Voice Transcript / Speech Input
          </label>
          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder='e.g. "Ali ko do chawal ke bag aur ek tail ki bottle bechi, total 45 rupay. 20 naqad diye aur 25 udhaar."'
              className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
            />
            {transcript && (
              <button
                onClick={() => handleParseVoice(transcript)}
                disabled={isParsing}
                className="absolute bottom-2.5 right-2.5 px-3 py-1 bg-blue-600 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 hover:bg-blue-700 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {isParsing ? 'Parsing...' : 'Parse Speech'}
              </button>
            )}
          </div>
        </div>

        {/* Demo Shortcut Presets */}
        <div className="mt-3">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">
            Quick Test Presets (One-tap demo speech):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p.text)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-medium transition-colors border border-slate-200/60 dark:border-slate-700/60"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {isParsing && (
          <div className="my-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center flex flex-col items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              AI is extracting structured items, ledger balance & credit split...
            </p>
          </div>
        )}

        {/* Parse Error Notice */}
        {parseError && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{parseError}</p>
          </div>
        )}

        {/* AI Structured Preview Card */}
        {hasParsedCard && !isParsing && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                AI Ledger Preview Card
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Ready to Save
              </span>
            </div>

            {/* Customer & Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Customer Name
                </label>
                <div className="relative mt-1">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Transaction Type
                </label>
                <select
                  value={txType}
                  onChange={(e) => {
                    const newType = e.target.value as TransactionType;
                    setTxType(newType);
                    if (newType === 'payment_received' || newType === 'expense') {
                      setCreditAmount(0);
                      if (totalAmount > 0) setPaidAmount(totalAmount);
                    }
                  }}
                  className="w-full mt-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="sale">Sale (Goods Sold)</option>
                  <option value="payment_received">Debt Payment Received</option>
                  <option value="expense">Shop Expense</option>
                </select>
              </div>
            </div>

            {/* Extracted Items */}
            {txType === 'sale' && items.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Itemized Goods ({items.length})
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    Subtotal: {profile.currency}{items.reduce((s, it) => s + (Number(it.totalPrice) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0))), 0)}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {it.quantity} {it.unit || 'pcs'} x {it.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {profile.currency}{it.totalPrice || (it.quantity * it.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amount & Split Breakdown */}
            <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Total Bill</span>
                <input
                  type="number"
                  min={0}
                  value={totalAmount}
                  onChange={(e) => handleTotalChange(Number(e.target.value))}
                  className="w-full mt-0.5 font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                  Cash Paid
                </span>
                <input
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => handlePaidChange(Number(e.target.value))}
                  className="w-full mt-0.5 font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold text-amber-600 dark:text-amber-400">
                  Khata Credit
                </span>
                <input
                  type="number"
                  min={0}
                  value={creditAmount}
                  onChange={(e) => handleCreditChange(Number(e.target.value))}
                  className="w-full mt-0.5 font-bold text-xs text-amber-600 dark:text-amber-400 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Payment Mode:
              </span>
              <div className="flex flex-wrap gap-1">
                {(['cash', 'online', 'card', 'split'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                      paymentMethod === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleSaveTransaction}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving to Ledger...' : 'Save & Update Ledger'}
              </button>

              <button
                onClick={() => setHasParsedCard(false)}
                className="py-3 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Reset/Re-parse"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
