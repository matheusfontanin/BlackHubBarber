-- ============================================================
-- BARBERFLOW — SCHEMA INICIAL v1
-- Multi-tenant SaaS para barbearias
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";  -- Para RAG (embeddings)

-- ============================================================
-- 1. TENANTS (Barbearias)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  instagram_handle TEXT,
  whatsapp_instance_id TEXT,
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  instagram_page_id TEXT,
  google_calendar_id TEXT,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  opening_hours JSONB DEFAULT '{}',
  ai_name TEXT DEFAULT 'Assistente',
  ai_personality TEXT DEFAULT 'Você é um atendente simpático e profissional de barbearia.',
  ai_custom_instructions TEXT,
  plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'professional', 'premium')),
  plan_status TEXT DEFAULT 'trialing' CHECK (plan_status IN ('trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TENANT MEMBERS
-- ============================================================
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'barber' CHECK (role IN ('owner', 'admin', 'barber')),
  display_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- ============================================================
-- 3. SERVICES
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CLIENTS (CRM)
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram_handle TEXT,
  instagram_id TEXT,
  birthday DATE,
  notes TEXT,
  preferences JSONB DEFAULT '{}',
  last_visit_at TIMESTAMPTZ,
  total_visits INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  referred_by UUID REFERENCES clients(id),
  referral_code TEXT UNIQUE,
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'instagram', 'manual', 'website')),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_instagram_id ON clients(instagram_id);
CREATE INDEX idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops);

-- ============================================================
-- 5. APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES tenant_members(id),
  service_id UUID NOT NULL REFERENCES services(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'no_show', 'canceled')),
  price DECIMAL(10,2),
  notes TEXT,
  source TEXT DEFAULT 'ai' CHECK (source IN ('ai', 'manual', 'website')),
  google_calendar_event_id TEXT,   -- ID do evento no Google Calendar
  reminder_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, starts_at);
CREATE INDEX idx_appointments_barber ON appointments(barber_id, starts_at);
CREATE INDEX idx_appointments_client ON appointments(client_id);

-- ============================================================
-- 6. CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. MESSAGES
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'ai', 'owner')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================================
-- 8. CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('broadcast', 'birthday', 'seasonal', 'follow_up', 'reactivation')),
  message_template TEXT NOT NULL,
  target_filter JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  total_recipients INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_read INT DEFAULT 0,
  interval_seconds INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. LOYALTY TRANSACTIONS
-- ============================================================
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire')),
  points INT NOT NULL,
  description TEXT,
  appointment_id UUID REFERENCES appointments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. REFERRALS
-- ============================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES clients(id),
  referred_id UUID NOT NULL REFERENCES clients(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. AI KNOWLEDGE BASE (com suporte a RAG via pgvector)
-- ============================================================
CREATE TABLE ai_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'correction', 'pending', 'rule', 'faq')),
  embedding vector(1536),           -- Para busca semântica (RAG)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON ai_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Função de busca semântica para RAG
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  tenant_uuid UUID,
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, question TEXT, answer TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, question, answer,
    1 - (embedding <=> query_embedding) AS similarity
  FROM ai_knowledge
  WHERE tenant_id = tenant_uuid
    AND is_active = TRUE
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ============================================================
-- 13. ANALYTICS EVENTS
-- ============================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  client_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_tenant_type ON analytics_events(tenant_id, event_type, created_at);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_members
  WHERE user_id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'services', 'clients', 'appointments', 'conversations',
    'messages', 'campaigns', 'loyalty_transactions', 'referrals',
    'products', 'ai_knowledge', 'analytics_events'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "tenant_isolation_%s" ON %I FOR ALL USING (tenant_id = get_user_tenant_id())',
      tbl, tbl
    );
  END LOOP;
END $$;

CREATE POLICY "users_see_own_tenant" ON tenants FOR SELECT USING (id = get_user_tenant_id());
CREATE POLICY "owners_update_tenant" ON tenants FOR UPDATE USING (id = get_user_tenant_id());
CREATE POLICY "users_see_own_membership" ON tenant_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "owners_manage_members" ON tenant_members FOR ALL USING (
  tenant_id = get_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM tenant_members
    WHERE user_id = auth.uid() AND role = 'owner' AND tenant_id = tenant_members.tenant_id
  )
);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN NEW.referral_code = UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8)); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_client_referral_code BEFORE INSERT ON clients FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Adiciona coluna para armazenar o refresh token do Google Calendar
-- Necessário para renovar access tokens server-side (N8N + Edge Functions)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Adiciona coluna whatsapp_instance no tenant (nome da instância Evolution API)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS whatsapp_instance TEXT;

-- Migration 00003: Tabelas do Prompt Master Final — BlackHub Barber
-- Cria tabelas faltantes conforme seção 5 do documento master:
-- regras_dinamicas, barber_schedules, tenant_integrations,
-- agent_logs, prompt_versions, customer_memories, audit_events

-- =============================================================
-- 1. regras_dinamicas — Regras ativas do negócio por tenant
-- =============================================================
CREATE TABLE IF NOT EXISTS regras_dinamicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,            -- ex: 'horario', 'servico', 'politica', 'atendimento'
  rule_key TEXT NOT NULL,            -- ex: 'horario_sabado', 'aceita_sinal'
  rule_value JSONB NOT NULL,         -- valor estruturado da regra
  description TEXT,                  -- descrição legível da regra
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, category, rule_key)
);

ALTER TABLE regras_dinamicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON regras_dinamicas
  USING (tenant_id = get_user_tenant_id());

CREATE INDEX idx_regras_tenant_category ON regras_dinamicas(tenant_id, category);
CREATE INDEX idx_regras_active ON regras_dinamicas(tenant_id, is_active) WHERE is_active = true;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON regras_dinamicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- 2. barber_schedules — Disponibilidade estrutural do barbeiro
-- =============================================================
CREATE TABLE IF NOT EXISTS barber_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES tenant_members(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=dom, 6=sab
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, barber_id, day_of_week),
  CHECK (end_time > start_time),
  CHECK (break_start IS NULL OR (break_end IS NOT NULL AND break_end > break_start))
);

ALTER TABLE barber_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON barber_schedules
  USING (tenant_id = get_user_tenant_id());

CREATE INDEX idx_barber_schedules_lookup ON barber_schedules(tenant_id, barber_id, day_of_week)
  WHERE is_active = true;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON barber_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- 3. tenant_integrations — Configuração de integrações por tenant
-- =============================================================
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,            -- 'whatsapp', 'google_calendar', 'instagram', 'stripe'
  config JSONB NOT NULL DEFAULT '{}',-- configuração específica do provider
  credentials JSONB DEFAULT '{}',    -- tokens, keys (encriptados em prod)
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, provider)
);

ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_integrations
  USING (tenant_id = get_user_tenant_id());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenant_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- 4. agent_logs — Rastreamento de execução de agentes IA
-- =============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,          -- 'CustomerAssistant', 'ScheduleManager', etc.
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'owner', 'system')),
  conversation_id UUID REFERENCES conversations(id),
  input JSONB NOT NULL,
  output JSONB,
  intent TEXT,
  action TEXT,
  confidence NUMERIC(4,3),
  latency_ms INTEGER,
  error TEXT,
  correlation_id UUID,              -- agrupa chamadas do mesmo fluxo
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON agent_logs
  USING (tenant_id = get_user_tenant_id());

CREATE INDEX idx_agent_logs_tenant_date ON agent_logs(tenant_id, created_at DESC);
CREATE INDEX idx_agent_logs_correlation ON agent_logs(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_agent_logs_agent ON agent_logs(tenant_id, agent_name, created_at DESC);

-- =============================================================
-- 5. prompt_versions — Versionamento de estado de regras
-- =============================================================
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,           -- snapshot completo das regras naquele momento
  change_summary TEXT NOT NULL,      -- o que mudou
  change_source TEXT NOT NULL CHECK (change_source IN ('owner_whatsapp', 'admin_dashboard', 'system', 'onboarding')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, version)
);

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON prompt_versions
  USING (tenant_id = get_user_tenant_id());

CREATE INDEX idx_prompt_versions_tenant ON prompt_versions(tenant_id, version DESC);

-- =============================================================
-- 6. customer_memories — Memórias úteis consolidadas do cliente
-- =============================================================
CREATE TABLE IF NOT EXISTS customer_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'behavior', 'note', 'summary')),
  content TEXT NOT NULL,
  relevance_score NUMERIC(3,2) DEFAULT 1.00,
  source TEXT NOT NULL DEFAULT 'ai', -- 'ai', 'owner', 'system'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE customer_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON customer_memories
  USING (tenant_id = get_user_tenant_id());

CREATE INDEX idx_customer_memories_client ON customer_memories(tenant_id, client_id, memory_type);
CREATE INDEX idx_customer_memories_relevance ON customer_memories(tenant_id, client_id, relevance_score DESC);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON customer_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- 7. audit_events — Registro de alterações críticas
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,          -- 'rule_updated', 'appointment_canceled', 'integration_changed'
  entity_type TEXT NOT NULL,         -- 'regras_dinamicas', 'appointments', 'tenant_integrations'
  entity_id UUID,
  actor_id UUID REFERENCES auth.users(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('owner', 'admin', 'system', 'ai')),
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON audit_events
  USING (tenant_id = get_user_tenant_id());

CREATE INDEX idx_audit_events_tenant_date ON audit_events(tenant_id, created_at DESC);
CREATE INDEX idx_audit_events_entity ON audit_events(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_events_type ON audit_events(tenant_id, event_type, created_at DESC);

