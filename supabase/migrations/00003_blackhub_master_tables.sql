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
