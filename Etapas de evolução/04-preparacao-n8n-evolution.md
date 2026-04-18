# Etapa 04 — Preparação N8N + Evolution API

**Duração estimada:** 3-4 dias
**Depende de:** [03 — Configurações Unificadas](03-configuracoes-unificadas.md)
**Prioridade:** 🔴 Crítica

## Objetivo

Deixar o sistema **pronto para receber** a integração N8N + Evolution API sem precisar refatoração depois. O barbeiro vai apenas inserir o número do WhatsApp nas configurações e o agente IA (rodando no N8N) fará o resto: responder mensagens, agendar, registrar conversas, criar clientes.

> **Regra de ouro que você definiu:** o cliente só insere o telefone. Tudo o resto acontece automaticamente.

---

## 4.1 — Fluxo de dados completo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────>│ Evolution   │────>│    N8N      │────>│  Claude IA  │
│   Cliente   │<────│    API      │<────│  (agente)   │<────│   (tools)   │
└─────────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                               │
                                               │ lê settings + grava conversas
                                               ▼
                                        ┌─────────────┐
                                        │  Supabase   │
                                        │  (BlackHub) │
                                        └──────┬──────┘
                                               │
                                               │ Realtime + REST
                                               ▼
                                        ┌─────────────┐
                                        │  Dashboard  │
                                        │    React    │
                                        └─────────────┘
```

**Responsabilidades:**
- **Dashboard React**: UI, configurações, visualização — **nunca** fala com Evolution diretamente.
- **N8N**: orquestração, chamada da IA, execução de tools.
- **Supabase**: verdade única. Tudo (conversas, mensagens, memórias, agendamentos, logs IA) mora aqui.
- **Edge Functions**: proxy seguro quando o dashboard precisa iniciar algo (ex: conectar WhatsApp).

---

## 4.2 — Único ponto de configuração: telefone + instância

### UI da aba "Integrações"

O barbeiro vê **três cards**:

#### Card 1: WhatsApp
```
┌──────────────────────────────────────────────┐
│ 📱 WhatsApp Business                         │
├──────────────────────────────────────────────┤
│ Número:   [ (11) 99999-9999            ] 📝 │
│                                              │
│ Status:   🔴 Desconectado                    │
│                                              │
│ [Conectar via QR Code]                       │
│                                              │
│ ℹ️ Ao conectar, nossa IA começará a          │
│ responder mensagens automaticamente          │
│ conforme suas configurações.                 │
└──────────────────────────────────────────────┘
```

Quando clica "Conectar":
1. Frontend chama Edge Function `evolution-connect`
2. Edge Function cria instância na Evolution API com o número
3. Recebe QR Code em base64
4. Mostra modal com o QR
5. Cliente escaneia com o celular
6. Polling de status até `state === 'open'` → toast de sucesso
7. Grava `whatsapp_instance_id` e `whatsapp_connected = true` em `tenants`

#### Card 2: Google Calendar (preparação futura)
Já existe [supabase/functions/google-calendar-oauth/](supabase/functions/google-calendar-oauth/). Manter.

#### Card 3: N8N
Só mostra status (online/offline via ping) e webhook URL. Não precisa configurar — o N8N consulta o Supabase com service role key.

### Tarefas

- [ ] Refazer [IntegrationsSettingsSection.tsx](src/components/settings/IntegrationsSettingsSection.tsx) com os 3 cards
- [ ] Modal `<WhatsAppQRModal />` com polling a cada 2s
- [ ] Incluir **apenas 1 campo de telefone** (`whatsapp_number` em `tenant_business_profile`) — este é o único input do usuário
- [ ] Feedback visual claro quando conectado: badge verde, última sincronização, botão "Desconectar"

---

## 4.3 — Edge Functions necessárias

### `supabase/functions/evolution-connect/index.ts`
```ts
// POST /functions/v1/evolution-connect
// body: { tenantId: string, phoneNumber: string }
// response: { qrCode: string, instanceId: string }
```
- Valida que `auth.uid()` é membro do tenant
- Chama Evolution API `POST /instance/create`
- Retorna QR Code

### `supabase/functions/evolution-status/index.ts`
```ts
// GET /functions/v1/evolution-status?tenantId=...
// response: { status: 'connecting'|'open'|'closed', lastSeen: string }
```

### `supabase/functions/evolution-disconnect/index.ts`
```ts
// POST /functions/v1/evolution-disconnect
// body: { tenantId: string }
```

### `supabase/functions/build-prompt/index.ts` (do item 3)
```ts
// GET /functions/v1/build-prompt?tenantId=...
// auth: service role (N8N) ou JWT (dashboard preview)
// response: { systemPrompt: string, lastUpdated: string }
```

### `supabase/functions/n8n-webhook/index.ts`
```ts
// POST /functions/v1/n8n-webhook
// Recebe mensagens do N8N (mensagens recebidas ou enviadas) e grava no Supabase
// Isola o N8N do schema direto — se mudar tabela, muda aqui apenas
```

### Tarefas

- [ ] Criar as 5 Edge Functions acima
- [ ] Cada uma com `deno test` básico
- [ ] Variáveis de ambiente documentadas em `supabase/.env.example`
- [ ] Rate limiting nativo via `Deno.serve` + lib simples (ver Etapa 15)

---

## 4.4 — Schema para conversas prontas para receber dados do N8N

Olhei o [chatService.ts](src/services/chatService.ts) — as tabelas `conversations`, `messages`, `customer_memories` já existem. Falta garantir que:

- [ ] `messages.metadata JSONB` aceita o formato que o N8N vai mandar:
  ```json
  {
    "source": "n8n",
    "model": "claude-opus-4-6",
    "tokens_in": 1234,
    "tokens_out": 567,
    "cost_usd": 0.0123,
    "tool_calls": ["create_appointment"],
    "reasoning": "cliente pediu corte na quinta às 15h, verificando disponibilidade"
  }
  ```
- [ ] View `ai_usage_stats` agrega `tokens_in + tokens_out` e `cost_usd` por tenant (já existe via [statsService](src/services/statsService.ts))
- [ ] Trigger: quando `messages` insert com `role='ai'`, atualiza `conversations.last_message_at` e `conversations.unread_count`
- [ ] Trigger: quando `messages` insert com `role='client'`, tenta encontrar `clients` por `phone` ou cria novo
- [ ] Coluna `messages.delivery_status` ENUM ('pending','sent','delivered','read','failed') — N8N atualiza após resposta Evolution

---

## 4.5 — Tools que a IA do N8N vai chamar

O N8N vai receber do Claude chamadas como `create_appointment({...})`. Essas chamadas batem em Edge Functions ou direto no Supabase via service role. Precisamos documentar o **contrato**.

### `create_appointment`
```json
{
  "tenant_id": "uuid",
  "customer": {
    "name": "João Silva",
    "phone": "+5511999999999"
  },
  "service_id": "uuid",
  "barber_id": "uuid | null",
  "start_at": "2026-04-15T14:30:00-03:00",
  "notes": "cliente pediu degradê baixo"
}
```
Resposta:
```json
{
  "success": true,
  "appointment_id": "uuid",
  "confirmation_code": "ABC123"
}
```

### `lookup_customer`
```json
{ "tenant_id": "uuid", "phone": "+5511999999999" }
```
Resposta inclui histórico, preferências, total gasto, visitas — para a IA personalizar.

### `list_available_slots`
```json
{
  "tenant_id": "uuid",
  "service_id": "uuid",
  "date_from": "2026-04-15",
  "date_to": "2026-04-20",
  "barber_id": "uuid | null"
}
```

### `escalate_to_human`
```json
{
  "conversation_id": "uuid",
  "reason": "cliente pediu falar com gerente",
  "priority": "high"
}
```
Marca `conversations.status = 'escalated'` e dispara notificação.

### `save_customer_memory`
```json
{
  "client_id": "uuid",
  "memory_type": "preference",
  "content": "cliente prefere máquina 2 nas laterais"
}
```

### Tarefas

- [ ] Documentar contratos em [docs/n8n/tools-contract.md](docs/n8n/tools-contract.md)
- [ ] Criar Edge Functions para cada tool (ou view SQL quando for consulta simples)
- [ ] Testes: chamar cada tool e verificar efeito no banco
- [ ] Testes: rate limit + autenticação via service role key

---

## 4.6 — Realtime no dashboard

Na Etapa 02 já preparamos `useMessages` com subscription. Nesta etapa ativamos:

- [ ] Habilitar Supabase Realtime para tabelas `messages`, `conversations`, `appointments`
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  ```
- [ ] `useConversations` também subscribe para atualizar lista ao receber nova mensagem
- [ ] Calendário atualiza em tempo real quando a IA cria um agendamento
- [ ] Badge de "nova mensagem" no menu lateral
- [ ] Som opcional quando chega mensagem (toggle em Settings → Preferências)

---

## 4.7 — Modo simulador (para desenvolver sem N8N rodando)

Para testar fluxos sem precisar do N8N ligado:

- [ ] Botão **"Simular mensagem do cliente"** na página de Chat (visível só em dev)
- [ ] Ao clicar, abre modal: escolher cliente, digitar mensagem, enviar → grava em `messages` como se viesse do WhatsApp
- [ ] Útil para testar UI de realtime antes da integração real

---

## Critérios de aceitação

- [ ] Único campo de input na aba Integrações: número de telefone
- [ ] Fluxo "Conectar WhatsApp" com QR Code funciona de ponta a ponta (mesmo que Evolution ainda esteja em dev)
- [ ] Todas as Edge Functions listadas criadas e testadas
- [ ] Contratos das 5 tools documentados
- [ ] Realtime ativo nas 3 tabelas
- [ ] Simulador de mensagem funciona em dev
- [ ] Chat mostra mensagem instantânea quando aparece no banco (sem refresh)
- [ ] N8N pode consumir `build-prompt` e receber o system prompt atualizado
