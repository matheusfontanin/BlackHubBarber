import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import OnboardingLayout from '@/layouts/OnboardingLayout';
import { Scissors, MessageSquare, LayoutDashboard, ArrowRight, Loader2, Bot, Users as UsersIcon } from 'lucide-react';
import BarbershopInfoStep from '@/components/onboarding/BarbershopInfoStep';
import ServicesStep from '@/components/onboarding/ServicesStep';
import BusinessHoursStep from '@/components/onboarding/BusinessHoursStep';
import TeamStep from '@/components/onboarding/TeamStep';
import WhatsAppStep from '@/components/onboarding/WhatsAppStep';
import CalendarStep from '@/components/onboarding/CalendarStep';
import AiStep from '@/components/onboarding/AiStep';
import FinalStep from '@/components/onboarding/FinalStep';
import { saveOnboardingData, OnboardingData } from '@/services/onboardingService';
import type { BarbershopFormData, Service, DayHours, WhatsAppStepData, CalendarStepData } from '@/types/onboarding';
import type { TeamBarber } from '@/components/onboarding/TeamStep';
import type { AiStepData } from '@/components/onboarding/AiStep';

/*
  Fluxo expandido:
  1. Welcome
  2. Dados da Barbearia
  3. Serviços
  4. Horários
  5. Equipe (NOVO)
  6. WhatsApp
  7. Agenda / Calendar
  8. IA (NOVO)
  9. Finalização
*/

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 9;

  const nextStep = (data?: BarbershopFormData | Service[] | DayHours[] | WhatsAppStepData | CalendarStepData | TeamBarber[] | AiStepData) => {
    if (data) {
      setFormData(prev => {
        if (Array.isArray(data)) {
          if (data.length === 0) {
            // Could be empty team or services — check current step
            if (step === 5) return { ...prev, team: data as TeamBarber[] };
            return prev;
          }
          if ('duration' in data[0]) return { ...prev, services: data as Service[] };
          if ('isOpen' in data[0]) return { ...prev, businessHours: data as DayHours[] };
          if ('role' in data[0] && 'specialties' in data[0]) return { ...prev, team: data as TeamBarber[] };
        } else if (typeof data === 'object' && data !== null) {
          if ('ownerName' in data) return { ...prev, ...data as BarbershopFormData };
          if ('whatsappInstanceName' in data) return { ...prev, ...data as WhatsAppStepData };
          if ('googleCalendarConnected' in data) return { ...prev, ...data as CalendarStepData };
          if ('assistantName' in data) return { ...prev, aiSettings: data as AiStepData };
        }
        return prev;
      });
    }
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const result = await saveOnboardingData(formData as OnboardingData);
      if (result.success) {
        window.location.href = '/dashboard';
      } else {
        alert('Erro ao salvar dados. Tente novamente.');
      }
    } catch (error: unknown) {
      console.error('Erro no onboarding:', error);
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
            {/* Step 1: Welcome */}
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
                    Bem-vindo ao BlackHub Barber
                  </h1>
                  <p className="text-xl text-primary/60 max-w-lg mx-auto">
                    Vamos configurar sua barbearia em menos de 5 minutos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl">
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
                    <UsersIcon className="text-secondary mx-auto" size={24} />
                    <h3 className="font-bold text-primary">Gestão de Equipe</h3>
                    <p className="text-sm text-primary/50">Agenda individual por barbeiro com regras.</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-primary/5 space-y-3">
                    <LayoutDashboard className="text-secondary mx-auto" size={24} />
                    <h3 className="font-bold text-primary">Dashboard completo</h3>
                    <p className="text-sm text-primary/50">Métricas de faturamento e conversão.</p>
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

            {/* Step 2: Barbershop Info */}
            {step === 2 && (
              <BarbershopInfoStep onNext={nextStep} onBack={prevStep} />
            )}

            {/* Step 3: Services */}
            {step === 3 && (
              <ServicesStep onNext={(services) => nextStep(services)} onBack={prevStep} />
            )}

            {/* Step 4: Business Hours */}
            {step === 4 && (
              <BusinessHoursStep onNext={(businessHours) => nextStep(businessHours)} onBack={prevStep} />
            )}

            {/* Step 5: Team (NOVO) */}
            {step === 5 && (
              <TeamStep onNext={(barbers) => nextStep(barbers)} onBack={prevStep} />
            )}

            {/* Step 6: WhatsApp */}
            {step === 6 && (
              <WhatsAppStep
                phone={formData.phone}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {/* Step 7: Calendar */}
            {step === 7 && (
              <CalendarStep onNext={nextStep} onBack={prevStep} />
            )}

            {/* Step 8: AI (NOVO) */}
            {step === 8 && (
              <AiStep onNext={(aiData) => nextStep(aiData)} onBack={prevStep} />
            )}

            {/* Step 9: Final */}
            {step === 9 && (
              <FinalStep onComplete={handleComplete} onBack={prevStep} />
            )}
          </>
        )}
      </AnimatePresence>
    </OnboardingLayout>
  );
}
