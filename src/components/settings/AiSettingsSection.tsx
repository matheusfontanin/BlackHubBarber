import React, { useEffect, useState } from 'react';
import { Check, Loader2, Bot, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase/client';
import { handleError, handleSuccess } from '@/lib/errors';
import { tenantAIConfigSchema } from '@/schemas/tenantAIConfigSchema';
import { PromptPreview } from './PromptPreview';

const formSchema = tenantAIConfigSchema.omit({ tenant_id: true, updated_at: true });
type FormValues = z.input<typeof formSchema>;

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

const TOGGLE_CLS = (active: boolean) =>
  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-secondary' : 'bg-primary/15'}`;
const TOGGLE_DOT = (active: boolean) =>
  `inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${active ? 'translate-x-6' : 'translate-x-1'}`;

const TONE_OPTIONS = [
  { value: 'profissional', label: 'Profissional', desc: 'Formal e direto, passa confiança' },
  { value: 'descontraido', label: 'Descontraído', desc: 'Informal e amigável, cria proximidade' },
  { value: 'premium', label: 'Premium', desc: 'Elegante e sofisticado' },
  { value: 'amigo', label: 'Amigo', desc: 'Próximo e acolhedor' },
] as const;

const STYLE_OPTIONS = [
  { value: 'direto', label: 'Direto', desc: 'Vai direto ao ponto' },
  { value: 'consultivo', label: 'Consultivo', desc: 'Pergunta e sugere antes de decidir' },
  { value: 'acolhedor', label: 'Acolhedor', desc: 'Empático e atencioso' },
] as const;

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'neutro', label: 'Neutro' },
] as const;

const DEFAULTS: FormValues = {
  assistant_name: 'Assistente',
  assistant_avatar_url: '',
  assistant_gender: 'neutro',
  tone_of_voice: 'profissional',
  service_style: 'direto',
  formality_level: 3,
  uses_emojis: true,
  uses_slang: false,
  can_auto_schedule: false,
  must_confirm_before_booking: true,
  can_reply_outside_business_hours: false,
  can_suggest_services: true,
  can_negotiate_price: false,
  can_collect_feedback: true,
  ai_globally_enabled: true,
  max_messages_before_escalation: 20,
  escalation_keywords: [],
  important_notes: '',
  forbidden_topics: [],
  signature_services: '',
  upsell_guidelines: '',
  greeting_message: '',
  out_of_hours_message: '',
  booking_confirmation_template: '',
  booking_reminder_template: '',
  cancellation_message_template: '',
  post_service_thankyou: '',
};

function parseListInput(value: string): string[] {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export default function AiSettingsSection() {
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

  const values = watch();

  useEffect(() => {
    if (!tenantId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tenant_ai_config')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (error) throw error;
        if (data) reset({ ...DEFAULTS, ...data });
      } catch (err) {
        handleError(err, 'Não foi possível carregar as configurações da IA');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenantId, reset]);

  const onSubmit = async (formValues: FormValues) => {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from('tenant_ai_config')
        .upsert(
          { ...formValues, tenant_id: tenantId, updated_at: new Date().toISOString() },
          { onConflict: 'tenant_id' },
        );

      if (error) throw error;
      setSaved(true);
      handleSuccess('Configurações da IA salvas');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleError(err, 'Erro ao salvar configurações da IA');
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

  const toggle = (field: keyof FormValues) => {
    setValue(field as any, !values[field], { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-b border-primary/[0.06] pb-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-secondary/15 rounded-xl flex items-center justify-center">
          <Bot size={18} className="text-secondary" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-medium tracking-tight text-primary">Configurações da IA</h2>
        </div>
      </div>

      {/* Identidade do Assistente */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Identidade do assistente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Nome do assistente *</label>
            <input {...register('assistant_name')} className={INPUT_CLS} placeholder="Ex: Luna, Max, BlackBot" />
            {errors.assistant_name && <p className="text-red-500 text-xs mt-1">{errors.assistant_name.message}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Avatar (URL)</label>
            <input {...register('assistant_avatar_url')} className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Gênero</label>
          <div className="grid grid-cols-3 gap-3">
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('assistant_gender', opt.value, { shouldDirty: true })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  values.assistant_gender === opt.value
                    ? 'border-secondary bg-secondary/5 shadow-sm'
                    : 'border-primary/[0.06] bg-bg/60 hover:border-primary/10'
                }`}
              >
                <p className="text-sm font-semibold text-primary">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personalidade */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} /> Personalidade
        </h3>
        <div>
          <label className={LABEL_CLS}>Tom de voz</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TONE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('tone_of_voice', opt.value, { shouldDirty: true })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  values.tone_of_voice === opt.value
                    ? 'border-secondary bg-secondary/5 shadow-sm'
                    : 'border-primary/[0.06] bg-bg/60 hover:border-primary/10'
                }`}
              >
                <p className="text-sm font-semibold text-primary">{opt.label}</p>
                <p className="text-[10px] text-primary/35 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Estilo de atendimento</label>
          <div className="grid grid-cols-3 gap-3">
            {STYLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('service_style', opt.value, { shouldDirty: true })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  values.service_style === opt.value
                    ? 'border-secondary bg-secondary/5 shadow-sm'
                    : 'border-primary/[0.06] bg-bg/60 hover:border-primary/10'
                }`}
              >
                <p className="text-sm font-semibold text-primary">{opt.label}</p>
                <p className="text-[10px] text-primary/35 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLS}>Formalidade (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              {...register('formality_level', { valueAsNumber: true })}
              className={INPUT_CLS}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
            <p className="text-sm font-semibold text-primary">Usar emojis</p>
            <button type="button" onClick={() => toggle('uses_emojis')} className={TOGGLE_CLS(values.uses_emojis ?? true)}>
              <span className={TOGGLE_DOT(values.uses_emojis ?? true)} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
            <p className="text-sm font-semibold text-primary">Usar gírias</p>
            <button type="button" onClick={() => toggle('uses_slang')} className={TOGGLE_CLS(values.uses_slang ?? false)}>
              <span className={TOGGLE_DOT(values.uses_slang ?? false)} />
            </button>
          </div>
        </div>
      </div>

      {/* Poderes */}
      <div className="space-y-3 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Poderes</h3>
        {([
          { field: 'ai_globally_enabled' as const, label: 'IA global ativa' },
          { field: 'can_auto_schedule' as const, label: 'Pode criar agendamentos diretamente' },
          { field: 'must_confirm_before_booking' as const, label: 'Sempre confirmar antes de fechar' },
          { field: 'can_reply_outside_business_hours' as const, label: 'Pode responder fora do horário' },
          { field: 'can_suggest_services' as const, label: 'Pode sugerir serviços' },
          { field: 'can_negotiate_price' as const, label: 'Pode negociar preço' },
          { field: 'can_collect_feedback' as const, label: 'Pode pedir feedback após atendimento' },
        ]).map(item => (
          <div key={item.field} className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
            <p className="text-sm font-semibold text-primary">{item.label}</p>
            <button type="button" onClick={() => toggle(item.field)} className={TOGGLE_CLS((values[item.field] as boolean) ?? false)}>
              <span className={TOGGLE_DOT((values[item.field] as boolean) ?? false)} />
            </button>
          </div>
        ))}
      </div>

      {/* Guardrails */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Guardrails</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Tópicos proibidos</label>
            <input
              type="text"
              defaultValue={(values.forbidden_topics ?? []).join(', ')}
              onBlur={e => setValue('forbidden_topics', parseListInput(e.target.value), { shouldDirty: true })}
              className={INPUT_CLS}
              placeholder="política, religião"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Palavras que escalam para humano</label>
            <input
              type="text"
              defaultValue={(values.escalation_keywords ?? []).join(', ')}
              onBlur={e => setValue('escalation_keywords', parseListInput(e.target.value), { shouldDirty: true })}
              className={INPUT_CLS}
              placeholder="reclamação, gerente"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Máximo de mensagens antes de escalar</label>
            <input
              type="number"
              min={1}
              {...register('max_messages_before_escalation', { valueAsNumber: true })}
              className={INPUT_CLS}
            />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Observações importantes</label>
          <textarea rows={3} {...register('important_notes')} className={TEXTAREA_CLS} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Serviços em destaque</label>
            <textarea rows={2} {...register('signature_services')} className={TEXTAREA_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Orientação de upsell</label>
            <textarea rows={2} {...register('upsell_guidelines')} className={TEXTAREA_CLS} />
          </div>
        </div>
      </div>

      {/* Mensagens padrão */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Mensagens padrão</h3>
        <div>
          <label className={LABEL_CLS}>Saudação</label>
          <textarea rows={2} {...register('greeting_message')} className={TEXTAREA_CLS} placeholder="Olá! Sou o assistente da {barbearia}. Como posso te ajudar?" />
        </div>
        <div>
          <label className={LABEL_CLS}>Fora do horário</label>
          <textarea rows={2} {...register('out_of_hours_message')} className={TEXTAREA_CLS} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Confirmação de agendamento</label>
            <textarea rows={2} {...register('booking_confirmation_template')} className={TEXTAREA_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Lembrete</label>
            <textarea rows={2} {...register('booking_reminder_template')} className={TEXTAREA_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Cancelamento</label>
            <textarea rows={2} {...register('cancellation_message_template')} className={TEXTAREA_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Agradecimento pós-atendimento</label>
            <textarea rows={2} {...register('post_service_thankyou')} className={TEXTAREA_CLS} />
          </div>
        </div>
      </div>

      {/* Prompt Preview */}
      <div className="pt-4 border-t border-primary/[0.06]">
        <PromptPreview />
      </div>

      <div className="pt-4 border-t border-primary/[0.06]">
        <button type="submit" disabled={saving} className="btn-gold flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Configurações IA'}
        </button>
      </div>
    </form>
  );
}
