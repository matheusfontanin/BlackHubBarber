# Etapa 05 — Observabilidade de IA

**Duração estimada:** 2-3 dias
**Depende de:** [04 — Preparação N8N + Evolution](04-preparacao-n8n-evolution.md)
**Prioridade:** 🟡 Alta

## Por que existe

Quando um cliente reclamar "a IA marcou errado" ou "a IA foi grossa comigo", você precisa ser capaz de:
1. Achar a conversa exata
2. Ver o que a IA **sabia** naquele momento (prompt + histórico)
3. Ver o que a IA **decidiu** e **por quê**
4. Ver quais tools ela chamou e com quais argumentos
5. Ver custo (tokens + dinheiro)

Sem isso, debugging é impossível e o barbeiro perde confiança na IA.

---

## 5.1 — Schema de logs

### `ai_decision_logs`
```sql
CREATE TABLE ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Contexto enviado para a IA
  system_prompt_snapshot TEXT,          -- prompt exato daquele momento
  user_message TEXT,                    -- mensagem do cliente
  conversation_history JSONB,           -- últimas N mensagens enviadas como contexto

  -- Decisão da IA
  model TEXT NOT NULL,                  -- 'claude-opus-4-6'
  response_text TEXT,                   -- o que a IA respondeu em texto
  tool_calls JSONB,                     -- [{name, arguments, result}]
  reasoning TEXT,                       -- se a IA expôs raciocínio

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

CREATE INDEX idx_ai_logs_tenant_created ON ai_decision_logs (tenant_id, created_at DESC);
CREATE INDEX idx_ai_logs_conversation ON ai_decision_logs (conversation_id, created_at DESC);
```

RLS: `tenant_id` filter como as outras tabelas.

---

## 5.2 — Como o N8N grava

O N8N, após cada chamada à IA, envia POST para:

```
POST /functions/v1/ai-log
Authorization: Bearer <service_role_key>
Body: { tenant_id, conversation_id, message_id, system_prompt_snapshot, ... }
```

Edge Function `ai-log` insere em `ai_decision_logs`.

### Tarefas

- [ ] Criar migration `00006_ai_decision_logs.sql`
- [ ] Criar Edge Function `ai-log`
- [ ] Atualizar workflows N8N em [n8n/](n8n/) para chamar `ai-log` após cada turno
- [ ] Documentar payload esperado em [docs/n8n/ai-log-contract.md](docs/n8n/ai-log-contract.md)

---

## 5.3 — UI: Timeline de decisões por conversa

Na [ChatPage](src/pages/chat/ChatPage.tsx), ao abrir uma conversa, adicionar aba lateral (ou botão):

**"🔍 Raciocínio da IA"**

Ao clicar em uma mensagem da IA, mostrar:
- Prompt que estava ativo naquele momento (com highlight de diff se mudou)
- Tools chamadas e resultados
- Custo da resposta (tokens + USD)
- Latência
- Botão "Reportar erro" → cria issue no `docs/ai-collab/duvidas.md`

### Tarefas

- [ ] Criar componente `<AIReasoningPanel />` em [src/pages/chat/components/](src/pages/chat/components/)
- [ ] Query `useAIDecisionForMessage(messageId)` via TanStack Query
- [ ] Destaque visual nas mensagens com tool calls (badge "🔧 criou agendamento")

---

## 5.4 — Dashboard de saúde da IA

Página nova ou aba dentro de **Settings → IA → Diagnóstico**:

### Métricas mostradas
| Métrica | Fonte |
|---|---|
| Mensagens processadas (hoje/semana/mês) | `ai_decision_logs` count |
| Custo total (hoje/semana/mês) | SUM `cost_usd` |
| Latência média/p95 | AVG/PERCENTILE `latency_ms` |
| Taxa de escalação | `outcome='escalated'` / total |
| Taxa de erro | `outcome='error'` / total |
| Tools mais usadas | GROUP BY `tool_calls->>'name'` |
| Agendamentos criados pela IA | `tool_calls` contém `create_appointment` |

### Tarefas

- [ ] Criar view SQL `ai_health_metrics` materializada ou `RPC get_ai_health(tenant_id, period)`
- [ ] Componente `<AIHealthDashboard />`
- [ ] Gráfico de linha: custo por dia nos últimos 30 dias
- [ ] Gráfico de barras: tools mais usadas
- [ ] Alerta visual se custo > 80% de algum budget configurado (abre porta para billing limits no futuro)

---

## 5.5 — Alertas proativos

- [ ] Se `error_rate > 10%` nas últimas 100 mensagens → banner vermelho no dashboard
- [ ] Se `latency_p95 > 10s` → badge de atenção
- [ ] Se `cost_usd` excede budget mensal → e-mail + toast

---

## Critérios de aceitação

- [ ] Tabela `ai_decision_logs` criada com RLS
- [ ] Edge Function `ai-log` recebe e valida payloads
- [ ] N8N workflows atualizados para enviar logs
- [ ] Chat mostra painel de raciocínio quando usuário clica mensagem da IA
- [ ] Dashboard de saúde da IA acessível em `/settings/ai/diagnostico`
- [ ] Testes: inserção de log, consulta de histórico por conversa, agregação de métricas
- [ ] Performance: query de histórico < 100ms para 90 dias de dados
