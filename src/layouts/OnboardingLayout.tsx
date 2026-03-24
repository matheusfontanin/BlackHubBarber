import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingLayout({ children, currentStep, totalSteps }: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header / Progress Bar */}
      <div className="fixed top-0 left-0 w-full z-50 bg-bg/80 backdrop-blur-md border-b border-primary/5">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-xl text-secondary">BarberFlow</span>
          </div>
          
          <div className="flex items-center gap-4 flex-1 max-w-xs ml-8">
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <span className="text-xs font-mono text-primary/50 whitespace-nowrap">
              Passo {currentStep} de {totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-primary/5">
        <div className="max-w-4xl mx-auto flex justify-center items-center gap-2 opacity-40">
          <span className="font-serif italic text-sm text-primary">BarberFlow</span>
          <span className="w-1 h-1 rounded-full bg-primary/50" />
          <p className="text-[10px] uppercase tracking-[0.2em]">Crafting Digital Experiences</p>
        </div>
      </footer>
    </div>
  );
}
