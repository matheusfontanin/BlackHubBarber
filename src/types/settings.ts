/**
 * Types para Configurações — BlackHub Barber
 *
 * Domínios: Barbearia, IA, Agenda, Equipe, Integrações
 * Todos ligados ao tenant_id (multi-tenant).
 *
 * Fonte da verdade: src/schemas/*. Este arquivo reexporta os tipos
 * inferidos dos schemas Zod para manter compatibilidade com imports
 * legados de `@/types/settings`.
 */

export type { TenantSettings } from '@/schemas/tenantSettingsSchema';
export type {
  AiSettings as TenantAISettings,
  ToneOfVoice,
  ServiceStyle,
} from '@/schemas/aiSettingsSchema';
export type { BookingSettings as TenantBookingSettings } from '@/schemas/bookingSettingsSchema';

// ─── Barber (Profissional da equipe) ─────────────────────────
export interface Barber {
  id?: string;
  tenant_id: string;
  name: string;
  role: string;
  phone: string | null;
  specialties: string | null;
  notes: string | null;
  google_calendar_id: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Tenant Integration Settings ─────────────────────────────
export interface TenantIntegrationSettings {
  id?: string;
  tenant_id: string;
  provider: string;
  config: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  last_sync_at: string | null;
  error_message: string | null;
  created_at?: string;
  updated_at?: string;
}

// ─── Dados consolidados de integrações para a UI ─────────────
export interface IntegrationsOverview {
  whatsapp: {
    status: string;
    instance_name: string | null;
    phone: string | null;
  };
  google_calendar: {
    connected: boolean;
    email: string | null;
  };
  n8n: {
    webhook_url: string | null;
    status: string;
  };
}

// ─── Settings Tab Types ──────────────────────────────────────
export type SettingsTab = 'barbershop' | 'team' | 'booking' | 'ai' | 'integrations';
