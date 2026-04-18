# Etapa 08 — Campanhas de Reengajamento

**Duração estimada:** 4-5 dias
**Depende de:** [04 — Preparação N8N/Evolution](04-preparacao-n8n-evolution.md) + [07 — Fidelidade](07-fidelidade.md) (opcional, mas sinérgico)
**Prioridade:** 🟢 Alto valor

## Objetivo

Trazer de volta clientes que sumiram. O barbeiro define regras ("clientes que não voltam há 45 dias"), um segmento é gerado automaticamente e mensagens são enviadas via N8N + Evolution API.

---

## 8.1 — Schema

### `campaigns`
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','completed','canceled')),

  -- Segmentação
  segment_rules JSONB NOT NULL,             -- ver 8.2
  estimated_reach INT,                      -- calculado ao editar segmento

  -- Canal e template
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  message_template TEXT NOT NULL,
  media_url TEXT,                           -- imagem opcional

  -- Agendamento
  send_at TIMESTAMPTZ,                      -- null = enviar agora
  send_in_batches BOOLEAN DEFAULT TRUE,     -- dilui ao longo do dia
  batch_size INT DEFAULT 20,
  batch_interval_minutes INT DEFAULT 30,

  -- Métricas (atualizadas em runtime)
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_read INT DEFAULT 0,
  total_replied INT DEFAULT 0,
  total_converted INT DEFAULT 0,            -- gerou agendamento

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `campaign_sends`
```sql
CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','replied','failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  converted_appointment_id UUID REFERENCES appointments(id),

  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8.2 — Construtor de segmentos

O `segment_rules` é um JSON estruturado. Exemplos:

```json
{
  "operator": "AND",
  "conditions": [
    { "field": "days_since_last_visit", "op": ">=", "value": 45 },
    { "field": "total_visits", "op": ">=", "value": 2 },
    { "field": "tags", "op": "not_contains", "value": "bloqueado" }
  ]
}
```

### Campos suportados

| Campo | Tipo | Operadores |
|---|---|---|
| `days_since_last_visit` | number | `>=`, `<=`, `=` |
| `total_visits` | number | todos |
| `total_spent_cents` | number | todos |
| `loyalty_points` | number | todos |
| `tier` | enum | `=`, `!=` |
| `tags` | array | `contains`, `not_contains` |
| `preferred_service_id` | uuid | `=`, `!=` |
| `birthday_month` | number | `=` |
| `age_range` | number | `>=`, `<=` |

### UI do construtor

Componente visual tipo "query builder":
```
┌──────────────────────────────────────────────┐
│ Clientes que correspondem a TODAS as regras: │
├──────────────────────────────────────────────┤
│ [Dias sem voltar ▼] [>= ▼] [45] [x]          │
│ [Total de visitas ▼] [>= ▼] [2] [x]          │
│ [+ Adicionar regra]                          │
│                                              │
│ 📊 Estimativa: 127 clientes correspondem     │
└──────────────────────────────────────────────┘
```

---

## 8.3 — Templates com placeholders

```
Oi {nome}! Faz {dias_sem_voltar} dias que você não passa aqui na {barbearia}.
Que tal marcar um corte essa semana?

Resposta esperada: "sim" / "não" / "quando"
```

Placeholders disponíveis: `{nome}`, `{barbearia}`, `{dias_sem_voltar}`, `{ultimo_servico}`, `{pontos}`, `{tier}`, `{link_agendamento}`.

---

## 8.4 — Execução

### Job agendado (Edge Function + cron)

- [ ] Edge Function `campaign-runner` executada a cada 5 minutos via `pg_cron`
- [ ] Processa campaigns com `status='running'` e `send_at <= NOW()`
- [ ] Para cada batch pendente, chama N8N webhook com lista de clientes
- [ ] N8N envia via Evolution API e atualiza `campaign_sends` via Edge Function `campaign-update-send`

### Conversão tracking

Quando um cliente responde a uma mensagem de campanha e agenda:
- [ ] N8N grava em `messages` normalmente
- [ ] Se houver `campaign_send` pending desse cliente nas últimas 72h, marca como `replied`
- [ ] Se o cliente criar agendamento, marca `converted` + `converted_appointment_id`

---

## 8.5 — UI

### Nova página: `/campaigns`

```
src/pages/campaigns/
├── CampaignsPage.tsx            (lista de campanhas)
├── CampaignEditorPage.tsx       (criar/editar wizard)
├── CampaignDetailsPage.tsx      (métricas, lista de sends)
├── components/
│   ├── SegmentBuilder.tsx
│   ├── TemplateEditor.tsx       (com preview ao vivo dos placeholders)
│   ├── CampaignMetrics.tsx      (funnel: enviadas → entregues → lidas → respondidas → convertidas)
│   └── CampaignScheduler.tsx
```

### Templates pré-prontos

Oferecer 5 templates iniciais:
1. "Reengajamento 30 dias"
2. "Aniversário"
3. "Boas-vindas (novo cliente)"
4. "Promoção especial"
5. "Pesquisa de satisfação"

O barbeiro clica, customiza texto e segmento, e está pronto.

---

## 8.6 — Guardrails

- [ ] Não enviar para o mesmo cliente se ele já recebeu campanha nas últimas 7 dias
- [ ] Não enviar se `clients.opted_out_marketing = true`
- [ ] Adicionar coluna `opted_out_marketing` em `clients`
- [ ] Rodapé obrigatório nas mensagens: "Para parar de receber, responda SAIR"
- [ ] Quando cliente responder "SAIR", N8N seta `opted_out_marketing = true`
- [ ] Rate limit global: máximo X mensagens/dia por tenant (proteger reputação do número)

---

## Critérios de aceitação

- [ ] Página `/campaigns` funcional
- [ ] Segment builder visual com estimativa em tempo real
- [ ] 5 templates pré-prontos
- [ ] `campaign-runner` Edge Function rodando em cron
- [ ] Tracking de conversão funciona (resposta → agendamento)
- [ ] Funnel visual (enviadas → convertidas)
- [ ] Opt-out respeitado
- [ ] Testes: criação, execução, conversão, opt-out
