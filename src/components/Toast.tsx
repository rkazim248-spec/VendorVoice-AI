import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className={`p-3.5 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 ${
      toast.type === 'success'
        ? 'bg-emerald-600/95 text-white border-emerald-500'
        : toast.type === 'error'
        ? 'bg-rose-600/95 text-white border-rose-500'
        : 'bg-blue-600/95 text-white border-blue-500'
    }`}>
      {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
      {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
      {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 mt-0.5" />}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-tight">{toast.message}</p>
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastProps {
  toasts?: ToastMessage[];
  toast?: ToastMessage | null;
  onClose: (id?: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, toast, onClose }) => {
  const activeToasts = toasts && toasts.length > 0 
    ? toasts 
    : (toast ? [toast] : []);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 max-w-sm w-full space-y-2 pointer-events-none">
      {activeToasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onClose={(id) => onClose(id)} />
        </div>
      ))}
    </div>
  );
};

