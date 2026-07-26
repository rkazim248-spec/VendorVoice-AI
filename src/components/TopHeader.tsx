import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  Sparkles, 
  Globe, 
  Moon, 
  Sun, 
  ScanLine, 
  Bot, 
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';

interface TopHeaderProps {
  onOpenAuth: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenAuth }) => {
  const { profile, activeView, setActiveView, setOcrModalOpen, updateProfile } = useStore();
  const { user } = useAuth();

  const toggleTheme = () => {
    updateProfile({ theme: profile.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
        {/* Brand logo & Shop Name */}
        <div 
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none min-w-0 flex-1 sm:flex-initial"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight leading-none truncate max-w-[110px] xs:max-w-[160px] sm:max-w-none">
                {profile.businessName || 'VendorVoice AI'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">Cloud Voice Ledger • {profile.currency}</span>
            </p>
          </div>
        </div>

        {/* Quick Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* AI Assistant Chat Trigger */}
          <button
            onClick={() => setActiveView('assistant')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === 'assistant'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/60'
            }`}
            title="Ask AI Business Assistant"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>

          {/* OCR Scanner Trigger */}
          <button
            onClick={() => setOcrModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            title="Scan Paper Bill or Receipt"
          >
            <ScanLine className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {profile.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile / Auth Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 p-1.5 sm:pl-2.5 sm:pr-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-colors text-xs font-medium"
          >
            {user ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden xs:inline max-w-[60px] sm:max-w-[80px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              </>
            ) : (
              <>
                <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="hidden xs:inline">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
