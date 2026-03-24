import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import OnboardingLayout from '@/layouts/OnboardingLayout';
import { Scissors, MessageSquare, LayoutDashboard, ArrowRight, Loader2 } from 'lucide-react';
import BarbershopInfoStep from '@/components/onboarding/BarbershopInfoStep';
import ServicesStep from '@/components/onboarding/ServicesStep';
import BusinessHoursStep from '@/components/onboarding/BusinessHoursStep';
import WhatsAppStep from '@/components/onboarding/WhatsAppStep';
import CalendarStep from '@/components/onboarding/CalendarStep';
import FinalStep from '@/components/onboarding/FinalStep';
import { saveOnboardingData } from '@/services/onboardingService';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 7;

  const nextStep = (data?: any) => {
    if (data) setFormData((prev: any) => ({ ...prev, ...data }));
    setStep(s => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const result = await saveOnboardingData(formData);
      if (result.success) {
        window.location.href = '/dashboard';
      } else {
        alert('Erro ao salvar dados. Verifique o console.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingLayout currentStep={step} totalSteps={totalSteps}>
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 space-y-4"
          >
            <Loader2 className="w-12 h-12 text-secondary animate-spin" />
            <h2 className="text-2xl font-serif italic">Configurando sua barbearia...</h2>
            <p className="text-primary/50 text-sm uppercase tracking-widest">Isso levará apenas alguns segundos.</p>
          </motion.div>
        ) : (
          <>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center text-center space-y-12 py-12"
              >
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary">
                    <Scissors size={40} />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-serif text-primary">
                    Bem-vindo ao BarberFlow
                  </h1>
                  <p className="text-xl text-primary/60 max-w-lg mx-auto">
                    Vamos configurar sua barbearia em menos de 5 minutos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl">
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-primary/5 space-y-3">
                    <Scissors className="text-secondary mx-auto" size={24} />
                    <h3 className="font-bold text-primary">Agenda automatizada</h3>
                    <p className="text-sm text-primary/50">Sincronização inteligente com Google Calendar.</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-primary/5 space-y-3">
                    <MessageSquare className="text-secondary mx-auto" size={24} />
                    <h3 className="font-bold text-primary">Atendimento com IA</h3>
                    <p className="text-sm text-primary/50">Sua IA atende e agenda via WhatsApp 24/7.</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-primary/5 space-y-3">
                    <LayoutDashboard className="text-secondary mx-auto" size={24} />
                    <h3 className="font-bold text-primary">Dashboard completo</h3>
                    <p className="text-sm text-primary/50">Métricas de faturamento e conversão em tempo real.</p>
                  </div>
                </div>

                <button
                  onClick={() => nextStep()}
                  className="group flex items-center gap-3 bg-secondary text-primary font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95"
                >
                  Começar configuração
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <BarbershopInfoStep onNext={nextStep} onBack={prevStep} />
            )}

            {step === 3 && (
              <ServicesStep onNext={nextStep} onBack={prevStep} />
            )}

            {step === 4 && (
              <BusinessHoursStep onNext={nextStep} onBack={prevStep} />
            )}

            {step === 5 && (
              <WhatsAppStep
                phone={formData.phone}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {step === 6 && (
              <CalendarStep onNext={nextStep} onBack={prevStep} />
            )}

            {step === 7 && (
              <FinalStep onComplete={handleComplete} onBack={prevStep} />
            )}
          </>
        )}
      </AnimatePresence>
    </OnboardingLayout>
  );
}
