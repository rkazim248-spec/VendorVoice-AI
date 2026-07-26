import React from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Share2, 
  Download, 
  Printer, 
  CheckCircle2, 
  Store, 
  Calendar, 
  User, 
  DollarSign, 
  QrCode 
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Transaction } from '../types';

export const ReceiptModal: React.FC = () => {
  const { selectedReceipt, setSelectedReceipt, profile } = useStore();

  if (!selectedReceipt) return null;

  const tx = selectedReceipt;
  const isPaid = tx.creditAmount === 0;

  const handleShareWhatsApp = () => {
    let itemSummary = tx.items && tx.items.length > 0
      ? tx.items.map(i => `• ${i.quantity} x ${i.name} (${profile.currency}${i.totalPrice})`).join('\n')
      : `• ${tx.notes || 'General ledger purchase'}`;

    const text = `*DIGITAL RECEIPT - ${profile.businessName}*\n----------------------------------------\nReceipt ID: #${tx.id}\nDate: ${new Date(tx.createdAt).toLocaleString()}\nCustomer: ${tx.customerName}\n\n*Items Purchased:*\n${itemSummary}\n----------------------------------------\n*Total Amount: ${profile.currency}${tx.totalAmount}*\nAmount Paid: ${profile.currency}${tx.paidAmount}\nPending Khata Credit: ${profile.currency}${tx.creditAmount}\nPayment Mode: ${tx.paymentMethod.toUpperCase()}\n----------------------------------------\nThank you for shopping with ${profile.businessName}!`;

    const cleanPhone = tx.customerPhone ? tx.customerPhone.replace(/\D/g, '') : '';
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(profile.businessName, 20, 20);

    doc.setFontSize(10);
    doc.text(`Receipt ID: #${tx.id}`, 20, 30);
    doc.text(`Date: ${new Date(tx.createdAt).toLocaleString()}`, 20, 36);
    doc.text(`Customer: ${tx.customerName}`, 20, 42);

    doc.text('----------------------------------------------------', 20, 50);

    let y = 58;
    doc.setFontSize(11);
    doc.text('Items / Description', 20, y);
    doc.text('Amount', 150, y);
    y += 8;

    if (tx.items && tx.items.length > 0) {
      tx.items.forEach(it => {
        doc.setFontSize(10);
        doc.text(`${it.quantity} x ${it.name}`, 20, y);
        doc.text(`${profile.currency}${it.totalPrice}`, 150, y);
        y += 6;
      });
    } else {
      doc.setFontSize(10);
      doc.text(tx.notes || 'Ledger purchase', 20, y);
      doc.text(`${profile.currency}${tx.totalAmount}`, 150, y);
      y += 6;
    }

    y += 6;
    doc.text('----------------------------------------------------', 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(`Total Amount: ${profile.currency}${tx.totalAmount}`, 20, y);
    y += 6;
    doc.text(`Amount Paid: ${profile.currency}${tx.paidAmount}`, 20, y);
    y += 6;
    doc.text(`Pending Credit: ${profile.currency}${tx.creditAmount}`, 20, y);

    doc.save(`Receipt_${tx.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto space-y-4">
        {/* Prominent Modal Header with Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Receipt Preview
            </span>
          </div>

          <button
            onClick={() => setSelectedReceipt(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-200/80 dark:border-slate-700 shadow-xs"
            title="Close Receipt"
            aria-label="Close Receipt Preview"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital Receipt Card */}
        <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg space-y-4 relative overflow-hidden">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
              <Store className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {profile.businessName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {profile.address || 'Market District Store'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Receipt #{tx.id} • {new Date(tx.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Customer Metadata */}
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Customer:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{tx.customerName}</span>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2 py-2 border-y border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Purchased Items
            </span>

            {tx.items && tx.items.length > 0 ? (
              tx.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span>{it.quantity} {it.unit} x {it.name}</span>
                  <span>{profile.currency}{it.totalPrice}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                {tx.notes || 'General ledger transaction'}
              </p>
            )}
          </div>

          {/* Financial Totals */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Subtotal:</span>
              <span className="font-bold">{profile.currency}{tx.totalAmount}</span>
            </div>

            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Amount Paid ({tx.paymentMethod}):</span>
              <span>{profile.currency}{tx.paidAmount}</span>
            </div>

            {tx.creditAmount > 0 && (
              <div className="flex justify-between text-xs text-amber-600 font-extrabold bg-amber-50 dark:bg-amber-950/60 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                <span>Pending Khata Credit:</span>
                <span>{profile.currency}{tx.creditAmount}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-300 dark:border-slate-700">
              <span>TOTAL</span>
              <span>{profile.currency}{tx.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* QR Code Verification Simulation */}
          <div className="pt-3 text-center border-t border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
            <QrCode className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] text-slate-400 mt-1">Verified Digital Voice Ledger Entry</span>
          </div>
        </div>

        {/* Share & Download Actions */}
        <div className="space-y-2">
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Send Receipt on WhatsApp
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPDF}
              className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>

            <button
              onClick={() => window.print()}
              className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
          </div>

          <button
            onClick={() => setSelectedReceipt(null)}
            className="w-full py-2.5 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mt-1"
          >
            <X className="w-3.5 h-3.5" />
            Close & Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
