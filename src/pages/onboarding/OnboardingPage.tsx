import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import OnboardingLayout from '@/layouts/OnboardingLayout';
import { Scissors, MessageSquare, LayoutDashboard, ArrowRight, Loader2, Users as UsersIcon } from 'lucide-react';
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

const FEATURES = [
  { icon: Scissors,       title: 'Agenda automatizada', desc: 'Sincronização com Google Calendar.' },
  { icon: MessageSquare,  title: 'Atendimento com IA',  desc: 'Sua IA atende via WhatsApp 24/7.' },
  { icon: UsersIcon,      title: 'Gestão de equipe',    desc: 'Agenda individual por barbeiro.' },
  { icon: LayoutDashboard,title: 'Dashboard completo',  desc: 'Métricas de faturamento e conversão.' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 9;

  const nextStep = (data?: BarbershopFormData | Service[] | DayHours[] | WhatsAppStepData | CalendarStepData | TeamBarber[] | AiStepData) => {
    if (data) {
      setFormData((prev) => {
        if (Array.isArray(data)) {
          if (data.length === 0) {
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
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

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
            <Loader2 className="w-10 h-10 text-[#BE9B64] animate-spin" />
            <h2 className="text-xl font-bold text-ink">Configurando sua barbearia...</h2>
            <p className="text-sm text-ink-soft">Isso levará apenas alguns segundos.</p>
          </motion.div>
        ) : (
          <>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center text-center space-y-10 py-10"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gold-soft rounded-2xl flex items-center justify-center mx-auto">
                    <Scissors size={30} className="text-gold-dark" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
                    Bem-vindo ao BlackHub Barber
                  </h1>
                  <p className="text-lg text-ink-soft max-w-lg mx-auto">
                    Vamos configurar sua barbearia em menos de 5 minutos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                  {FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="card p-5 text-center space-y-2.5">
                      <div className="w-10 h-10 bg-gold-soft rounded-xl flex items-center justify-center mx-auto">
                        <Icon size={18} className="text-gold-dark" />
                      </div>
                      <h3 className="font-bold text-ink text-sm">{title}</h3>
                      <p className="text-[12px] text-ink-soft">{desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => nextStep()}
                  className="btn-primary px-8 h-12 text-base gap-3"
                >
                  Começar configuração
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 2 && <BarbershopInfoStep onNext={nextStep} onBack={prevStep} />}
            {step === 3 && <ServicesStep onNext={(services) => nextStep(services)} onBack={prevStep} />}
            {step === 4 && <BusinessHoursStep onNext={(hours) => nextStep(hours)} onBack={prevStep} />}
            {step === 5 && <TeamStep onNext={(barbers) => nextStep(barbers)} onBack={prevStep} />}
            {step === 6 && <WhatsAppStep phone={formData.phone} onNext={nextStep} onBack={prevStep} />}
            {step === 7 && <CalendarStep onNext={nextStep} onBack={prevStep} />}
            {step === 8 && <AiStep onNext={(ai) => nextStep(ai)} onBack={prevStep} />}
            {step === 9 && <FinalStep onComplete={handleComplete} onBack={prevStep} />}
          </>
        )}
      </AnimatePresence>
    </OnboardingLayout>
  );
}
