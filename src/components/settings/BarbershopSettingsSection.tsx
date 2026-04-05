import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { getTenantSettings, upsertTenantSettings, getTenantBasicData } from '@/services/settingsService';
import type { TenantSettings } from '@/types/settings';
import { IMaskInput } from 'react-imask';

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

export default function BarbershopSettingsSection() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<TenantSettings>>({});

  useEffect(() => {
    if (!tenantId) return;
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Tenta carregar settings complementares
      const settings = await getTenantSettings(tenantId!);
      
      if (settings) {
        setForm(settings);
      } else {
        // Se não há settings, preenche com dados do tenant principal
        const tenantData = await getTenantBasicData(tenantId!);
        if (tenantData) {
          setForm({
            tenant_id: tenantId!,
            owner_name: tenantData.owner_name,
            business_phone: tenantData.phone,
            business_email: tenantData.email,
            address: tenantData.address,
            city: tenantData.city,
            state: tenantData.state,
            instagram_handle: tenantData.instagram_handle,
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados da barbearia:', err);
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
      await upsertTenantSettings({ ...form, tenant_id: tenantId } as TenantSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof TenantSettings, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-lg font-heading font-medium tracking-tight text-primary border-b border-primary/[0.06] pb-4">
        Dados do Estabelecimento
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={LABEL_CLS}>Nome da Barbearia</label>
          <input type="text" value={form.owner_name ?? ''} onChange={e => update('owner_name', e.target.value)} className={INPUT_CLS} placeholder="Nome do dono" />
        </div>
        <div>
          <label className={LABEL_CLS}>Telefone Principal</label>
          <IMaskInput 
            mask="(00) 00000-0000"
            value={form.business_phone ?? ''} 
            onAccept={(value: string) => update('business_phone', value)} 
            className={INPUT_CLS} 
            placeholder="(11) 99999-9999" 
          />
        </div>
        <div>
          <label className={LABEL_CLS}>E-mail</label>
          <input type="email" value={form.business_email ?? ''} onChange={e => update('business_email', e.target.value)} className={INPUT_CLS} placeholder="contato@barbearia.com" />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL_CLS}>Endereço Completo</label>
          <input type="text" value={form.address ?? ''} onChange={e => update('address', e.target.value)} className={INPUT_CLS} placeholder="Rua, número, bairro" />
        </div>
        <div>
          <label className={LABEL_CLS}>Cidade</label>
          <input type="text" value={form.city ?? ''} onChange={e => update('city', e.target.value)} className={INPUT_CLS} placeholder="São Paulo" />
        </div>
        <div>
          <label className={LABEL_CLS}>Estado</label>
          <input type="text" value={form.state ?? ''} onChange={e => update('state', e.target.value)} className={INPUT_CLS} placeholder="SP" maxLength={2} />
        </div>
        <div>
          <label className={LABEL_CLS}>Instagram</label>
          <input type="text" value={form.instagram_handle ?? ''} onChange={e => update('instagram_handle', e.target.value)} className={INPUT_CLS} placeholder="@suabarbearia" />
        </div>
      </div>

      {/* Campos recomendados */}
      <div className="space-y-4 pt-4 border-t border-primary/[0.06]">
        <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider">Informações Estratégicas</h3>
        <div>
          <label className={LABEL_CLS}>Descrição Curta</label>
          <textarea value={form.description ?? ''} onChange={e => update('description', e.target.value)} className={TEXTAREA_CLS} rows={2} placeholder="Barbearia premium especializada em..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Estilo da Barbearia</label>
            <select value={form.business_style ?? ''} onChange={e => update('business_style', e.target.value)} className={INPUT_CLS}>
              <option value="">Selecione...</option>
              <option value="classica">Clássica</option>
              <option value="moderna">Moderna</option>
              <option value="premium">Premium</option>
              <option value="urbana">Urbana</option>
              <option value="vintage">Vintage</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Público-Alvo</label>
            <input type="text" value={form.target_audience ?? ''} onChange={e => update('target_audience', e.target.value)} className={INPUT_CLS} placeholder="Jovens, executivos, etc." />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Diferenciais do Negócio</label>
          <textarea value={form.differentiators ?? ''} onChange={e => update('differentiators', e.target.value)} className={TEXTAREA_CLS} rows={2} placeholder="O que torna sua barbearia única?" />
        </div>
      </div>

      {/* Save button */}
      <div className="pt-4 border-t border-primary/[0.06]">
        <button
          type="submit"
          disabled={saving}
          className="btn-gold flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}
