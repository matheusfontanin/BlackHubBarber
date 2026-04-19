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

// ─── Novos tipos unificados (Etapa 03) ───────────────────────
export interface TenantBusinessProfile {
  tenant_id: string;
  legal_name?: string;
  trade_name: string;
  owner_name?: string;
  tagline?: string;
  description?: string;
  founded_year?: number;
  logo_url?: string;
  business_phone: string;
  whatsapp_number?: string;
  business_email?: string;
  website_url?: string;
  instagram_handle?: string;
  google_maps_url?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  landmark?: string;
  business_style?: 'classica' | 'moderna' | 'premium' | 'urbana' | 'vintage' | 'familiar';
  target_audience?: string;
  price_positioning?: 'popular' | 'intermediario' | 'premium' | 'luxo';
  differentiators?: string;
  dress_code?: string;
  amenities?: string[];
  opening_hours?: Record<string, unknown>;
  holiday_dates?: string[];
  special_hours?: Record<string, unknown>;
  payment_methods?: string[];
  accepts_walk_in?: boolean;
  requires_deposit?: boolean;
  deposit_percentage?: number;
  updated_at?: string;
}

export interface TenantAIConfig {
  tenant_id: string;
  assistant_name?: string;
  assistant_avatar_url?: string;
  assistant_gender?: 'masculino' | 'feminino' | 'neutro';
  tone_of_voice?: 'profissional' | 'descontraido' | 'premium' | 'amigo';
  service_style?: 'direto' | 'consultivo' | 'acolhedor';
  formality_level?: number;
  uses_emojis?: boolean;
  uses_slang?: boolean;
  can_auto_schedule?: boolean;
  must_confirm_before_booking?: boolean;
  can_reply_outside_business_hours?: boolean;
  ai_globally_enabled?: boolean;
  can_suggest_services?: boolean;
  can_negotiate_price?: boolean;
  can_collect_feedback?: boolean;
  max_messages_before_escalation?: number;
  escalation_keywords?: string[];
  important_notes?: string;
  forbidden_topics?: string[];
  signature_services?: string;
  upsell_guidelines?: string;
  greeting_message?: string;
  out_of_hours_message?: string;
  booking_confirmation_template?: string;
  booking_reminder_template?: string;
  cancellation_message_template?: string;
  post_service_thankyou?: string;
  updated_at?: string;
}

export interface TenantBookingRules {
  tenant_id: string;
  min_booking_notice_minutes?: number;
  max_booking_notice_days?: number;
  buffer_between_appointments_minutes?: number;
  allow_simultaneous_per_barber?: boolean;
  slot_granularity_minutes?: number;
  reschedule_limit?: number;
  reschedule_min_notice_hours?: number;
  cancellation_min_notice_hours?: number;
  cancellation_policy?: string;
  no_show_penalty?: string;
  no_show_blocks_future_bookings?: boolean;
  no_show_max_before_block?: number;
  send_reminder_hours_before?: number;
  send_confirmation_on_booking?: boolean;
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

// ─── Service (Serviço oferecido) ────────────────────────────
export interface Service {
  id?: string;
  tenant_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
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
  google_calendar_id: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Settings Tab Types ──────────────────────────────────────
export type SettingsTab = 'barbershop' | 'team' | 'booking' | 'ai' | 'diagnostics' | 'integrations';
