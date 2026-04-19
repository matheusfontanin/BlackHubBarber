# Contrato: `ai-log`

Edge Function usada pelo N8N para registrar cada decisão do agente IA em `ai_decision_logs`.

## Endpoint

```
POST {SUPABASE_URL}/functions/v1/ai-log
```

## Autenticação

A função aceita dois modos de autenticação (N8N escolhe um):

1. **Service role (recomendado para workflows internos)**
   ```
   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
   ```

2. **Shared secret (caso o service role não esteja no workflow)**
   ```
   x-ai-log-secret: <AI_LOG_SHARED_SECRET>
   ```

   O valor é configurado via variável de ambiente na Edge Function.

Sem nenhum dos dois, a função retorna `401 Unauthorized`.

## Payload

```jsonc
{
  "tenant_id": "uuid",                 // obrigatório
  "conversation_id": "uuid | null",
  "message_id": "uuid | null",         // id da mensagem da IA que este log descreve

  "system_prompt_snapshot": "string",  // prompt exato no momento da chamada
  "user_message": "string",            // mensagem do cliente que disparou o turno
  "conversation_history": [            // últimas N mensagens enviadas como contexto
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],

  "model": "claude-opus-4-6",          // obrigatório

  "response_text": "string",
  "tool_calls": [
    {
      "name": "create_appointment",
      "arguments": { "date": "2026-05-02", "service_id": "..." },
      "result": { "ok": true, "appointment_id": "..." }
    }
  ],
  "reasoning": "string",

  "tokens_input": 1234,
  "tokens_output": 567,
  "cost_usd": 0.0123,
  "latency_ms": 1432,

  "outcome": "replied | tool_call | escalated | error | no_response",
  "error_message": "string | null"
}
```

Campos obrigatórios: `tenant_id`, `model`.
Campos default: `tokens_input=0`, `tokens_output=0`, `cost_usd=0`, `outcome='replied'`.

## Respostas

- `200 OK` — `{ "success": true, "id": "<log_uuid>" }`
- `400 Bad Request` — payload inválido (inclui o motivo em `error`)
- `401 Unauthorized` — faltam Authorization/service-role ou `x-ai-log-secret`
- `500 Internal Server Error` — falha ao inserir no banco

## Fluxo recomendado no N8N

1. Nó de entrada recebe mensagem (via `n8n-webhook`)
2. Node "Prepare Prompt" monta `system_prompt_snapshot` e `conversation_history`
3. Node de chamada à IA (Claude) executa com `start = Date.now()`
4. Após a resposta (ou erro):
   - Calcula `latency_ms = Date.now() - start`
   - Extrai `tokens_input/output` e `cost_usd` da resposta da API
   - Classifica `outcome` conforme a decisão do turno
5. Node HTTP POST para `ai-log` com o payload acima
6. Se `ai-log` falhar, não bloqueia o fluxo principal — registrar em log de erro do N8N

## Observações

- `message_id` deve referenciar o `id` da linha em `public.messages` inserida pelo N8N/webhook para a resposta da IA. A UI usa esse campo para casar log ↔ bolha de mensagem.
- A Edge Function é idempotente do ponto de vista de inserção: chamadas repetidas criam múltiplas linhas. Use retry no N8N apenas em caso de erro real.
- O campo `conversation_history` é livre, mas um array `[{ role, content }]` compatível com o formato Anthropic/OpenAI facilita a renderização no painel de raciocínio.
