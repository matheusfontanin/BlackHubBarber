import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building, Users, CalendarClock, Bot, Link as LinkIcon } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { cn } from '@/lib/utils';
import BarbershopSettingsSection from '@/components/settings/BarbershopSettingsSection';
import TeamSettingsSection from '@/components/settings/TeamSettingsSection';
import BookingSettingsSection from '@/components/settings/BookingSettingsSection';
import AiSettingsSection from '@/components/settings/AiSettingsSection';
import IntegrationsSettingsSection from '@/components/settings/IntegrationsSettingsSection';
import type { SettingsTab } from '@/types/settings';

const TABS: { key: SettingsTab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'barbershop', label: 'Barbearia', icon: Building, desc: 'Dados do negócio' },
  { key: 'team', label: 'Equipe', icon: Users, desc: 'Barbeiros e funções' },
  { key: 'booking', label: 'Agenda', icon: CalendarClock, desc: 'Regras de agendamento' },
  { key: 'ai', label: 'IA', icon: Bot, desc: 'Personalidade e contexto' },
  { key: 'integrations', label: 'Integrações', icon: LinkIcon, desc: 'WhatsApp, Calendar, N8N' },
];

export default function SettingsPage() {
  const { loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState<SettingsTab>('barbershop');

  if (tenantLoading) return null;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <header className="mb-8">
        <p className="text-xs text-muted font-semibold mb-1 uppercase tracking-wider">Painel</p>
        <h1 className="text-3xl font-heading font-bold text-primary italic heading-underline">Configurações</h1>
        <p className="text-sm text-muted mt-3">Centro de configuração do seu negócio e do assistente IA.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 shrink-0 lg:w-56">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 w-full text-left",
                activeTab === tab.key
                  ? "bg-gold/10 border border-gold/25 text-gold shadow-[0_0_12px_rgba(201,168,76,0.08)]"
                  : "text-muted hover:text-primary hover:bg-surface/60 border border-transparent"
              )}
            >
              <tab.icon size={17} className={activeTab === tab.key ? 'text-gold' : ''} />
              <div className="hidden lg:block">
                <span className="block text-sm">{tab.label}</span>
                <span className={cn(
                  "block text-[10px] font-medium mt-0.5",
                  activeTab === tab.key ? "text-gold/60" : "text-faint"
                )}>{tab.desc}</span>
              </div>
              <span className="lg:hidden">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-6 lg:p-8"
          >
            {activeTab === 'barbershop' && <BarbershopSettingsSection />}
            {activeTab === 'team' && <TeamSettingsSection />}
            {activeTab === 'booking' && <BookingSettingsSection />}
            {activeTab === 'ai' && <AiSettingsSection />}
            {activeTab === 'integrations' && <IntegrationsSettingsSection />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
