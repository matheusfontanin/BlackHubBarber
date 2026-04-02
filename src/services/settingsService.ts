/**
 * Settings Service — BlackHub Barber
 * 
 * Serviço semântico para leitura/escrita de configurações.
 * Todas as operações exigem tenant_id (multi-tenant).
 */

import { supabase } from '@/lib/supabase/client';
import type {
  TenantSettings,
  TenantAISettings,
  TenantBookingSettings,
  IntegrationsOverview,
} from '@/types/settings';

// ─── Barbershop Settings ─────────────────────────────────────

export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertTenantSettings(settings: Partial<TenantSettings> & { tenant_id: string }): Promise<TenantSettings> {
  const payload = { ...settings, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('tenant_settings')
    .upsert(payload, { onConflict: 'tenant_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── AI Settings ─────────────────────────────────────────────

export async function getAISettings(tenantId: string): Promise<TenantAISettings | null> {
  const { data, error } = await supabase
    .from('tenant_ai_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertAISettings(settings: Partial<TenantAISettings> & { tenant_id: string }): Promise<TenantAISettings> {
  const payload = { ...settings, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('tenant_ai_settings')
    .upsert(payload, { onConflict: 'tenant_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Booking Settings ────────────────────────────────────────

export async function getBookingSettings(tenantId: string): Promise<TenantBookingSettings | null> {
  const { data, error } = await supabase
    .from('tenant_booking_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertBookingSettings(settings: Partial<TenantBookingSettings> & { tenant_id: string }): Promise<TenantBookingSettings> {
  const payload = { ...settings, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('tenant_booking_settings')
    .upsert(payload, { onConflict: 'tenant_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Integrations Overview (leitura consolidada) ─────────────

export async function getIntegrationsOverview(tenantId: string): Promise<IntegrationsOverview> {
  // Dados do tenant principal (WhatsApp + Google Calendar)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('whatsapp_instance_id, whatsapp_connected, whatsapp_instance, google_calendar_connected, google_calendar_id')
    .eq('id', tenantId)
    .single();

  // Integrações do tenant_integrations
  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenantId);

  const n8nInteg = integrations?.find(i => i.provider === 'n8n');

  return {
    whatsapp: {
      status: tenant?.whatsapp_connected ? 'connected' : 'disconnected',
      instance_name: tenant?.whatsapp_instance ?? null,
      phone: null,
    },
    google_calendar: {
      connected: tenant?.google_calendar_connected ?? false,
      email: tenant?.google_calendar_id ?? null,
    },
    n8n: {
      webhook_url: (n8nInteg?.config as Record<string, unknown>)?.webhook_url as string ?? null,
      status: n8nInteg?.status ?? 'disconnected',
    },
  };
}

// ─── Carregar dados da barbearia do tenant (para popular settings iniciais) ──

export async function getTenantBasicData(tenantId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, owner_name, phone, email, address, city, state, instagram_handle, opening_hours')
    .eq('id', tenantId)
    .single();

  if (error) throw error;
  return data;
}
