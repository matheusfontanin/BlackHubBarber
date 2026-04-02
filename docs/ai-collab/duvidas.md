# Duvidas

## [2026-04-01 00:00] Duvida 001
**Tarefa atual:** Alinhamento com Prompt Master Final
**Contexto:** O documento master define um backend Node.js + TypeScript separado (apps/api/) com regras de negocio, validacoes, idempotencia e orquestracao de agentes. Atualmente o projeto usa apenas Supabase Edge Functions como backend.
**Duvida:** Quando migrar para backend proprio? As Edge Functions sao suficientes para o MVP vendavel ou o volume de logica de negocio (validacao de conflitos, idempotencia, tool calling) justifica um backend dedicado ja na fase 1?
**Impacto se nao responder:** Risco de retrabalho significativo ao precisar extrair logica das Edge Functions para um backend
**Sugestao inicial do agente:** Manter Edge Functions para o MVP (fase 1-2), migrar para backend proprio na fase 3 quando a complexidade justificar. Criar as interfaces/contratos agora para facilitar a migracao.
**Status:** aberto
