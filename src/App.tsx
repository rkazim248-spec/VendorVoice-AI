import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { FloatingMicButton } from './components/FloatingMicButton';
import { VoiceModal } from './components/VoiceModal';
import { OCRScannerModal } from './components/OCRScannerModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingWalkthrough } from './components/OnboardingWalkthrough';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AssistantChatView } from './components/AssistantChatView';
import { SettingsView } from './components/SettingsView';
import { Store, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { activeView, profile, updateProfile } = useStore();
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  // Apply dark theme class to document element and sync hint to localStorage
  useEffect(() => {
    const isDark = profile.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('vv_theme_hint', profile.theme);
    } catch (e) {
      // Ignore quota/private browsing issues
    }
  }, [profile.theme]);

  // Initial theme hint restore before profile loads
  useEffect(() => {
    try {
      const hint = localStorage.getItem('vv_theme_hint');
      if (hint === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Check onboarding flag on profile load
  useEffect(() => {
    if (user && profile.hasSeenOnboarding === false) {
      setOnboardingOpen(true);
    }
  }, [user, profile.hasSeenOnboarding]);

  const handleCloseOnboarding = async () => {
    setOnboardingOpen(false);
    if (profile.hasSeenOnboarding === false) {
      await updateProfile({ hasSeenOnboarding: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Connecting to VendorVoice Cloud...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200 overflow-x-hidden w-full max-w-full">
      {/* Top Header */}
      <TopHeader onOpenAuth={() => setAuthModalOpen(true)} />

      {/* Main View Router */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 sm:pb-32 w-full max-w-full min-w-0">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'customers' && <CustomersView />}
        {activeView === 'inventory' && <InventoryView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'assistant' && <AssistantChatView />}
        {activeView === 'settings' && (
          <SettingsView 
            onOpenAuth={() => setAuthModalOpen(true)} 
            onReplayWalkthrough={() => setOnboardingOpen(true)} 
          />
        )}
      </main>

      {/* Floating Microphone Button */}
      <FloatingMicButton />

      {/* Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Modals */}
      <VoiceModal />
      <OCRScannerModal />
      <ReceiptModal />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <OnboardingWalkthrough isOpen={onboardingOpen} onClose={handleCloseOnboarding} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <MainApp />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

