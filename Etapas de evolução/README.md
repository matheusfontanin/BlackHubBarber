# Etapas de Evolução — BlackHub Barber

Plano completo de evolução do sistema. Criado em 2026-04-10.

## Como usar

1. Ler **[00-PLANO-GERAL.md](00-PLANO-GERAL.md)** primeiro — tem a visão, dependências e métricas.
2. Executar as etapas **em ordem**. Cada etapa depende das anteriores (conforme indicado no topo de cada arquivo).
3. Ao finalizar uma etapa, marcar os critérios de aceitação e documentar decisões em `docs/ai-collab/decisoes.md`.
4. Só começar a próxima etapa quando a anterior estiver validada manualmente pelo usuário.

## Índice

| # | Etapa | Prioridade | Depende de |
|---|---|---|---|
| [00](00-PLANO-GERAL.md) | **Plano Geral** | — | — |
| [01](01-fundacao-tecnica.md) | Fundação Técnica (TanStack, Zod, Toasts, Tests) | 🔴 Crítica | — |
| [02](02-refatoracao-componentes.md) | Refatoração de Componentes Grandes | 🟡 Alta | 01 |
| [03](03-configuracoes-unificadas.md) | ⭐ Configurações Unificadas & Prompt Builder | 🔴 Crítica | 01 |
| [04](04-preparacao-n8n-evolution.md) | Preparação N8N + Evolution API | 🔴 Crítica | 03 |
| [05](05-observabilidade-ia.md) | Observabilidade de IA | 🟡 Alta | 04 |
| [06](06-painel-financeiro.md) | 💰 Painel Financeiro (com Privacy Mode) | 🟢 Alto valor | 01 |
| [07](07-fidelidade.md) | Fidelidade / Loyalty | 🟢 Alto valor | 06 |
| [08](08-campanhas.md) | Campanhas de Reengajamento | 🟢 Alto valor | 04 |
| [09](09-analytics-funil.md) | Analytics com Funil | 🟢 Alto valor | 05, 06 |
| [10](10-rag-knowledge.md) | RAG / Knowledge Base | 🟡 Média-alta | 04 |
| [11](11-team-management.md) | Team Management Avançado | 🟡 Média | 03, 06 |
| [12](12-booking-publico.md) | Booking Público (Self-Service) | 🟡 Média | 11 |
| [13](13-app-barbeiro.md) | App do Barbeiro (Mobile-First) | 🟡 Média | 11 |
| [14](14-multi-tenant-subdominio.md) | Multi-tenant por Subdomínio | 🟡 Média | 12 |
| [15](15-seguranca.md) | Segurança e Rate Limiting | 🔴 Crítica | — |

## Resumo das decisões principais tomadas no plano

- **Stack de dados no front:** TanStack Query (substitui useEffect manual)
- **Validação:** Zod como fonte única de tipos + validação
- **Toasts:** Sonner (dark theme nativo)
- **Testes:** Vitest + React Testing Library (opcionalmente Playwright na Fase 4)
- **Gráficos:** Recharts (usado no financeiro e analytics)
- **Rate limit:** Upstash Redis
- **Embeddings (RAG):** OpenAI text-embedding-3-small
- **Privacy Mode:** Context global com `<PrivateValue>` wrapper, keyboard shortcut `Ctrl+Shift+H`
- **Configurações:** 3 tabelas consolidadas (`tenant_business_profile`, `tenant_ai_config`, `tenant_booking_rules`) eliminando 5 duplicações encontradas
- **Prompt Builder:** função pura testável que monta o system prompt a partir das configurações
- **N8N isolation:** N8N nunca toca schema direto — passa por Edge Functions (facilita migração futura)
