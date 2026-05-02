import { motion } from 'motion/react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingLayout({ children, currentStep, totalSteps }: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <div className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-line">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <span className="text-base font-bold text-ink tracking-tight shrink-0">BlackHub</span>

          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <div className="h-1.5 flex-1 bg-[#ECE8E3] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#BE9B64] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
            <span className="text-[11px] font-semibold text-ink-faint shrink-0 tabular-nums">
              {currentStep}/{totalSteps}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>

      <footer className="py-6 px-6 border-t border-line">
        <p className="text-center text-[11px] text-ink-faint uppercase tracking-wider">
          BlackHub Barber
        </p>
      </footer>
    </div>
  );
}
