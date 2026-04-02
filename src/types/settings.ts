/**
 * Types para Configurações — BlackHub Barber
 * 
 * Domínios: Barbearia, IA, Agenda, Equipe, Integrações
 * Todos ligados ao tenant_id (multi-tenant)
 */

// ─── Tenant Settings (Dados complementares da barbearia) ─────
export interface TenantSettings {
  id?: string;
  tenant_id: string;
  owner_name: string | null;
  business_phone: string | null;
  business_email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  instagram_handle: string | null;
  description: string | null;
  business_style: string | null;
  target_audience: string | null;
  differentiators: string | null;
  updated_at?: string;
}

// ─── Tenant AI Settings ──────────────────────────────────────
export type ToneOfVoice = 'profissional' | 'descontraído' | 'premium';
export type ServiceStyle = 'direto' | 'consultivo' | 'acolhedor';

export interface TenantAISettings {
  id?: string;
  tenant_id: string;
  assistant_name: string;
  tone_of_voice: ToneOfVoice;
  service_style: ServiceStyle;
  business_summary: string | null;
  customer_profile: string | null;
  differentiators: string | null;
  important_notes: string | null;
  can_auto_schedule: boolean;
  must_confirm_before_booking: boolean;
  can_reply_outside_business_hours: boolean;
  greeting_message: string | null;
  out_of_hours_message: string | null;
  updated_at?: string;
}

// ─── Tenant Booking Settings ─────────────────────────────────
export interface TenantBookingSettings {
  id?: string;
  tenant_id: string;
  min_booking_notice_minutes: number;
  max_booking_notice_days: number;
  buffer_between_appointments_minutes: number;
  allow_ai_booking: boolean;
  require_manual_confirmation: boolean;
  cancellation_policy: string | null;
  reschedule_limit: number;
  confirmation_message_template: string | null;
  cancellation_message_template: string | null;
  updated_at?: string;
}

// ─── Barber (Profissional da equipe) ─────────────────────────
export interface Barber {
  id?: string;
  tenant_id: string;
  name: string;
  role: string;
  phone: string | null;
  specialties: string | null;
  notes: string | null;
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
