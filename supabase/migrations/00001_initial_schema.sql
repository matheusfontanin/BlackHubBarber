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
