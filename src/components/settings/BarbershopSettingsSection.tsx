import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, ImagePlus, Trash2, MapPin, Clock, Phone, Mail, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTenant } from '@/hooks/useTenant';
import { handleError, handleSuccess } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';
import { tenantBusinessProfileSchema, type TenantBusinessProfile } from '@/schemas/tenantBusinessProfileSchema';

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";

interface BarbershopSettingsSectionProps {
  onSave?: () => void;
}

export function BarbershopSettingsSection({ onSave }: BarbershopSettingsSectionProps) {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(tenantBusinessProfileSchema),
    defaultValues: {
      opening_hours: {},
    },
  });

  useEffect(() => {
    if (!tenantId) return;

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('tenant_business_profile')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

        if (data) {
          reset(data);
          setLogoUrl(data.logo_url || '');
        }
      } catch (err) {
        handleError(err, 'Erro ao carregar dados da barbearia');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, reset]);

  const onSubmit = async (data: any) => {
    if (!tenantId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenant_business_profile')
        .upsert({
          ...data,
          tenant_id: tenantId,
          logo_url: logoUrl,
        });

      if (error) throw error;

      handleSuccess('Configurações salvas com sucesso!');
      onSave?.();
    } catch (err) {
      handleError(err, 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    // Implement logo upload logic here (similar to original)
    // For now, just set a placeholder
    setLogoUrl(URL.createObjectURL(file));
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
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-primary">Identidade</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={LABEL_CLS}>Nome Fantasia *</label>
            <input {...register('trade_name')} className={INPUT_CLS} />
            {errors.trade_name && <p className="text-red-500 text-xs mt-1">{errors.trade_name.message}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Razão Social</label>
            <input {...register('legal_name')} className={INPUT_CLS} />
          </div>

          <div>
            <label className={LABEL_CLS}>Dono</label>
            <input {...register('owner_name')} className={INPUT_CLS} />
          </div>

          <div>
            <label className={LABEL_CLS}>Frase Curta</label>
            <input {...register('tagline')} className={INPUT_CLS} placeholder="Ex: A barbearia do guerreiro moderno" />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Descrição</label>
          <textarea {...register('description')} rows={4} className={INPUT_CLS} placeholder="Descreva seu negócio..." />
        </div>

        {/* Logo upload - simplified */}
        <div>
          <label className={LABEL_CLS}>Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl && <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="btn-secondary cursor-pointer">
              <ImagePlus size={16} /> Escolher Logo
            </label>
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Phone size={18} /> Contato
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={LABEL_CLS}>Telefone Comercial *</label>
            <input {...register('business_phone')} className={INPUT_CLS} />
            {errors.business_phone && <p className="text-red-500 text-xs mt-1">{errors.business_phone.message}</p>}
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
        </div>
      </div>

      {/* Localização */}
      <div className="space-y-6">
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
            <input {...register('landmark')} className={INPUT_CLS} placeholder="Ex: em frente ao mercado X" />
          </div>
        </div>
      </div>
    </form>
  );
}
