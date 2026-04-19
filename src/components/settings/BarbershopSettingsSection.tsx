import React, { useState, useEffect } from 'react';
import { Check, Loader2, ImagePlus, MapPin, Phone, Clock, Coins } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTenant } from '@/hooks/useTenant';
import { handleError, handleSuccess } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';
import { tenantBusinessProfileSchema } from '@/schemas/tenantBusinessProfileSchema';
import { OpeningHoursEditor } from './OpeningHoursEditor';
import { AmenitiesPicker } from './AmenitiesPicker';

type FormValues = z.input<typeof tenantBusinessProfileSchema>;

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

const TOGGLE_CLS = (active: boolean) =>
  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-secondary' : 'bg-primary/15'}`;
const TOGGLE_DOT = (active: boolean) =>
  `inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${active ? 'translate-x-6' : 'translate-x-1'}`;

const BUSINESS_STYLES = [
  { value: 'classica', label: 'Clássica' },
  { value: 'moderna', label: 'Moderna' },
  { value: 'premium', label: 'Premium' },
  { value: 'urbana', label: 'Urbana' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'familiar', label: 'Familiar' },
] as const;

const PRICE_POSITIONING = [
  { value: 'popular', label: 'Popular' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxo', label: 'Luxo' },
] as const;

const PAYMENT_METHODS = [
  { value: 'pix', label: 'Pix' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
];

interface BarbershopSettingsSectionProps {
  onSave?: () => void;
}

export function BarbershopSettingsSection({ onSave }: BarbershopSettingsSectionProps) {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(tenantBusinessProfileSchema),
    defaultValues: {
      trade_name: '',
      business_phone: '',
      opening_hours: {},
      amenities: [],
      payment_methods: [],
      accepts_walk_in: true,
      requires_deposit: false,
    } as FormValues,
  });

  const values = watch();

  useEffect(() => {
    if (!tenantId) return;

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('tenant_business_profile')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (error) throw error;
        if (data) reset(data);
      } catch (err) {
        handleError(err, 'Erro ao carregar dados da barbearia');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!tenantId) return;

    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from('tenant_business_profile')
        .upsert(
          { ...data, tenant_id: tenantId, updated_at: new Date().toISOString() },
          { onConflict: 'tenant_id' },
        );

      if (error) throw error;

      setSaved(true);
      handleSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSaved(false), 3000);
      onSave?.();
    } catch (err) {
      handleError(err, 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setValue('logo_url', URL.createObjectURL(file), { shouldDirty: true });
  };

  const togglePayment = (method: string) => {
    const current = values.payment_methods ?? [];
    if (current.includes(method)) {
      setValue('payment_methods', current.filter(m => m !== method), { shouldDirty: true });
    } else {
      setValue('payment_methods', [...current, method], { shouldDirty: true });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={30} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Identidade */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-primary">Identidade</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={LABEL_CLS}>Nome fantasia *</label>
            <input {...register('trade_name')} className={INPUT_CLS} />
            {errors.trade_name && <p className="text-red-500 text-xs mt-1">{errors.trade_name.message as string}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Razão social</label>
            <input {...register('legal_name')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Dono</label>
            <input {...register('owner_name')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Frase curta</label>
            <input {...register('tagline')} className={INPUT_CLS} placeholder="A barbearia do guerreiro moderno" />
          </div>
          <div>
            <label className={LABEL_CLS}>Ano de fundação</label>
            <input
              type="number"
              min={1900}
              max={2030}
              {...register('founded_year', { valueAsNumber: true })}
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Descrição</label>
          <textarea {...register('description')} rows={4} className={TEXTAREA_CLS} />
        </div>

        <div>
          <label className={LABEL_CLS}>Logo</label>
          <div className="flex items-center gap-4">
            {values.logo_url && <img src={values.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="btn-secondary cursor-pointer flex items-center gap-2">
              <ImagePlus size={16} /> Escolher logo
            </label>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="space-y-6 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Phone size={18} /> Contato
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={LABEL_CLS}>Telefone comercial *</label>
            <input {...register('business_phone')} className={INPUT_CLS} />
            {errors.business_phone && <p className="text-red-500 text-xs mt-1">{errors.business_phone.message as string}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>WhatsApp</label>
            <input {...register('whatsapp_number')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Email</label>
            <input {...register('business_email')} type="email" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Website</label>
            <input {...register('website_url')} type="url" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Instagram</label>
            <input {...register('instagram_handle')} className={INPUT_CLS} placeholder="@seuusuario" />
          </div>
          <div>
            <label className={LABEL_CLS}>Google Maps (URL)</label>
            <input {...register('google_maps_url')} type="url" className={INPUT_CLS} />
          </div>
        </div>
      </section>

      {/* Localização */}
      <section className="space-y-6 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <MapPin size={18} /> Localização
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={LABEL_CLS}>Rua</label>
            <input {...register('address_street')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Número</label>
            <input {...register('address_number')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Complemento</label>
            <input {...register('address_complement')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Bairro</label>
            <input {...register('address_neighborhood')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Cidade</label>
            <input {...register('city')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Estado</label>
            <input {...register('state')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>CEP</label>
            <input {...register('zip_code')} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Referência</label>
            <input {...register('landmark')} className={INPUT_CLS} placeholder="Em frente ao mercado X" />
          </div>
        </div>
      </section>

      {/* Posicionamento */}
      <section className="space-y-6 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-lg font-bold text-primary">Posicionamento</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={LABEL_CLS}>Estilo do negócio</label>
            <select {...register('business_style')} className={INPUT_CLS}>
              <option value="">Selecione</option>
              {BUSINESS_STYLES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Posicionamento de preço</label>
            <select {...register('price_positioning')} className={INPUT_CLS}>
              <option value="">Selecione</option>
              {PRICE_POSITIONING.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Público-alvo</label>
            <input {...register('target_audience')} className={INPUT_CLS} placeholder="Homens 25-45, executivos" />
          </div>
          <div>
            <label className={LABEL_CLS}>Dress code</label>
            <input {...register('dress_code')} className={INPUT_CLS} placeholder="Casual, sem camiseta regata" />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Diferenciais</label>
          <textarea rows={2} {...register('differentiators')} className={TEXTAREA_CLS} />
        </div>
      </section>

      {/* Horários */}
      <section className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Clock size={18} /> Horários
        </h3>
        <OpeningHoursEditor
          value={(values.opening_hours ?? {}) as Record<string, any>}
          onChange={(next) => setValue('opening_hours', next, { shouldDirty: true })}
        />
      </section>

      {/* Comodidades */}
      <section className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-lg font-bold text-primary">Comodidades</h3>
        <AmenitiesPicker
          value={values.amenities ?? []}
          onChange={(next) => setValue('amenities', next, { shouldDirty: true })}
        />
      </section>

      {/* Pagamento */}
      <section className="space-y-6 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Coins size={18} /> Pagamento
        </h3>

        <div>
          <label className={LABEL_CLS}>Formas aceitas</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map(m => {
              const active = (values.payment_methods ?? []).includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => togglePayment(m.value)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    active
                      ? 'border-secondary bg-secondary/5 text-primary'
                      : 'border-primary/[0.06] bg-bg/60 text-primary/60'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
          <p className="text-sm font-semibold text-primary">Aceita atendimento sem agendamento (walk-in)</p>
          <button
            type="button"
            onClick={() => setValue('accepts_walk_in', !values.accepts_walk_in, { shouldDirty: true })}
            className={TOGGLE_CLS(values.accepts_walk_in ?? true)}
          >
            <span className={TOGGLE_DOT(values.accepts_walk_in ?? true)} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06]">
          <p className="text-sm font-semibold text-primary">Exige sinal antecipado</p>
          <button
            type="button"
            onClick={() => setValue('requires_deposit', !values.requires_deposit, { shouldDirty: true })}
            className={TOGGLE_CLS(values.requires_deposit ?? false)}
          >
            <span className={TOGGLE_DOT(values.requires_deposit ?? false)} />
          </button>
        </div>

        {values.requires_deposit && (
          <div>
            <label className={LABEL_CLS}>Porcentagem do sinal (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              {...register('deposit_percentage', { valueAsNumber: true })}
              className={INPUT_CLS}
            />
          </div>
        )}
      </section>

      {/* Salvar */}
      <div className="pt-4 border-t border-primary/[0.06]">
        <button type="submit" disabled={saving} className="btn-gold flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Configurações'}
        </button>
      </div>
    </form>
  );
}
