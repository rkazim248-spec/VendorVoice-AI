import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext';
import { 
  LayoutDashboard, 
  Mic, 
  Users, 
  Package, 
  BarChart3, 
  Settings,
  Bot
} from 'lucide-react';
import { AppView } from '../types';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, setVoiceModalOpen } = useStore();
  const { t } = useTranslation();

  const navItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t('nav.dashboard', 'Home'), icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'customers', label: t('nav.customers', 'Customers'), icon: <Users className="w-5 h-5" /> },
    { id: 'inventory', label: t('nav.inventory', 'Inventory'), icon: <Package className="w-5 h-5" /> },
    { id: 'analytics', label: t('nav.analytics', 'Analytics'), icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: t('nav.settings', 'Settings'), icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-2 transition-colors shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-around relative">
        {/* Left items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[11px] mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}

        {/* Hero Center Record Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-600/35 border-4 border-slate-50 dark:border-slate-900 hover:scale-110 active:scale-95 transition-all group"
            title="Speak Transaction"
          >
            <Mic className="w-6 h-6 animate-pulse group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Right items */}
        {navItems.slice(2).map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[11px] mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
