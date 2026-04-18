import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, ImagePlus, Trash2, Scissors } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import {
  getTenantSettings,
  upsertTenantSettings,
  getTenantBasicData,
  getTenantLogo,
  updateTenantLogo,
} from '@/services/settingsService';
import type { TenantSettings } from '@/types/settings';
import { IMaskInput } from 'react-imask';
import { handleError, handleSuccess } from '@/lib/errors';

const MAX_LOGO_BYTES = 500 * 1024; // 500KB hard cap on stored base64
const MAX_LOGO_DIMENSION = 512;    // pixels (longest edge) before encoding

/**
 * Reads a file, rasterizes to a canvas with max dimension of 512px and
 * returns a base64 data URL. SVGs are passed through unchanged.
 */
async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler SVG'));
      reader.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');
  ctx.drawImage(bitmap, 0, 0, w, h);

  // PNG preserves transparency for logos
  return canvas.toDataURL('image/png');
}

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

export default function BarbershopSettingsSection() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<TenantSettings>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tenantId) return;
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Tenta carregar settings complementares
      const [settings, tenantLogo] = await Promise.all([
        getTenantSettings(tenantId!),
        getTenantLogo(tenantId!),
      ]);

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

      setLogoUrl(tenantLogo);
    } catch (err) {
      handleError(err, 'Não foi possível carregar os dados da barbearia');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting same file
    if (!file || !tenantId) return;
    setLogoError(null);

    if (!file.type.startsWith('image/')) {
      setLogoError('Envie um arquivo de imagem (PNG, JPG, SVG ou WEBP).');
      return;
    }

    setLogoUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      if (dataUrl.length > MAX_LOGO_BYTES * 1.37 /* base64 overhead */) {
        setLogoError('Logo muito grande. Envie uma imagem menor (máx. ~500KB após compressão).');
        return;
      }
      await updateTenantLogo(tenantId, dataUrl);
      setLogoUrl(dataUrl);
      window.dispatchEvent(new CustomEvent('tenant-logo-updated', { detail: dataUrl }));
    } catch (err) {
      handleError(err, 'Não foi possível enviar o logo. Tente novamente.');
      setLogoError('Não foi possível enviar o logo. Tente novamente.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!tenantId) return;
    setLogoUploading(true);
    try {
      await updateTenantLogo(tenantId, null);
      setLogoUrl(null);
      window.dispatchEvent(new CustomEvent('tenant-logo-updated', { detail: null }));
    } catch (err) {
      handleError(err, 'Não foi possível remover o logo.');
      setLogoError('Não foi possível remover o logo.');
    } finally {
      setLogoUploading(false);
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
      handleSuccess('Configurações salvas');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleError(err, 'Erro ao salvar configurações');
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
      {/* Logo uploader */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-medium tracking-tight text-primary">
            Logo da Barbearia
          </h2>
          <span className="text-[10px] font-bold text-faint uppercase tracking-wider hidden sm:inline">
            Aparece no menu lateral
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-20 h-20 rounded-2xl bg-surface border border-border2 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Scissors size={26} className="text-gold/50" />
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/25 text-gold text-xs font-bold uppercase tracking-wider hover:bg-gold/10 transition-all disabled:opacity-40"
              >
                {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </button>

              {logoUrl && !logoUploading && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border2 text-muted hover:text-error hover:border-red-500/30 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>
            <p className="text-[10px] text-faint leading-relaxed">
              PNG, JPG, SVG ou WEBP. O logo aparece no menu lateral. Ideal: quadrado, fundo transparente, até 500KB.
            </p>
            {logoError && (
              <p className="text-[11px] text-error font-semibold">{logoError}</p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </div>
      </section>

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
