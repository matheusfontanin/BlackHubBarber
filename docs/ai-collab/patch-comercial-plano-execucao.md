# Plano de Execução — BLACKHUB PATCH FINAL (Pilar Comercial)

> **Fonte do patch:** [../../blackhub_patch_final.md](../../blackhub_patch_final.md)
> **Criado em:** 2026-04-19
> **Status:** Em execução

Este documento é o contrato de execução do patch final (WhatsApp + IA + N8N + Chat). Ele foi construído após auditoria de conformidade contra as Etapas da Evolução já OK (00 → 05). Se a sessão for interrompida, retome pelo próximo item marcado ⏳.

---

## Decisões tomadas antes de executar

| # | Decisão | Motivo |
|---|---|---|
| D1 | **IA nos nós N8N = OpenAI GPT-4o Mini** (inclusive para responder ao cliente) | Decisão do usuário 2026-04-19 — substitui Claude previsto na Etapa 04 |
| D2 | **Envio manual do dono via Edge Function `evolution-proxy`** (não direto da UI) | Segurança: chave da Evolution nunca sai do servidor. Alinhado com Etapa 04 linha 40 |
| D3 | **`ai_globally_enabled` dentro de `tenant_ai_config`** (não criar `tenant_chat_settings`) | Preserva unificação da Etapa 03; evita fragmentar configs da IA |
| D4 | `conversations.client_id` passa a ser **nullable** | Permite criar conversa apenas com telefone antes do cliente existir |
| D5 | Resto do patch segue como escrito | — |

---

## 1. Banco de dados

### 1.1 Migration `00010_commercial_pillar.sql` ⏳

Arquivo: `supabase/migrations/00010_commercial_pillar.sql`

**Conteúdo:**

```sql
-- Migration 00010: Pilar Comercial (Patch Final)
-- Ajusta conversations, messages e tenant_ai_config para o fluxo N8N + Evolution + IA.

-- 1. conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS external_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS external_contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE conversations ALTER COLUMN client_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_external_phone
  ON conversations (tenant_id, external_contact_phone)
  WHERE external_contact_phone IS NOT NULL;

-- 2. messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS direction TEXT
    CHECK (direction IN ('inbound','outbound')),
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- Backfill de direction para mensagens existentes (client = inbound; ai/owner = outbound)
UPDATE messages SET direction = CASE
  WHEN role = 'client' THEN 'inbound'
  ELSE 'outbound'
END
WHERE direction IS NULL;

-- 3. tenant_ai_config: flag global de IA
ALTER TABLE tenant_ai_config
  ADD COLUMN IF NOT EXISTS ai_globally_enabled BOOLEAN NOT NULL DEFAULT TRUE;
```

**Checklist de execução:**
- [ ] Criar arquivo
- [ ] Rodar migration em dev (`supabase db push` ou aplicar via painel)
- [ ] Confirmar RLS continua válida (as novas colunas herdam policy do tenant_isolation)
- [ ] Atualizar tipos em `src/types/` e `src/services/chatService.ts` (ver 1.2)

### 1.2 Tipos TypeScript ⏳

Arquivos a atualizar:
- `src/services/chatService.ts` — adicionar em `Conversation`: `external_contact_phone?: string | null`, `external_contact_name?: string | null`, `ai_enabled: boolean`; em `Message`: `direction?: 'inbound' | 'outbound'`, `raw_payload?: Record<string, unknown> | null`
- `src/schemas/aiSettingsSchema.ts` — adicionar `ai_globally_enabled: z.boolean().default(true)`

---

## 2. Chat UI

### 2.1 Sidebar: fallback de telefone + badge IA ⏳

Arquivo: `src/pages/chat/components/ConversationList.tsx`

**Mudanças:**
1. Exibição do nome (linha ~152):
   ```tsx
   {conv.clients?.name
     ?? conv.external_contact_name
     ?? formatPhone(conv.external_contact_phone)
     ?? 'Desconhecido'}
   ```
2. Logo abaixo do nome, badge compacta de status da IA:
   ```tsx
   <span className={cn(
     'text-[9px] font-bold uppercase tracking-wider',
     conv.ai_enabled ? 'text-emerald-400' : 'text-amber-400'
   )}>
     {conv.ai_enabled ? 'IA ativa' : 'IA pausada'}
   </span>
   ```
3. Adicionar helper `formatPhone` em `src/pages/chat/utils.ts` (ou constants) — máscara `(DD) 9XXXX-XXXX` simples.

### 2.2 Header da conversa: pausar/ativar IA ⏳

Arquivo: `src/pages/chat/components/MessageThread.tsx` (ou header da conversa — verificar se há `MessageThreadHeader` dedicado; se não, criar).

**Componente a adicionar** no topo da thread:
- Indicador: pílula "IA ativa" (verde) ou "IA pausada" (âmbar)
- Botão ao lado: "Pausar IA" / "Ativar IA" (alterna)
- Ao clicar, chamar `chatService.toggleConversationAI(conversationId, next)` (função nova).

**Adicionar em `chatService.ts`:**
```ts
async toggleConversationAI(conversationId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ ai_enabled: enabled })
    .eq('id', conversationId);
  if (error) throw error;
},
```

Integrar via TanStack:
- Hook novo `src/pages/chat/hooks/useToggleConversationAI.ts` — `useMutation` que invalida `['conversations', tenantId]` e `['conversation', conversationId]`.

### 2.3 Controle global de IA ⏳

Dois caminhos permitidos pelo patch:
- (A) Botão global dentro do Chat (header principal).
- (B) Toggle na aba Settings → IA.

**Vou implementar os dois** (B é durável, A é acesso rápido):

- **(B)** em `src/components/settings/AiSettingsSection.tsx` — adicionar toggle "IA global ativa" ligado a `tenant_ai_config.ai_globally_enabled`.
- **(A)** no cabeçalho do ChatPage — botão discreto "Pausar IA globalmente". Confirma com dialog ("isso pausa em todas as conversas") antes de aplicar.

Hook novo: `src/hooks/queries/useAIGlobalSwitch.ts` (query + mutation).

---

## 3. Envio manual do dono → Evolution ⏳

### 3.1 `chatService.sendOwnerMessage`

Arquivo: `src/services/chatService.ts` linha ~189

**Novo fluxo:**
1. Insere mensagem em `messages` (como já faz) com `direction='outbound'`, `delivery_status='pending'`.
2. Chama Edge Function `evolution-proxy` (ação `send-message`) passando: `tenant_id`, `conversation_id`, `message_id`, `to` (telefone da conversa), `text`.
3. Ao retornar sucesso: `UPDATE messages SET delivery_status='sent', raw_payload=<resposta>` pela própria Edge Function (service role).
4. Em caso de falha: marcar `delivery_status='failed'` e mostrar toast na UI.

**Telefone de destino:** usar `conversations.external_contact_phone` se existir; caso contrário, `clients.phone`.

### 3.2 Edge Function `evolution-proxy`

Arquivo: `supabase/functions/evolution-proxy/index.ts`

Já existe como proxy genérico. Confirmar que aceita `action=send-message` com schema:
```ts
{ tenantId: string, conversationId: string, messageId: string, to: string, text: string }
```

**Checklist:**
- [ ] Validar JWT do usuário e que ele é `tenant_member` do `tenantId`
- [ ] Buscar `tenants.whatsapp_instance` para saber a instância na Evolution
- [ ] POST para Evolution `/message/sendText/{instance}`
- [ ] Atualizar `messages.delivery_status` + `raw_payload` via service role
- [ ] Retornar `{ ok: true, evolutionId }` ou `{ ok: false, error }`

---

## 4. N8N — ajustes nos workflows existentes

### 4.1 Router passa a ler `tenant_ai_config` ⏳

Arquivo: `n8n/01-comercial/workflows/commercial.router.json`

**Mudança:** nó HTTP que hoje consulta `tenant_ai_settings` (linha ~25) → consultar `tenant_ai_config`. Trazer: `ai_globally_enabled`, `tone_of_voice`, `service_style`, `can_auto_schedule`, `must_confirm_before_booking`, `assistant_name`, `greeting_message`, etc.

### 4.2 Guardrails de IA (inbound) ⏳

Arquivo: `n8n/01-comercial/workflows/commercial.webhook.inbound.json`

Após salvar a mensagem recebida e identificar a conversa, adicionar 2 nós IF antes de chamar o router:
1. **Check global:** `tenant_ai_config.ai_globally_enabled === true`. Se false → encerra, não chama IA.
2. **Check por conversa:** `conversations.ai_enabled === true`. Se false → encerra, não chama IA.

Quando encerra, a mensagem já está salva (dono vê no chat e responde manual).

### 4.3 Memory-flow (faltante) ⏳

Arquivo novo: `n8n/01-comercial/workflows/commercial.customer.memory-flow.json`

**Fluxo:**
- Trigger: Execute Workflow (chamado pelo router após fim de conversa ou marco relevante)
- Input: `{ tenant_id, client_id, observations: string[] }`
- Chama subworkflow `saveCustomerMemory` (novo — ver 5.17)
- Grava em `customer_memories`

### 4.4 Troca de provider: Claude → OpenAI GPT-4o Mini ⏳

**Escopo:** TODOS os nós de LLM nos workflows de `n8n/01-comercial/` e também nos workflows legados em `n8n/` (agente-cliente, agente-mestre, agente-profissional) que ficam em produção.

**Ações:**
- [ ] Em cada workflow, substituir nó "Anthropic Chat Model" (ou HTTP p/ api.anthropic.com) por nó "OpenAI Chat Model" com `model = gpt-4o-mini`
- [ ] Credencial: `OPENAI_API_KEY` (variável de ambiente N8N) — confirmar com o usuário que existe
- [ ] Atualizar system prompts se tiverem formatações específicas de Anthropic (XML tags de tools etc.) — GPT-4o Mini aceita OpenAI function calling
- [ ] Ajustar nós de logging (`logAgent`): campo `model` passa a ser `'gpt-4o-mini'`

**Arquivos afetados (lista inicial, confirmar com grep):**
- `n8n/01-comercial/workflows/commercial.router.json`
- `n8n/01-comercial/workflows/commercial.customer.booking-flow.json`
- `n8n/01-comercial/workflows/commercial.customer.cancel-flow.json`
- `n8n/01-comercial/workflows/commercial.customer.reschedule-flow.json`
- `n8n/01-comercial/workflows/commercial.customer.info-flow.json`
- `n8n/01-comercial/workflows/commercial.owner.rule-update-flow.json`
- `n8n/01-comercial/workflows/commercial_master_v1.json`
- `n8n/agente-cliente.json` (e variantes 02-agente-cliente.json)
- `n8n/agente-mestre-whatsapp.json`
- `n8n/agente-profissional.json`

---

## 5. N8N — Subworkflows (16 novos + 1 já existente)

Pasta: `n8n/01-comercial/subworkflows/`

Padrão de cada arquivo:
- Nome: `sub.{nomeCamelCase}.json`
- Trigger: `n8n-nodes-base.executeWorkflowTrigger`
- Saída: JSON estruturado `{ ok: true, data: {...} }` ou `{ ok: false, error: string }`
- Ambiente: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `EVOLUTION_URL`, `EVOLUTION_KEY`, `GOOGLE_CALENDAR_TOKEN`

| # | Arquivo | Input | Efeito | Status |
|---|---|---|---|---|
| 5.1 | `sub.resolveTenant.json` | `{ instance_name }` | busca `tenants` por `whatsapp_instance` | ⏳ |
| 5.2 | `sub.resolveActor.json` | `{ tenant_id, phone }` | retorna `{ actor: 'owner'\|'customer', tenant_member_id? }` comparando com `tenants.phone` | ⏳ |
| 5.3 | `sub.findOrCreateConversation.json` | `{ tenant_id, phone, name? }` | upsert em `conversations`, retorna id + `ai_enabled` | ⏳ |
| 5.4 | `sub.persistMessage.json` | `{ conversation_id, tenant_id, role, content, direction, raw_payload }` | INSERT em `messages`, retorna id | ⏳ |
| 5.5 | `sub.findOrCreateClient.json` | `{ tenant_id, phone, name }` | cria em `clients` se houver `name`; vincula em `conversations.client_id` | ⏳ |
| 5.6 | `sub.updateClient.json` | `{ client_id, patch }` | atualiza campos do cliente | ⏳ |
| 5.7 | `sub.getContext.json` | `{ tenant_id, client_id? }` | consolida settings + memórias + agendamentos recentes para compor prompt | ⏳ |
| 5.8 | `sub.getBarbers.json` | `{ tenant_id }` | lista barbeiros ativos | ⏳ |
| 5.9 | `sub.getServices.json` | `{ tenant_id }` | lista serviços ativos | ⏳ |
| 5.10 | `sub.getAvailability.json` | `{ tenant_id, service_id, from, to, barber_id? }` | chama RPC `rpc_available_slots` (ou view) | ⏳ |
| 5.11 | `sub.createAppointment.json` | `{ tenant_id, client_id, barber_id, service_id, start_at, notes? }` | INSERT em `appointments`; chama `syncCalendarCreate` | ⏳ |
| 5.12 | `sub.updateAppointment.json` | `{ appointment_id, patch }` | UPDATE + `syncCalendarUpdate` | ⏳ |
| 5.13 | `sub.syncCalendarCreate.json` | `{ tenant_id, appointment_id }` | Insere evento no Google Calendar | ⏳ |
| 5.14 | `sub.syncCalendarUpdate.json` | `{ tenant_id, appointment_id }` | Atualiza evento Google | ⏳ |
| 5.15 | `sub.syncCalendarCancel.json` | `{ tenant_id, appointment_id }` | Remove evento Google | ⏳ |
| 5.16 | `sub.sendWhatsapp.json` | `{ tenant_id, to, text }` | POST Evolution `/message/sendText/{instance}` | ✅ já existe como `send-whatsapp-reply.json` — renomear e padronizar |
| 5.17 | `sub.saveCustomerMemory.json` | `{ tenant_id, client_id, memory_type, content }` | INSERT em `customer_memories` | ⏳ |
| 5.18 | `sub.logAgent.json` | `{ tenant_id, conversation_id?, message_id?, system_prompt_snapshot, user_message, response_text, tool_calls, reasoning, tokens_input, tokens_output, cost_usd, latency_ms, outcome, model }` | POST em Edge Function `ai-log` (Etapa 05) | ⏳ |

**Notas:**
- `5.18` chama a Edge Function `ai-log` em vez de escrever direto no banco — já está alinhado com Etapa 05.
- `5.16` será renomeado de `send-whatsapp-reply.json` para `sub.sendWhatsapp.json` para ficar consistente com o padrão; vamos atualizar as chamadas que referenciam o nome antigo.

---

## 6. Regras de negócio (do patch)

Estas regras serão aplicadas dentro dos workflows (router + flows), não em código React:

- **Agendamento:** sempre confirmar antes; sempre com barbeiro; respeitar `tenant_booking_rules`.
- **Remarcação:** se cliente tem 1 agendamento ativo → assume esse; se tem vários → pergunta qual.
- **Sugestão de horário:** mesmo barbeiro primeiro; outro barbeiro como alternativa próxima.
- **Cliente:** criar em `clients` apenas quando tiver nome; atualizar sempre que ganhar info nova.

Implementação dessas regras vai dentro dos prompts dos nós de IA (router + booking-flow + reschedule-flow) e nas decisões dos subworkflows (`findOrCreateClient` condicional a nome).

---

## 7. Configurações que alimentam a IA

Patch exige (linha 202-207) que a IA use:
- descrição da barbearia
- público alvo
- diferenciais
- regras de horário

Isso já é coberto pela Etapa 03 (`tenant_business_profile`) + `promptBuilder.ts` + Edge Function `build-prompt`.

**Ação:** confirmar que o `commercial.router.json` chama `build-prompt` (via HTTP) ou replica a mesma lógica via `sub.getContext.json`.

---

## 8. Critérios de sucesso (do patch)

Antes de fechar:

- [ ] Mensagem do WhatsApp aparece no Chat em tempo real (realtime Supabase já ativo — Etapa 04)
- [ ] IA responde automaticamente se `ai_globally_enabled` E `ai_enabled` = true
- [ ] Dono consegue pausar IA por conversa e globalmente
- [ ] Dono consegue enviar mensagem manualmente e ela chega no WhatsApp do cliente (via `evolution-proxy`)
- [ ] Cliente é criado automaticamente quando manda nome
- [ ] Agendamento funciona (inbound → IA → `createAppointment` → aparece na agenda)
- [ ] Google Calendar sincroniza (evento criado via `syncCalendarCreate`)
- [ ] Todos os fluxos comerciais vivem em `n8n/01-comercial/`

---

## Ordem de execução recomendada (e status)

| Bloco | Seções | Motivo de ser primeiro | Status |
|---|---|---|---|
| A | 1.1, 1.2 | Banco é pré-requisito de todo o resto | ⏳ |
| B | 2.1, 2.2, 2.3 | UI não depende de N8N — testável localmente | ⏳ |
| C | 3.1, 3.2 | Envio manual funciona com IA desligada (desacopla teste do N8N) | ⏳ |
| D | 5.1 – 5.18 | Subworkflows são usados pelos workflows — precisam existir antes | ⏳ |
| E | 4.1, 4.2, 4.3 | Ajustes nos workflows principais | ⏳ |
| F | 4.4 | Troca de provider — melhor fazer por último, quando fluxos já estão estáveis | ⏳ |
| G | 8 | Checklist de aceitação | ⏳ |

Entrega será feita em blocos (A+B, depois C, depois D, etc.) com validação do usuário entre cada bloco.

---

## Arquivos afetados (mapa rápido para retomada)

### Novos
- `supabase/migrations/00010_commercial_pillar.sql`
- `src/pages/chat/utils.ts` (ou similar — se já existir, adicionar função)
- `src/pages/chat/hooks/useToggleConversationAI.ts`
- `src/hooks/queries/useAIGlobalSwitch.ts`
- `n8n/01-comercial/workflows/commercial.customer.memory-flow.json`
- `n8n/01-comercial/subworkflows/sub.resolveTenant.json`
- `n8n/01-comercial/subworkflows/sub.resolveActor.json`
- `n8n/01-comercial/subworkflows/sub.findOrCreateConversation.json`
- `n8n/01-comercial/subworkflows/sub.persistMessage.json`
- `n8n/01-comercial/subworkflows/sub.findOrCreateClient.json`
- `n8n/01-comercial/subworkflows/sub.updateClient.json`
- `n8n/01-comercial/subworkflows/sub.getContext.json`
- `n8n/01-comercial/subworkflows/sub.getBarbers.json`
- `n8n/01-comercial/subworkflows/sub.getServices.json`
- `n8n/01-comercial/subworkflows/sub.getAvailability.json`
- `n8n/01-comercial/subworkflows/sub.createAppointment.json`
- `n8n/01-comercial/subworkflows/sub.updateAppointment.json`
- `n8n/01-comercial/subworkflows/sub.syncCalendarCreate.json`
- `n8n/01-comercial/subworkflows/sub.syncCalendarUpdate.json`
- `n8n/01-comercial/subworkflows/sub.syncCalendarCancel.json`
- `n8n/01-comercial/subworkflows/sub.sendWhatsapp.json` (renomeado)
- `n8n/01-comercial/subworkflows/sub.saveCustomerMemory.json`
- `n8n/01-comercial/subworkflows/sub.logAgent.json`

### Modificados
- `src/services/chatService.ts` (tipos + `toggleConversationAI` + `sendOwnerMessage` via proxy)
- `src/pages/chat/components/ConversationList.tsx` (fallback telefone + badge IA)
- `src/pages/chat/components/MessageThread.tsx` (header com toggle IA)
- `src/pages/chat/ChatPage.tsx` (integração do controle global)
- `src/pages/chat/hooks/useSendMessage.ts` (fluxo pendente → sent/failed)
- `src/components/settings/AiSettingsSection.tsx` (toggle global)
- `src/schemas/aiSettingsSchema.ts` (campo `ai_globally_enabled`)
- `supabase/functions/evolution-proxy/index.ts` (garantir action `send-message`)
- `n8n/01-comercial/workflows/commercial.router.json` (tenant_ai_config + guardrails)
- `n8n/01-comercial/workflows/commercial.webhook.inbound.json` (guardrails pré-router)
- Todos os workflows listados em 4.4 (troca Claude → OpenAI GPT-4o Mini)

---

## Como retomar em nova sessão

Se perder contexto:
1. Leia este arquivo do começo.
2. Leia `blackhub_patch_final.md` (raiz do projeto).
3. Confira os ⏳ vs ✅ acima — o próximo ⏳ é seu ponto de entrada.
4. Para conflitos de design, consulte sempre as etapas OK em `Etapas de evolução/`.
