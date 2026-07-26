import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Store, 
  Mic, 
  Users, 
  Package, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X 
} from 'lucide-react';

import heroImg from '../assets/images/vendor_voice_hero_1785073034523.jpg';
import voiceImg from '../assets/images/voice_mic_wave_1785074444408.jpg';
import khataImg from '../assets/images/khata_ledger_app_1785074462259.jpg';
import inventoryDeductionImg from '../assets/images/inventory_stock_deduction_1785075066149.jpg';
import analyticsImg from '../assets/images/shop_growth_success_1785074494855.jpg';
import readyImg from '../assets/images/ready_retail_store_1785075087779.jpg';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingWalkthrough: React.FC<OnboardingProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const steps = [
    {
      icon: Store,
      color: 'bg-blue-600 text-white',
      image: heroImg,
      title: t('walkthrough.step1Title', 'Welcome to VendorVoice AI'),
      subtitle: t('walkthrough.step1Subtitle', 'Your Intelligent Shop & Credit Assistant'),
      description: t('walkthrough.step1Desc', 'Run your retail shop effortlessly by speaking naturally. Track sales, manage customer credit (Khata), and control inventory in seconds.')
    },
    {
      icon: Mic,
      color: 'bg-amber-500 text-white',
      image: voiceImg,
      title: t('walkthrough.step2Title', 'Voice-Powered Sales Entry'),
      subtitle: t('walkthrough.step2Subtitle', 'Urdu Voice Speech Recognition'),
      description: t('walkthrough.step2Desc', 'Tap the single floating mic button and speak in Urdu (e.g., "Ali ko 2 chawal ke bag 45 rupay mein beche"). The AI parses items, prices, and customer balances automatically.')
    },
    {
      icon: Users,
      color: 'bg-indigo-600 text-white',
      image: khataImg,
      title: t('walkthrough.step3Title', 'Customers & Credit Ledger'),
      subtitle: t('walkthrough.step3Subtitle', 'Never Lose Track of Outstanding Debt'),
      description: t('walkthrough.step3Desc', 'Customer balances update automatically on credit sales. Easily view credit risk indicators, send receipts, and collect repayments with one tap.')
    },
    {
      icon: Package,
      color: 'bg-emerald-600 text-white',
      image: inventoryDeductionImg,
      title: t('walkthrough.step4Title', 'Automated Inventory & Stock Deduction'),
      subtitle: t('walkthrough.step4Subtitle', 'Real-time Stock Updates On Every Sale'),
      description: t('walkthrough.step4Desc', 'Verification Steps: When recording a sale with items matching your Inventory (e.g., Rice, Milk, Oil), VendorVoice automatically deducts sold quantities and displays instant stock deduction alerts.')
    },
    {
      icon: BarChart3,
      color: 'bg-purple-600 text-white',
      image: analyticsImg,
      title: t('walkthrough.step5Title', 'Analytics & AI Store Assistant'),
      subtitle: t('walkthrough.step5Subtitle', 'Ask Anything About Your Business'),
      description: t('walkthrough.step5Desc', 'View real-time profit, revenue, and credit charts. Chat with your AI Assistant to find answers like "Who owes me the most money?"')
    },
    {
      icon: CheckCircle2,
      color: 'bg-teal-600 text-white',
      image: readyImg,
      title: t('walkthrough.step6Title', "You're Ready to Roll!"),
      subtitle: t('walkthrough.step6Subtitle', 'Empower Your Business Today'),
      description: t('walkthrough.step6Desc', 'Your shop database is connected and synced to the cloud. Tap below to start exploring your dashboard.')
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-1 sm:p-2 overflow-y-auto max-h-[92vh] space-y-4 text-center my-auto">
        {/* Skip button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white transition-colors text-xs font-bold flex items-center gap-1 backdrop-blur-xs"
        >
          <span>Skip</span>
          <X className="w-4 h-4" />
        </button>

        {/* Feature Image Header if step has image */}
        {step.image ? (
          <div className="relative h-44 w-full overflow-hidden bg-slate-950">
            <img 
              src={step.image} 
              alt={step.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center shadow-lg shadow-blue-500/30 border-2 border-white dark:border-slate-900`}>
                <StepIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-6 flex justify-center">
            <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-lg shadow-blue-500/20`}>
              <StepIcon className="w-7 h-7" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 space-y-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
            Step {currentStep + 1} of {steps.length}
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {step.title}
          </h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {step.subtitle}
          </p>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1 max-w-md mx-auto">
            {step.description}
          </p>
        </div>

        {/* Step Dots */}
        <div className="flex justify-center items-center gap-1.5 pt-1">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep 
                  ? 'w-6 bg-blue-600 dark:bg-blue-500' 
                  : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            className="flex-1 max-w-[200px] ml-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
