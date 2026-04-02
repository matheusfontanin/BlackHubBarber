import React, { useState, useEffect } from 'react';
import { Loader2, Wifi, WifiOff, Calendar, Webhook, MessageCircle, ExternalLink } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { getIntegrationsOverview } from '@/services/settingsService';
import type { IntegrationsOverview } from '@/types/settings';

type StatusColor = 'green' | 'red' | 'yellow';
const STATUS_COLORS: Record<StatusColor, string> = {
  green: 'bg-green-400',
  red: 'bg-red-400',
  yellow: 'bg-yellow-400',
};

function StatusDot({ color }: { color: StatusColor }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[color]}`} />;
}

export default function IntegrationsSettingsSection() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationsOverview | null>(null);

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIntegrationsOverview(tenantId!);
      setIntegrations(data);
    } catch (err) {
      console.error('Erro ao carregar integrações:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
  }

  const wa = integrations?.whatsapp;
  const gc = integrations?.google_calendar;
  const n8n = integrations?.n8n;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-heading font-medium tracking-tight text-primary border-b border-primary/[0.06] pb-4">
        Integrações
      </h2>

      <div className="space-y-4">
        {/* WhatsApp / Evolution API */}
        <div className="p-5 bg-bg/60 rounded-xl border border-primary/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageCircle size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">WhatsApp / Evolution API</h3>
                <p className="text-[10px] text-primary/35 uppercase tracking-wider font-bold">Canal principal de atendimento</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <StatusDot color={wa?.status === 'connected' ? 'green' : 'red'} />
              <span className={wa?.status === 'connected' ? 'text-green-600' : 'text-red-400'}>
                {wa?.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-[10px] font-bold text-primary/30 uppercase">Instância</p>
              <p className="text-sm font-medium text-primary">{wa?.instance_name || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary/30 uppercase">Número</p>
              <p className="text-sm font-medium text-primary">{wa?.phone || 'Não configurado'}</p>
            </div>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="p-5 bg-bg/60 rounded-xl border border-primary/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">Google Calendar</h3>
                <p className="text-[10px] text-primary/35 uppercase tracking-wider font-bold">Sincronização de agenda</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <StatusDot color={gc?.connected ? 'green' : 'red'} />
              <span className={gc?.connected ? 'text-green-600' : 'text-red-400'}>
                {gc?.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[10px] font-bold text-primary/30 uppercase">Email / Calendário</p>
            <p className="text-sm font-medium text-primary">{gc?.email || 'Não conectado'}</p>
          </div>
        </div>

        {/* N8N */}
        <div className="p-5 bg-bg/60 rounded-xl border border-primary/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Webhook size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">N8N / Webhook</h3>
                <p className="text-[10px] text-primary/35 uppercase tracking-wider font-bold">Automações e fluxos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <StatusDot color={n8n?.status === 'connected' ? 'green' : n8n?.webhook_url ? 'yellow' : 'red'} />
              <span className={n8n?.status === 'connected' ? 'text-green-600' : 'text-primary/40'}>
                {n8n?.status === 'connected' ? 'Ativo' : n8n?.webhook_url ? 'Configurado' : 'Não configurado'}
              </span>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[10px] font-bold text-primary/30 uppercase">Webhook URL</p>
            <p className="text-sm font-medium text-primary font-mono">
              {n8n?.webhook_url ? `${n8n.webhook_url.substring(0, 40)}...` : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-xl">
        <p className="text-xs text-secondary/80 font-medium">
          💡 As integrações são configuradas durante o onboarding e podem ser gerenciadas pelo painel admin. 
          Ajustes avançados de webhook e tokens estarão disponíveis em breve.
        </p>
      </div>
    </div>
  );
}
