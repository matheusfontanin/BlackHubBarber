import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase/client';
import { handleError, handleSuccess } from '@/lib/errors';
import { tenantBookingRulesSchema } from '@/schemas/tenantBookingRulesSchema';

const formSchema = tenantBookingRulesSchema.omit({ tenant_id: true, updated_at: true });
type FormValues = z.input<typeof formSchema>;

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

const TOGGLE_CLS = (active: boolean) =>
  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-secondary' : 'bg-primary/15'}`;
const TOGGLE_DOT = (active: boolean) =>
  `inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${active ? 'translate-x-6' : 'translate-x-1'}`;

const DEFAULTS: FormValues = {
  min_booking_notice_minutes: 60,
  max_booking_notice_days: 30,
  buffer_between_appointments_minutes: 10,
  allow_simultaneous_per_barber: false,
  slot_granularity_minutes: 15,
  reschedule_limit: 2,
  reschedule_min_notice_hours: 2,
  cancellation_min_notice_hours: 2,
  cancellation_policy: '',
  no_show_penalty: '',
  no_show_blocks_future_bookings: false,
  no_show_max_before_block: 2,
  send_reminder_hours_before: 24,
  send_confirmation_on_booking: true,
};

export default function BookingSettingsSection() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!tenantId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tenant_booking_rules')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (error) throw error;
        if (data) reset({ ...DEFAULTS, ...data });
      } catch (err) {
        handleError(err, 'Não foi possível carregar as regras da agenda');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenantId, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from('tenant_booking_rules')
        .upsert({ ...values, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id' });

      if (error) throw error;
      setSaved(true);
      handleSuccess('Regras da agenda salvas');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleError(err, 'Erro ao salvar regras da agenda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  const allowSimultaneous = watch('allow_simultaneous_per_barber');
  const noShowBlocks = watch('no_show_blocks_future_bookings');
  const sendConfirmation = watch('send_confirmation_on_booking');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-lg font-heading font-medium tracking-tight text-primary border-b border-primary/[0.06] pb-4">
        Regras de Agendamento
      </h2>

      {/* Antecedência e buffer */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Antecedência e buffer</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLS}>Antecedência mínima (min)</label>
            <input type="number" min={0} {...register('min_booking_notice_minutes', { valueAsNumber: true })} className={INPUT_CLS} />
            {errors.min_booking_notice_minutes && <p className="text-red-500 text-xs mt-1">{errors.min_booking_notice_minutes.message}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Antecedência máxima (dias)</label>
            <input type="number" min={1} {...register('max_booking_notice_days', { valueAsNumber: true })} className={INPUT_CLS} />
            {errors.max_booking_notice_days && <p className="text-red-500 text-xs mt-1">{errors.max_booking_notice_days.message}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Intervalo entre atendimentos (min)</label>
            <input type="number" min={0} {...register('buffer_between_appointments_minutes', { valueAsNumber: true })} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Granularidade dos slots (min)</label>
            <input type="number" min={5} {...register('slot_granularity_minutes', { valueAsNumber: true })} className={INPUT_CLS} />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
          <p className="text-sm font-semibold text-primary">Permitir atendimentos simultâneos por barbeiro</p>
          <button
            type="button"
            onClick={() => setValue('allow_simultaneous_per_barber', !allowSimultaneous, { shouldDirty: true })}
            className={TOGGLE_CLS(allowSimultaneous ?? false)}
          >
            <span className={TOGGLE_DOT(allowSimultaneous ?? false)} />
          </button>
        </div>
      </div>

      {/* Reagendamento e cancelamento */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Reagendamento e cancelamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLS}>Limite de reagendamentos</label>
            <input type="number" min={0} {...register('reschedule_limit', { valueAsNumber: true })} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Antecedência mínima p/ reagendar (h)</label>
            <input type="number" min={0} {...register('reschedule_min_notice_hours', { valueAsNumber: true })} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Antecedência mínima p/ cancelar (h)</label>
            <input type="number" min={0} {...register('cancellation_min_notice_hours', { valueAsNumber: true })} className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Política de cancelamento</label>
          <textarea rows={2} {...register('cancellation_policy')} className={TEXTAREA_CLS} />
        </div>
      </div>

      {/* No-show */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">No-show</h3>
        <div>
          <label className={LABEL_CLS}>Regra em caso de falta</label>
          <textarea rows={2} {...register('no_show_penalty')} className={TEXTAREA_CLS} />
        </div>
        <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
          <p className="text-sm font-semibold text-primary">Bloquear cliente após faltas repetidas</p>
          <button
            type="button"
            onClick={() => setValue('no_show_blocks_future_bookings', !noShowBlocks, { shouldDirty: true })}
            className={TOGGLE_CLS(noShowBlocks ?? false)}
          >
            <span className={TOGGLE_DOT(noShowBlocks ?? false)} />
          </button>
        </div>
        {noShowBlocks && (
          <div>
            <label className={LABEL_CLS}>Máximo de faltas antes do bloqueio</label>
            <input type="number" min={1} {...register('no_show_max_before_block', { valueAsNumber: true })} className={INPUT_CLS} />
          </div>
        )}
      </div>

      {/* Lembretes */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Lembretes</h3>
        <div>
          <label className={LABEL_CLS}>Enviar lembrete quantas horas antes</label>
          <input type="number" min={0} {...register('send_reminder_hours_before', { valueAsNumber: true })} className={INPUT_CLS} />
        </div>
        <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
          <p className="text-sm font-semibold text-primary">Enviar confirmação ao agendar</p>
          <button
            type="button"
            onClick={() => setValue('send_confirmation_on_booking', !sendConfirmation, { shouldDirty: true })}
            className={TOGGLE_CLS(sendConfirmation ?? true)}
          >
            <span className={TOGGLE_DOT(sendConfirmation ?? true)} />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-primary/[0.06]">
        <button type="submit" disabled={saving} className="btn-gold flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Regras'}
        </button>
      </div>
    </form>
  );
}
