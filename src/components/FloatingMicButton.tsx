import React from 'react';
import { useStore } from '../context/StoreContext';
import { Mic } from 'lucide-react';

export const FloatingMicButton: React.FC = () => {
  const { setVoiceModalOpen } = useStore();

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
      <button
        onClick={() => setVoiceModalOpen(true)}
        aria-label="Speech Entry"
        title="Speech Entry"
        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white/30 dark:border-slate-800/80 group relative"
      >
        <Mic className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </button>
    </div>
  );
};
