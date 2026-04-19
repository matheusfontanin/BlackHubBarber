-- Migration 00009: AI decision logs — Etapa 05 (Observabilidade de IA)
-- Tabela de auditoria com o contexto exato enviado à IA, decisão, tools chamadas,
-- métricas de custo/latência e outcome. Permite reconstruir o raciocínio por mensagem
-- e alimentar o painel de diagnóstico.

-- =============================================================
-- 1. Tabela ai_decision_logs
-- =============================================================
CREATE TABLE IF NOT EXISTS ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Contexto enviado para a IA
  system_prompt_snapshot TEXT,
  user_message TEXT,
  conversation_history JSONB,

  -- Decisão da IA
  model TEXT NOT NULL,
  response_text TEXT,
  tool_calls JSONB,
  reasoning TEXT,

  -- Métricas
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  latency_ms INT,

  -- Outcome
  outcome TEXT CHECK (outcome IN ('replied','tool_call','escalated','error','no_response')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_tenant_created
  ON ai_decision_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_logs_conversation
  ON ai_decision_logs (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_logs_message
  ON ai_decision_logs (message_id);

-- =============================================================
-- 2. RLS
-- =============================================================
ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_can_read_own_ai_logs" ON ai_decision_logs;
CREATE POLICY "tenant_can_read_own_ai_logs" ON ai_decision_logs
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- Bypass do tenant dev (mesmo padrão das outras tabelas)
DROP POLICY IF EXISTS "dev_tenant_bypass_ai_decision_logs" ON ai_decision_logs;
CREATE POLICY "dev_tenant_bypass_ai_decision_logs" ON ai_decision_logs
  FOR ALL
  USING (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- =============================================================
-- 3. RPC get_ai_health — agrega métricas por período (em dias)
-- =============================================================
CREATE OR REPLACE FUNCTION get_ai_health(p_tenant_id UUID, p_period_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_since TIMESTAMPTZ := NOW() - (p_period_days || ' days')::INTERVAL;
  v_total INT;
  v_cost NUMERIC(12,4);
  v_avg_latency NUMERIC(12,2);
  v_p95_latency NUMERIC(12,2);
  v_escalated INT;
  v_errors INT;
  v_replied INT;
  v_tool_calls INT;
  v_cost_by_day JSONB;
  v_tools_usage JSONB;
  v_appointments_created INT;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(cost_usd), 0),
    COALESCE(AVG(latency_ms), 0),
    COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0),
    COUNT(*) FILTER (WHERE outcome = 'escalated'),
    COUNT(*) FILTER (WHERE outcome = 'error'),
    COUNT(*) FILTER (WHERE outcome = 'replied'),
    COUNT(*) FILTER (WHERE outcome = 'tool_call')
  INTO
    v_total, v_cost, v_avg_latency, v_p95_latency,
    v_escalated, v_errors, v_replied, v_tool_calls
  FROM ai_decision_logs
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  -- Custo por dia
  SELECT COALESCE(
    jsonb_agg(row_to_json(t) ORDER BY t.day),
    '[]'::jsonb
  )
  INTO v_cost_by_day
  FROM (
    SELECT
      date_trunc('day', created_at)::date AS day,
      SUM(cost_usd)::numeric(12,4) AS cost,
      COUNT(*) AS messages
    FROM ai_decision_logs
    WHERE tenant_id = p_tenant_id
      AND created_at >= v_since
    GROUP BY 1
  ) t;

  -- Tools mais usadas
  SELECT COALESCE(
    jsonb_agg(row_to_json(t) ORDER BY t.uses DESC),
    '[]'::jsonb
  )
  INTO v_tools_usage
  FROM (
    SELECT
      tool->>'name' AS name,
      COUNT(*) AS uses
    FROM ai_decision_logs l,
         LATERAL jsonb_array_elements(l.tool_calls) AS tool
    WHERE l.tenant_id = p_tenant_id
      AND l.created_at >= v_since
      AND l.tool_calls IS NOT NULL
      AND jsonb_typeof(l.tool_calls) = 'array'
    GROUP BY tool->>'name'
  ) t;

  -- Contagem de agendamentos criados pela IA (tool_name = 'create_appointment')
  SELECT COUNT(*)
  INTO v_appointments_created
  FROM ai_decision_logs l,
       LATERAL jsonb_array_elements(l.tool_calls) AS tool
  WHERE l.tenant_id = p_tenant_id
    AND l.created_at >= v_since
    AND l.tool_calls IS NOT NULL
    AND jsonb_typeof(l.tool_calls) = 'array'
    AND tool->>'name' = 'create_appointment';

  RETURN jsonb_build_object(
    'period_days', p_period_days,
    'since', v_since,
    'total_messages', v_total,
    'total_cost_usd', v_cost,
    'avg_latency_ms', v_avg_latency,
    'p95_latency_ms', v_p95_latency,
    'escalation_count', v_escalated,
    'error_count', v_errors,
    'replied_count', v_replied,
    'tool_call_count', v_tool_calls,
    'appointments_created_by_ai', v_appointments_created,
    'cost_by_day', v_cost_by_day,
    'tools_usage', v_tools_usage
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_ai_health(UUID, INT) TO anon, authenticated;
