import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  ScanLine, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Camera, 
  AlertCircle,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const OCRScannerModal: React.FC = () => {
  const { ocrModalOpen, setOcrModalOpen, addTransaction, profile, customers, setSelectedReceipt } = useStore();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');

  if (!ocrModalOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        handleExecuteOCR(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecuteOCR = async (base64Img: string) => {
    setIsScanning(true);
    setScanError('');
    setScanResult(null);

    try {
      const res = await fetch('/api/ocr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Img })
      });

      const data = await res.json();
      if (data.success && data.data && data.data.items && data.data.items.length > 0) {
        setScanResult(data.data);
        setCustomerNameInput(data.data.vendorOrCustomerName || 'Walk-in Customer');
      } else {
        setScanError(data.error || 'No legible receipt items or totals found in this photo. Please upload a clear photo of paper bill.');
      }
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      setScanError('Could not parse receipt image. Please ensure photo is well lit and clear.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScannedTransaction = async () => {
    if (!scanResult) return;

    const finalCustomerName = customerNameInput.trim() || scanResult.vendorOrCustomerName || 'General Customer';

    const newTx = await addTransaction({
      userId: profile.uid,
      customerName: finalCustomerName,
      type: 'sale',
      totalAmount: scanResult.totalAmount || 0,
      paidAmount: scanResult.totalAmount || 0,
      creditAmount: 0,
      paymentMethod: 'cash',
      items: scanResult.items || [],
      notes: scanResult.notes || 'Imported via OCR Bill Scanner'
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });

    // Close scanner and open generated receipt
    setOcrModalOpen(false);
    if (newTx) {
      setSelectedReceipt(newTx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto space-y-4">
        {/* Close Button */}
        <button
          onClick={() => setOcrModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-2">
            <ScanLine className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            OCR Paper Bill Scanner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Snap paper receipts or invoices to auto-digitize line items & total bill
          </p>
        </div>

        {/* Upload & Image Box (Separated UI to prevent overlapping) */}
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-4 text-center bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center min-h-[140px]">
            {selectedImage ? (
              <div className="relative w-full max-h-44 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-950/5 p-1">
                <img src={selectedImage} alt="Scanned Receipt" className="max-h-40 object-contain rounded-xl" />
              </div>
            ) : (
              <div className="space-y-1.5 py-3">
                <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Take photo or select paper bill image
                </p>
                <span className="text-[11px] text-slate-400 block">Supports JPG, PNG paper receipts</span>
              </div>
            )}
          </div>

          {/* Action Upload / Change Image Button */}
          <div className="flex items-center justify-center gap-2">
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95">
              {selectedImage ? <RefreshCw className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{selectedImage ? 'Change Image' : 'Select Photo'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Scanning Spinner */}
        {isScanning && (
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-center flex items-center justify-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-900/50">
            <Sparkles className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
            <span>AI is reading items, prices & customer info from paper bill...</span>
          </div>
        )}

        {/* Unmatched / Error Alert */}
        {scanError && !isScanning && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs text-rose-800 dark:text-rose-200">
            <div className="flex items-start gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>Receipt Scan Warning</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
              {scanError}
            </p>
          </div>
        )}

        {/* Extracted Preview Result */}
        {scanResult && !isScanning && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Extracted Bill Details
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {scanResult.documentDate}
              </span>
            </div>

            {/* Editable Customer Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-purple-600" /> Customer / Supplier Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="Enter or confirm Customer Name"
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {customers.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setCustomerNameInput(e.target.value);
                    }}
                    defaultValue=""
                    className="px-2 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="" disabled>Select Existing</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Extracted Items */}
            {scanResult.items && scanResult.items.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Items Found ({scanResult.items.length})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {scanResult.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span>{it.quantity} x {it.name}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{profile.currency}{it.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total Bill Amount:</span>
              <span className="text-purple-600 dark:text-purple-400">{profile.currency}{scanResult.totalAmount}</span>
            </div>

            <button
              onClick={handleSaveScannedTransaction}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              Confirm & Save to Ledger & View Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
