# N8N Flows — BarberFlow

## Como importar

1. Acesse sua instância N8N.
2. Menu lateral -> Workflows -> Import from file.
3. Importe os arquivos `.json` desta pasta na ordem recomendada.

## Ordem de importação

1. `agente-mestre-whatsapp.json` — Entry point principal.
2. `agente-profissional.json` — Subworkflow do dono.
3. `agente-cliente.json` — Subworkflow do cliente.
4. `tool-agendamento-calendar.json`
5. `tool-rag-profissional.json`
6. `tool-rag-cliente.json`

## Variáveis de ambiente necessárias

Configure em N8N -> Settings -> Variables:

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic |
| `EVOLUTION_API_URL` | URL da instância Evolution API |
| `EVOLUTION_API_KEY` | Chave da Evolution API |
| `OPENAI_API_KEY` | Para geração de embeddings (RAG) |
| `NEXTJS_APP_URL` | URL da aplicação Next.js |
| `N8N_WEBHOOK_SECRET` | Secret para validar chamadas |
