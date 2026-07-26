import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  Globe, 
  Moon, 
  Sun, 
  Database, 
  Download, 
  RotateCcw, 
  LogOut, 
  User, 
  ShieldCheck, 
  Languages, 
  Sparkles, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  FileText,
  Mic
} from 'lucide-react';

interface SettingsViewProps {
  onOpenAuth: () => void;
  onReplayWalkthrough?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuth, onReplayWalkthrough }) => {
  const { profile, updateProfile, customers, products, transactions } = useStore();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [businessName, setBusinessName] = useState<string>(profile.businessName || '');
  const [currency, setCurrency] = useState<string>(profile.currency || '£');
  const [phone, setPhone] = useState<string>(profile.phone || '');
  const [address, setAddress] = useState<string>(profile.address || '');
  const [gstVatNumber, setGstVatNumber] = useState<string>(profile.gstVatNumber || '');
  const [defaultProfitMargin, setDefaultProfitMargin] = useState<number>(profile.defaultProfitMargin || 28);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      businessName,
      currency,
      phone,
      address,
      gstVatNumber,
      defaultProfitMargin: Number(defaultProfitMargin) || 28
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportJSON = () => {
    const exportData = {
      profile,
      customers,
      products,
      transactions,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VendorVoice_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Store Settings & Backup
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure business details, currency, language, theme & cloud synchronization
        </p>
      </div>

      {/* Section 1: Business Profile Form */}
      <form onSubmit={handleSaveProfile} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Store className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Business Profile
            </h2>
          </div>

          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Shop / Vendor Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Currency Symbol
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="£">£ (Pound Sterling)</option>
              <option value="$">$ (US Dollar)</option>
              <option value="₹">₹ (Indian Rupee)</option>
              <option value="Rs">Rs (Pakistani Rupee)</option>
              <option value="৳">৳ (Bangladeshi Taka)</option>
              <option value="€">€ (Euro)</option>
              <option value="AED">AED (UAE Dirham)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Default Profit Margin %
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={defaultProfitMargin}
              onChange={(e) => setDefaultProfitMargin(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              GST / VAT Number
            </label>
            <input
              type="text"
              value={gstVatNumber}
              onChange={(e) => setGstVatNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Shop Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition-all"
        >
          Update Business Profile
        </button>
      </form>

      {/* Section 2: Appearance & Preferences */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <Globe className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Appearance & Language
          </h2>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">App Theme</span>
            <span className="text-slate-400">Switch between light mode and eye-safe dark canvas</span>
          </div>

          <button
            onClick={() => updateProfile({ theme: profile.theme === 'dark' ? 'light' : 'dark' })}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5"
          >
            {profile.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            <span className="capitalize">{profile.theme} Mode</span>
          </button>
        </div>

        {onReplayWalkthrough && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">App Guided Tour</span>
              <span className="text-slate-400">Replay the interactive onboarding walkthrough</span>
            </div>

            <button
              type="button"
              onClick={onReplayWalkthrough}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay Walkthrough
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Data Management & Backup */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Database className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Firebase Cloud Sync & Backup
          </h2>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Firebase Firestore Database</span>
            <span className="text-slate-400">Realtime database encryption and persistent cloud storage</span>
          </div>

          {user ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
              Not Signed In
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleExportJSON}
            className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Complete Store JSON Backup
          </button>
        </div>
      </div>

      {/* Section 4: Account & Auth */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
            <User className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Account Authentication
          </h2>
        </div>

        {user ? (
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Signed In As</span>
              <span className="text-slate-400">{user.email || user.displayName}</span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-amber-600 dark:text-amber-400 block">Unauthenticated</span>
              <span className="text-slate-400">Sign in to access your store cloud ledger</span>
            </div>

            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
