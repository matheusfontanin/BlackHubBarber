import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { getBookingSettings, upsertBookingSettings } from '@/services/settingsService';
import type { TenantBookingSettings } from '@/types/settings';

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

const TOGGLE_CLS = (active: boolean) =>
  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-secondary' : 'bg-primary/15'}`;
const TOGGLE_DOT = (active: boolean) =>
  `inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${active ? 'translate-x-6' : 'translate-x-1'}`;

export default function BookingSettingsSection() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<TenantBookingSettings>>({
    min_booking_notice_minutes: 60,
    max_booking_notice_days: 30,
    buffer_between_appointments_minutes: 10,
    allow_ai_booking: false,
    require_manual_confirmation: true,
    reschedule_limit: 2,
  });

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getBookingSettings(tenantId!);
      if (data) setForm(data);
    } catch (err) {
      console.error('Erro ao carregar config de agenda:', err);
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
      await upsertBookingSettings({ ...form, tenant_id: tenantId } as TenantBookingSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar regras da agenda.');
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (field: 'allow_ai_booking' | 'require_manual_confirmation') => {
    setForm(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-lg font-heading font-medium tracking-tight text-primary border-b border-primary/[0.06] pb-4">
        Regras de Agendamento
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLS}>Antecedência Mínima (min)</label>
          <input
            type="number"
            value={form.min_booking_notice_minutes ?? 60}
            onChange={e => setForm(prev => ({ ...prev, min_booking_notice_minutes: Number(e.target.value) }))}
            className={INPUT_CLS}
            min={0}
          />
          <p className="text-[10px] text-primary/30 mt-1">Tempo mínimo antes do atendimento</p>
        </div>
        <div>
          <label className={LABEL_CLS}>Antecedência Máxima (dias)</label>
          <input
            type="number"
            value={form.max_booking_notice_days ?? 30}
            onChange={e => setForm(prev => ({ ...prev, max_booking_notice_days: Number(e.target.value) }))}
            className={INPUT_CLS}
            min={1}
          />
          <p className="text-[10px] text-primary/30 mt-1">Com quanto tempo de antecedência pode agendar</p>
        </div>
        <div>
          <label className={LABEL_CLS}>Intervalo entre Atend. (min)</label>
          <input
            type="number"
            value={form.buffer_between_appointments_minutes ?? 10}
            onChange={e => setForm(prev => ({ ...prev, buffer_between_appointments_minutes: Number(e.target.value) }))}
            className={INPUT_CLS}
            min={0}
          />
          <p className="text-[10px] text-primary/30 mt-1">Pausa entre um cliente e outro</p>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Comportamento da IA</h3>
        
        <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
          <div>
            <p className="text-sm font-semibold text-primary">Permitir agendamento automático pela IA</p>
            <p className="text-[10px] text-primary/35">A IA pode criar agendamentos sem confirmação manual do dono</p>
          </div>
          <button type="button" onClick={() => toggleField('allow_ai_booking')} className={TOGGLE_CLS(form.allow_ai_booking ?? false)}>
            <span className={TOGGLE_DOT(form.allow_ai_booking ?? false)} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
          <div>
            <p className="text-sm font-semibold text-primary">Exigir confirmação antes de agendar</p>
            <p className="text-[10px] text-primary/35">IA confirma horário com o cliente antes de fechar</p>
          </div>
          <button type="button" onClick={() => toggleField('require_manual_confirmation')} className={TOGGLE_CLS(form.require_manual_confirmation ?? true)}>
            <span className={TOGGLE_DOT(form.require_manual_confirmation ?? true)} />
          </button>
        </div>
      </div>

      {/* Policies */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Políticas & Mensagens</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Limite de Reagendamento</label>
            <input
              type="number"
              value={form.reschedule_limit ?? 2}
              onChange={e => setForm(prev => ({ ...prev, reschedule_limit: Number(e.target.value) }))}
              className={INPUT_CLS}
              min={0}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Política de Cancelamento</label>
            <input
              type="text"
              value={form.cancellation_policy ?? ''}
              onChange={e => setForm(prev => ({ ...prev, cancellation_policy: e.target.value }))}
              className={INPUT_CLS}
              placeholder="Ex: cancelar com 2h de antecedência"
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Mensagem de Confirmação</label>
          <textarea
            value={form.confirmation_message_template ?? ''}
            onChange={e => setForm(prev => ({ ...prev, confirmation_message_template: e.target.value }))}
            className={TEXTAREA_CLS}
            rows={2}
            placeholder="Olá {nome}! Seu agendamento para {servico} em {data} às {hora} foi confirmado."
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Mensagem de Cancelamento</label>
          <textarea
            value={form.cancellation_message_template ?? ''}
            onChange={e => setForm(prev => ({ ...prev, cancellation_message_template: e.target.value }))}
            className={TEXTAREA_CLS}
            rows={2}
            placeholder="Seu agendamento de {data} foi cancelado. Deseja reagendar?"
          />
        </div>
      </div>

      {/* Save */}
      <div className="pt-4 border-t border-primary/[0.06]">
        <button type="submit" disabled={saving} className="btn-gold flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Regras'}
        </button>
      </div>
    </form>
  );
}
