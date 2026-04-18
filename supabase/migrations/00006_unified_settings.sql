-- Migration 00006: Unified Settings — Etapa 03
-- Consolidar configurações em 3 tabelas: tenant_business_profile, tenant_ai_config, tenant_booking_rules
-- Migrar dados de tenant_settings, tenant_ai_settings, tenant_booking_settings

-- =============================================================
-- 1. tenant_business_profile — Tudo sobre o negócio
-- =============================================================
CREATE TABLE IF NOT EXISTS tenant_business_profile (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identidade
  legal_name TEXT,
  trade_name TEXT NOT NULL,
  owner_name TEXT,
  tagline TEXT,
  description TEXT,
  founded_year INT,
  logo_url TEXT,

  -- Contato
  business_phone TEXT NOT NULL,
  whatsapp_number TEXT,
  business_email TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  google_maps_url TEXT,

  -- Localização
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  landmark TEXT,

  -- Posicionamento
  business_style TEXT CHECK (business_style IN ('classica','moderna','premium','urbana','vintage','familiar')),
  target_audience TEXT,
  price_positioning TEXT CHECK (price_positioning IN ('popular','intermediario','premium','luxo')),
  differentiators TEXT,
  dress_code TEXT,
  amenities TEXT[],

  -- Horários
  opening_hours JSONB NOT NULL DEFAULT '{}',
  holiday_dates DATE[],
  special_hours JSONB,

  -- Pagamento
  payment_methods TEXT[],
  accepts_walk_in BOOLEAN DEFAULT TRUE,
  requires_deposit BOOLEAN DEFAULT FALSE,
  deposit_percentage INT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_business_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_can_read_own_profile" ON tenant_business_profile
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE TRIGGER set_updated_at_business_profile BEFORE UPDATE ON tenant_business_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- 2. tenant_ai_config — Tudo sobre o comportamento do agente
-- =============================================================
CREATE TABLE IF NOT EXISTS tenant_ai_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identidade do agente
  assistant_name TEXT NOT NULL DEFAULT 'Assistente',
  assistant_avatar_url TEXT,
  assistant_gender TEXT CHECK (assistant_gender IN ('masculino','feminino','neutro')),

  -- Personalidade
  tone_of_voice TEXT CHECK (tone_of_voice IN ('profissional','descontraido','premium','amigo')),
  service_style TEXT CHECK (service_style IN ('direto','consultivo','acolhedor')),
  formality_level INT CHECK (formality_level BETWEEN 1 AND 5),
  uses_emojis BOOLEAN DEFAULT TRUE,
  uses_slang BOOLEAN DEFAULT FALSE,

  -- Comportamento operacional
  can_auto_schedule BOOLEAN DEFAULT FALSE,
  must_confirm_before_booking BOOLEAN DEFAULT TRUE,
  can_reply_outside_business_hours BOOLEAN DEFAULT FALSE,
  can_suggest_services BOOLEAN DEFAULT TRUE,
  can_negotiate_price BOOLEAN DEFAULT FALSE,
  can_collect_feedback BOOLEAN DEFAULT TRUE,
  max_messages_before_escalation INT DEFAULT 20,
  escalation_keywords TEXT[],

  -- Contexto específico
  important_notes TEXT,
  forbidden_topics TEXT[],
  signature_services TEXT,
  upsell_guidelines TEXT,

  -- Mensagens padrão
  greeting_message TEXT,
  out_of_hours_message TEXT,
  booking_confirmation_template TEXT,
  booking_reminder_template TEXT,
  cancellation_message_template TEXT,
  post_service_thankyou TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_ai_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_can_read_own_ai_config" ON tenant_ai_config
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE TRIGGER set_updated_at_ai_config BEFORE UPDATE ON tenant_ai_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- 3. tenant_booking_rules — Apenas regras de agenda
-- =============================================================
CREATE TABLE IF NOT EXISTS tenant_booking_rules (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  min_booking_notice_minutes INT DEFAULT 60,
  max_booking_notice_days INT DEFAULT 30,
  buffer_between_appointments_minutes INT DEFAULT 10,
  allow_simultaneous_per_barber BOOLEAN DEFAULT FALSE,
  slot_granularity_minutes INT DEFAULT 15,

  reschedule_limit INT DEFAULT 2,
  reschedule_min_notice_hours INT DEFAULT 2,
  cancellation_min_notice_hours INT DEFAULT 2,
  cancellation_policy TEXT,

  no_show_penalty TEXT,
  no_show_blocks_future_bookings BOOLEAN DEFAULT FALSE,
  no_show_max_before_block INT DEFAULT 2,

  send_reminder_hours_before INT DEFAULT 24,
  send_confirmation_on_booking BOOLEAN DEFAULT TRUE,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_booking_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_can_read_own_booking_rules" ON tenant_booking_rules
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE TRIGGER set_updated_at_booking_rules BEFORE UPDATE ON tenant_booking_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- Migração de dados das tabelas antigas
-- =============================================================

-- Copiar de tenant_settings para tenant_business_profile
INSERT INTO tenant_business_profile (
  tenant_id, legal_name, trade_name, owner_name, tagline, description, founded_year, logo_url,
  business_phone, whatsapp_number, business_email, website_url, instagram_handle, google_maps_url,
  address_street, address_number, address_complement, address_neighborhood, city, state, zip_code, landmark,
  business_style, target_audience, price_positioning, differentiators, dress_code, amenities,
  opening_hours, holiday_dates, special_hours,
  payment_methods, accepts_walk_in, requires_deposit, deposit_percentage
)
SELECT
  tenant_id,
  legal_name,
  trade_name,
  owner_name,
  tagline,
  description,
  founded_year,
  logo_url,
  business_phone,
  whatsapp_number,
  business_email,
  website_url,
  instagram_handle,
  google_maps_url,
  address_street,
  address_number,
  address_complement,
  address_neighborhood,
  city,
  state,
  zip_code,
  landmark,
  business_style,
  COALESCE(target_audience, customer_profile) AS target_audience,
  price_positioning,
  differentiators,
  dress_code,
  amenities,
  opening_hours,
  holiday_dates,
  special_hours,
  payment_methods,
  accepts_walk_in,
  requires_deposit,
  deposit_percentage
FROM tenant_settings
ON CONFLICT (tenant_id) DO NOTHING;

-- Copiar de tenant_ai_settings para tenant_ai_config
INSERT INTO tenant_ai_config (
  tenant_id, assistant_name, assistant_avatar_url, assistant_gender,
  tone_of_voice, service_style, formality_level, uses_emojis, uses_slang,
  can_auto_schedule, must_confirm_before_booking, can_reply_outside_business_hours,
  can_suggest_services, can_negotiate_price, can_collect_feedback,
  max_messages_before_escalation, escalation_keywords,
  important_notes, forbidden_topics, signature_services, upsell_guidelines,
  greeting_message, out_of_hours_message, booking_confirmation_template,
  booking_reminder_template, cancellation_message_template, post_service_thankyou
)
SELECT
  tenant_id,
  assistant_name,
  assistant_avatar_url,
  assistant_gender,
  tone_of_voice,
  service_style,
  formality_level,
  uses_emojis,
  uses_slang,
  can_auto_schedule,
  COALESCE(must_confirm_before_booking, require_manual_confirmation) AS must_confirm_before_booking,
  can_reply_outside_business_hours,
  can_suggest_services,
  can_negotiate_price,
  can_collect_feedback,
  max_messages_before_escalation,
  escalation_keywords,
  important_notes,
  forbidden_topics,
  signature_services,
  upsell_guidelines,
  greeting_message,
  out_of_hours_message,
  booking_confirmation_template,
  booking_reminder_template,
  cancellation_message_template,
  post_service_thankyou
FROM tenant_ai_settings
ON CONFLICT (tenant_id) DO NOTHING;

-- Copiar de tenant_booking_settings para tenant_booking_rules
INSERT INTO tenant_booking_rules (
  tenant_id, min_booking_notice_minutes, max_booking_notice_days,
  buffer_between_appointments_minutes, allow_simultaneous_per_barber,
  slot_granularity_minutes, reschedule_limit, reschedule_min_notice_hours,
  cancellation_min_notice_hours, cancellation_policy,
  no_show_penalty, no_show_blocks_future_bookings, no_show_max_before_block,
  send_reminder_hours_before, send_confirmation_on_booking
)
SELECT
  tenant_id,
  min_booking_notice_minutes,
  max_booking_notice_days,
  buffer_between_appointments_minutes,
  allow_simultaneous_per_barber,
  slot_granularity_minutes,
  reschedule_limit,
  reschedule_min_notice_hours,
  cancellation_min_notice_hours,
  cancellation_policy,
  no_show_penalty,
  no_show_blocks_future_bookings,
  no_show_max_before_block,
  send_reminder_hours_before,
  send_confirmation_on_booking
FROM tenant_booking_settings
ON CONFLICT (tenant_id) DO NOTHING;

-- Marcar tabelas antigas como deprecated (remover em release futuro)
COMMENT ON TABLE tenant_settings IS 'DEPRECATED: migrado para tenant_business_profile, tenant_ai_config, tenant_booking_rules. Remover em 2026-05';
COMMENT ON TABLE tenant_ai_settings IS 'DEPRECATED: migrado para tenant_business_profile, tenant_ai_config, tenant_booking_rules. Remover em 2026-05';
COMMENT ON TABLE tenant_booking_settings IS 'DEPRECATED: migrado para tenant_business_profile, tenant_ai_config, tenant_booking_rules. Remover em 2026-05';