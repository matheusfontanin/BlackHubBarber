# Próxima Sessão — Pós Etapa 01 (Fundação Técnica)

> Documento gerado em: 2026-04-18

---

## O que foi feito nesta sessão

### Etapa 00 — Plano Geral revisado
- Leitura e validação do [00-PLANO-GERAL.md](../../Etapas%20de%20evolu%C3%A7%C3%A3o/OK-00-PLANO-GERAL.md)

### Etapa 01 — Fundação Técnica concluída
1. **TanStack Query**: `queryClient` em `src/lib/queryClient.ts`, provider em `src/main.tsx`, devtools só em dev, hooks por domínio em `src/hooks/queries/` (customers, services, appointments, settings, conversations). `CustomersPage` migrada como referência.
2. **Zod schemas** em `src/schemas/` (tenantSettings, aiSettings, bookingSettings, customer + customerForm, service, appointment). `src/types/settings.ts` reexporta os tipos inferidos.
3. **ErrorBoundary + Sonner**: `<Toaster theme="dark"/>` no `App`, `ErrorBoundary` envolvendo rotas autenticadas, helper `src/lib/errors.ts` (`handleError`/`handleSuccess`). Todos os `alert()` de Settings substituídos por toasts.
4. **Vitest + React Testing Library**: `vitest.config.ts`, `src/test/setup.ts`, mock de Supabase em `src/test/mocks/supabase.ts`, scripts `test`, `test:watch`, `test:ui`. Primeiros 16 testes verdes em `lib/utils`, `services/settingsService`, `schemas/customerSchema`.

Decisões 006–009 registradas em [decisoes.md](./decisoes.md).

---

## Próximo passo recomendado

Etapa 02 — Refatoração de Componentes Grandes ([02-refatoracao-componentes.md](../../Etapas%20de%20evolu%C3%A7%C3%A3o/02-refatoracao-componentes.md)). Quebrar `CalendarPage` (932 linhas) e `ChatPage` (799 linhas) usando os hooks de query já disponíveis.

## Pendências herdadas (continuam valendo)

- Sincronização `tenants` × `tenant_settings`
- Reconexão de WhatsApp via aba de integrações
- Gestão de horários na aba Agenda
- `npm run lint` ainda reporta erros nos Edge Functions do Supabase (Deno runtime) — excluir `supabase/functions/**` do tsconfig ou criar tsconfig separado.
