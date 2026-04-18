import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff } from 'lucide-react';
import { buildSystemPrompt } from '@/lib/ai/promptBuilder';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase/client';
import type { TenantBusinessProfile, TenantAIConfig, TenantBookingRules, Service, Barber } from '@/types/settings';
import { handleSuccess } from '@/lib/errors';

interface PromptPreviewProps {
  profile?: TenantBusinessProfile;
  ai?: TenantAIConfig;
  booking?: TenantBookingRules;
  services?: Service[];
  barbers?: Barber[];
}

export function PromptPreview({ profile, ai, booking, services = [], barbers = [] }: PromptPreviewProps) {
  const { tenantId } = useTenant();
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState<string>('');

  useEffect(() => {
    if (!profile || !ai || !booking) {
      // Load from database if not provided
      if (!tenantId) return;

      const loadData = async () => {
        try {
          const [profileRes, aiRes, bookingRes, servicesRes, barbersRes] = await Promise.all([
            supabase.from('tenant_business_profile').select('*').eq('tenant_id', tenantId).single(),
            supabase.from('tenant_ai_config').select('*').eq('tenant_id', tenantId).single(),
            supabase.from('tenant_booking_rules').select('*').eq('tenant_id', tenantId).single(),
            supabase.from('services').select('*').eq('tenant_id', tenantId).eq('is_active', true),
            supabase.from('tenant_members').select('*').eq('tenant_id', tenantId).eq('is_active', true),
          ]);

          if (profileRes.data && aiRes.data && bookingRes.data) {
            const context = {
              profile: profileRes.data,
              ai: aiRes.data,
              booking: bookingRes.data,
              services: servicesRes.data || [],
              barbers: barbersRes.data || [],
            };
            setPrompt(buildSystemPrompt(context));
          }
        } catch (err) {
          console.error('Error loading prompt data:', err);
        }
      };

      loadData();
    } else {
      // Use provided data
      const context = { profile, ai, booking, services, barbers };
      setPrompt(buildSystemPrompt(context));
    }
  }, [profile, ai, booking, services, barbers, tenantId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      handleSuccess('Prompt copiado para a área de transferência!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
            <Eye size={16} className="text-gold" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-primary text-sm">🎯 Pré-visualização do Prompt</h3>
            <p className="text-xs text-muted">Veja como a IA "vê" sua barbearia</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted">
                Este é o prompt que será enviado ao modelo de IA. Atualiza automaticamente conforme você edita as configurações.
              </p>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg border border-border rounded-lg hover:bg-surface transition-colors text-xs"
              >
                <Copy size={12} />
                Copiar
              </button>
            </div>

            <div className="bg-bg border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono text-primary whitespace-pre-wrap leading-relaxed">
                {prompt || 'Carregando prompt...'}
              </pre>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}