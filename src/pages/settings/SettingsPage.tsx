import { useState } from 'react';
import { motion } from 'motion/react';
import { Building, Users, CalendarClock, Bot, Link as LinkIcon, Activity } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { cn } from '@/lib/utils';
import { BarbershopSettingsSection } from '@/components/settings/BarbershopSettingsSection';
import TeamSettingsSection from '@/components/settings/TeamSettingsSection';
import BookingSettingsSection from '@/components/settings/BookingSettingsSection';
import AiSettingsSection from '@/components/settings/AiSettingsSection';
import IntegrationsSettingsSection from '@/components/settings/IntegrationsSettingsSection';
import AIHealthDashboard from '@/components/settings/AIHealthDashboard';
import type { SettingsTab } from '@/types/settings';

const TABS: { key: SettingsTab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'barbershop',   label: 'Barbearia',   icon: Building,     desc: 'Dados do negócio' },
  { key: 'team',         label: 'Equipe',       icon: Users,        desc: 'Barbeiros e funções' },
  { key: 'booking',      label: 'Agenda',       icon: CalendarClock, desc: 'Regras de agendamento' },
  { key: 'ai',           label: 'IA',           icon: Bot,          desc: 'Personalidade e contexto' },
  { key: 'diagnostics',  label: 'Diagnóstico',  icon: Activity,     desc: 'Saúde do agente' },
  { key: 'integrations', label: 'Integrações',  icon: LinkIcon,     desc: 'WhatsApp, Calendar, N8N' },
];

export default function SettingsPage() {
  const { loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState<SettingsTab>('barbershop');

  if (tenantLoading) return null;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1200px] mx-auto">
      <header className="mb-6 lg:mb-8">
        <p className="page-eyebrow">Painel</p>
        <h1 className="page-title">Configurações</h1>
      </header>

      {/* Mobile grid */}
      <nav className="lg:hidden grid grid-cols-2 gap-2 mb-5">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl text-left transition-colors border',
                active
                  ? 'bg-gold-soft border-[#BE9B64]/30 text-[#9C7B47]'
                  : 'bg-white border-line text-ink-soft hover:text-ink hover:border-line-strong',
              )}
            >
              <tab.icon
                size={17}
                className={cn('shrink-0', active ? 'text-[#BE9B64]' : 'text-ink-faint')}
              />
              <div className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink truncate">{tab.label}</span>
                <span className="block text-[10px] text-ink-faint truncate">{tab.desc}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop sidebar */}
        <nav className="hidden lg:flex lg:flex-col gap-1 shrink-0 lg:w-52">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors',
                  active
                    ? 'bg-gold-soft text-[#9C7B47]'
                    : 'text-ink-soft hover:text-ink hover:bg-[#F7F6F4]',
                )}
              >
                <tab.icon
                  size={16}
                  className={cn('shrink-0', active ? 'text-[#BE9B64]' : 'text-ink-faint')}
                />
                <div>
                  <span className="block text-[13px] font-semibold">{tab.label}</span>
                  <span className="block text-[10px] text-ink-faint mt-0.5">{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="card p-5 sm:p-6 lg:p-8"
          >
            {activeTab === 'barbershop'   && <BarbershopSettingsSection />}
            {activeTab === 'team'         && <TeamSettingsSection />}
            {activeTab === 'booking'      && <BookingSettingsSection />}
            {activeTab === 'ai'           && <AiSettingsSection />}
            {activeTab === 'diagnostics'  && <AIHealthDashboard />}
            {activeTab === 'integrations' && <IntegrationsSettingsSection />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
