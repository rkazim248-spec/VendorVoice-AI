import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Store, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    signInWithGoogle, 
    signInAsDemo
  } = useAuth();

  const handleDemoSignIn = () => {
    signInAsDemo();
    onClose();
  };
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (e: any) {
      if (e?.message?.includes('api-key-not-valid') || e?.message?.includes('API key') || e?.code === 'auth/api-key-not-valid') {
        signInAsDemo();
        onClose();
      } else {
        setErrorMsg(e.message || 'Google sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 text-center">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          <Store className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            VendorVoice AI
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sign in to access your Urdu voice ledger & store
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 text-left border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 shadow-sm hover:scale-[1.01] active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{loading ? 'Connecting...' : 'Sign In with Google'}</span>
          </button>

          <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">OR</span>
          </div>

          <button
            onClick={handleDemoSignIn}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Continue in Demo / Guest Mode</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Secured by Firebase Auth & Firestore Rules.
        </p>
      </div>
    </div>
  );
};


