-- Migration 00010: Pilar Comercial (Patch Final)
-- Ajusta conversations, messages e tenant_ai_config para o fluxo N8N + Evolution + IA.
-- Referência: blackhub_patch_final.md + docs/ai-collab/patch-comercial-plano-execucao.md

-- =============================================================
-- 1. conversations: contato externo + flag de IA por conversa
-- =============================================================
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS external_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS external_contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- client_id vira nullable: conversa pode existir antes do cliente formal ser criado
-- (criação do cliente só acontece quando a IA capta o nome do contato).
ALTER TABLE conversations ALTER COLUMN client_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_external_phone
  ON conversations (tenant_id, external_contact_phone)
  WHERE external_contact_phone IS NOT NULL;

-- =============================================================
-- 2. messages: direção + payload bruto recebido do Evolution/N8N
-- =============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS direction TEXT
    CHECK (direction IN ('inbound','outbound')),
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- Backfill: mensagens antigas do cliente = inbound; IA/owner = outbound
UPDATE messages SET direction = CASE
  WHEN role = 'client' THEN 'inbound'
  ELSE 'outbound'
END
WHERE direction IS NULL;

-- =============================================================
-- 3. tenant_ai_config: flag global para pausar IA em todas as conversas
-- =============================================================
ALTER TABLE tenant_ai_config
  ADD COLUMN IF NOT EXISTS ai_globally_enabled BOOLEAN NOT NULL DEFAULT TRUE;
