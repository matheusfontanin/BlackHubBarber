# BarberFlow — Workflows N8N

## Arquitetura

```
WhatsApp → Evolution API → Webhook N8N
                               ↓
                    01-agente-mestre.json
                    (identifica tenant + cliente + histórico)
                         ↓            ↓
              02-agente-cliente   04-agente-profissional
              (clientes normais)  (dono via WhatsApp)
                    ↓
           03-tool-agendamento
           (verifica horários + cria appointment no Supabase)
```

## Variáveis de Ambiente no N8N

Configure em **Settings → Variables** no seu N8N:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | https://lvfwkaakwcqutirnjsuu.supabase.co |
| `SUPABASE_SERVICE_KEY` | sua service_role_key |
| `EVOLUTION_API_URL` | https://evolution.blackserver.com.br |
| `EVOLUTION_API_KEY` | sua api_key |
| `OPENAI_API_KEY` | sk-proj-... |

## Ordem de Importação

Importe SEMPRE nesta ordem (Mestre precisa dos IDs dos outros):

1. `03-tool-agendamento.json`
2. `04-agente-profissional.json`
3. `02-agente-cliente.json`
4. `01-agente-mestre.json` ← edite os IDs dos workflows aqui

## Após Importar

No workflow `01-agente-mestre.json`, edite os nós e substitua:
- `SUBSTITUIR_PELO_ID_AGENTE_PROFISSIONAL` → ID do workflow 04 (URL do N8N)
- `SUBSTITUIR_PELO_ID_AGENTE_CLIENTE` → ID do workflow 02

No workflow `02-agente-cliente.json`, edite e substitua:
- `SUBSTITUIR_PELO_ID_TOOL_AGENDAMENTO` → ID do workflow 03

## Configurar Webhook na Evolution API

Após ativar o workflow `01-agente-mestre.json`, a URL do webhook será:
```
https://n8n.blackserver.com.br/webhook/barberflow-whatsapp
```

Configure no Evolution API para cada instância de barbearia:
```bash
curl -X POST https://evolution.blackserver.com.br/webhook/set/barberflow_NUMERO \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://n8n.blackserver.com.br/webhook/barberflow-whatsapp",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

## Detecção Dono vs Cliente

O Agente Mestre compara o telefone do remetente com o `phone` do tenant no Supabase:
- Bate → Agente Profissional (dono)
- Não bate → Agente Cliente

## O Dono Ensina a IA via WhatsApp

```
ENSINAR: Não trabalhamos aos domingos
ENSINAR: Desconto de 10% para indicações
```

O Agente Profissional salva automaticamente na tabela `ai_knowledge` do Supabase.
