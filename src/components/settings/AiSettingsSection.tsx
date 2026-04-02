import React, { useState, useEffect } from 'react';
import { Check, Loader2, Bot, Sparkles } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { getAISettings, upsertAISettings } from '@/services/settingsService';
import type { TenantAISettings, ToneOfVoice, ServiceStyle } from '@/types/settings';

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

const TOGGLE_CLS = (active: boolean) =>
  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-secondary' : 'bg-primary/15'}`;
const TOGGLE_DOT = (active: boolean) =>
  `inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${active ? 'translate-x-6' : 'translate-x-1'}`;

const TONE_OPTIONS: { value: ToneOfVoice; label: string; desc: string }[] = [
  { value: 'profissional', label: 'Profissional', desc: 'Formal e direto, passa confiança' },
  { value: 'descontraído', label: 'Descontraído', desc: 'Informal e amigável, cria proximidade' },
  { value: 'premium', label: 'Premium', desc: 'Elegante e sofisticado, experiência exclusiva' },
];

const STYLE_OPTIONS: { value: ServiceStyle; label: string; desc: string }[] = [
  { value: 'direto', label: 'Direto', desc: 'Vai direto ao ponto sem rodeios' },
  { value: 'consultivo', label: 'Consultivo', desc: 'Pergunta e sugere antes de decidir' },
  { value: 'acolhedor', label: 'Acolhedor', desc: 'Empático e atencioso em cada interação' },
];

export default function AiSettingsSection() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<TenantAISettings>>({
    assistant_name: 'Assistente',
    tone_of_voice: 'profissional',
    service_style: 'direto',
    can_auto_schedule: false,
    must_confirm_before_booking: true,
    can_reply_outside_business_hours: false,
  });

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAISettings(tenantId!);
      if (data) setForm(data);
    } catch (err) {
      console.error('Erro ao carregar config IA:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);
    try {
      await upsertAISettings({ ...form, tenant_id: tenantId } as TenantAISettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar configurações da IA.');
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (field: 'can_auto_schedule' | 'must_confirm_before_booking' | 'can_reply_outside_business_hours') => {
    setForm(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="border-b border-primary/[0.06] pb-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-secondary/15 rounded-xl flex items-center justify-center">
          <Bot size={18} className="text-secondary" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-medium tracking-tight text-primary">Configurações da IA</h2>
          <p className="text-[10px] text-primary/35 uppercase tracking-wider font-bold">Personalidade e comportamento do assistente</p>
        </div>
      </div>

      {/* Identity */}
      <div className="space-y-4">
        <div>
          <label className={LABEL_CLS}>Nome do Assistente</label>
          <input
            type="text"
            value={form.assistant_name ?? ''}
            onChange={e => setForm(prev => ({ ...prev, assistant_name: e.target.value }))}
            className={INPUT_CLS}
            placeholder="Ex: Luna, Max, BlackBot..."
          />
        </div>

        {/* Tone of Voice */}
        <div>
          <label className={LABEL_CLS}>Tom de Voz</label>
          <div className="grid grid-cols-3 gap-3">
            {TONE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, tone_of_voice: opt.value }))}
                className={`p-3 rounded-xl border text-left transition-all ${form.tone_of_voice === opt.value ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-primary/[0.06] bg-bg/60 hover:border-primary/10'}`}
              >
                <p className="text-sm font-semibold text-primary">{opt.label}</p>
                <p className="text-[10px] text-primary/35 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Service Style */}
        <div>
          <label className={LABEL_CLS}>Estilo de Atendimento</label>
          <div className="grid grid-cols-3 gap-3">
            {STYLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, service_style: opt.value }))}
                className={`p-3 rounded-xl border text-left transition-all ${form.service_style === opt.value ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-primary/[0.06] bg-bg/60 hover:border-primary/10'}`}
              >
                <p className="text-sm font-semibold text-primary">{opt.label}</p>
                <p className="text-[10px] text-primary/35 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Context */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} /> Contexto para a IA
        </h3>
        <div>
          <label className={LABEL_CLS}>Descrição da Barbearia</label>
          <textarea value={form.business_summary ?? ''} onChange={e => setForm(prev => ({ ...prev, business_summary: e.target.value }))} className={TEXTAREA_CLS} rows={2} placeholder="Descreva sua barbearia para a IA saber como apresentá-la aos clientes" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Público-Alvo / Perfil do Cliente</label>
            <input type="text" value={form.customer_profile ?? ''} onChange={e => setForm(prev => ({ ...prev, customer_profile: e.target.value }))} className={INPUT_CLS} placeholder="Jovens, executivos..." />
          </div>
          <div>
            <label className={LABEL_CLS}>Diferenciais</label>
            <input type="text" value={form.differentiators ?? ''} onChange={e => setForm(prev => ({ ...prev, differentiators: e.target.value }))} className={INPUT_CLS} placeholder="Ambiente climatizado, cerveja..." />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Observações Importantes para Atendimento</label>
          <textarea value={form.important_notes ?? ''} onChange={e => setForm(prev => ({ ...prev, important_notes: e.target.value }))} className={TEXTAREA_CLS} rows={2} placeholder="Informações que a IA deve sempre considerar" />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Comportamento</h3>
        {([
          { field: 'can_auto_schedule' as const, label: 'IA pode agendar automaticamente?', desc: 'A IA cria agendamentos sem intervenção humana' },
          { field: 'must_confirm_before_booking' as const, label: 'Sempre confirmar antes de fechar?', desc: 'A IA confirma horários com o cliente antes de finalizar' },
          { field: 'can_reply_outside_business_hours' as const, label: 'Responder fora do horário?', desc: 'A IA pode responder mensagens fora do expediente' },
        ]).map(item => (
          <div key={item.field} className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
            <div>
              <p className="text-sm font-semibold text-primary">{item.label}</p>
              <p className="text-[10px] text-primary/35">{item.desc}</p>
            </div>
            <button type="button" onClick={() => toggleField(item.field)} className={TOGGLE_CLS(form[item.field] ?? false)}>
              <span className={TOGGLE_DOT(form[item.field] ?? false)} />
            </button>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Mensagens Padrão</h3>
        <div>
          <label className={LABEL_CLS}>Mensagem de Saudação</label>
          <textarea value={form.greeting_message ?? ''} onChange={e => setForm(prev => ({ ...prev, greeting_message: e.target.value }))} className={TEXTAREA_CLS} rows={2} placeholder="Olá! Sou o assistente da {barbearia}. Como posso te ajudar?" />
        </div>
        <div>
          <label className={LABEL_CLS}>Mensagem Fora do Horário</label>
          <textarea value={form.out_of_hours_message ?? ''} onChange={e => setForm(prev => ({ ...prev, out_of_hours_message: e.target.value }))} className={TEXTAREA_CLS} rows={2} placeholder="Estamos fechados no momento. Nosso horário é de segunda a sábado, das 9h às 20h." />
        </div>
      </div>

      {/* Save */}
      <div className="pt-4 border-t border-primary/[0.06]">
        <button type="submit" disabled={saving} className="py-3 px-6 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Configurações IA'}
        </button>
      </div>
    </form>
  );
}
