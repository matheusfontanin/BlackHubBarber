# Decisoes do Projeto

## Decisao 001
**Data:** 2026-04-01
**Tema:** naming
**Decisao:** Projeto renomeado de BarberFlow para BlackHub Barber
**Motivo:** Alinhar com visao de plataforma (BlackHub Clinic, BlackHub Nutri, etc.)
**Impacto:** Todas as referencias de UI, package.json, instance names atualizados

## Decisao 002
**Data:** 2026-04-01
**Tema:** agenda
**Decisao:** Google Agenda sera uma integracao transitoria via CalendarProvider interface
**Motivo:** Acelerar o MVP comercial sem acoplar o dominio ao Google
**Impacto:** Interface CalendarProvider criada em src/types/providers.ts

## Decisao 003
**Data:** 2026-04-01
**Tema:** backend
**Decisao:** Manter Supabase Edge Functions como backend no MVP, migrar para Node.js proprio no Nivel 3
**Motivo:** Evitar overengineering no MVP; Edge Functions atendem o volume inicial
**Impacto:** Contratos e interfaces criados agora para facilitar migracao futura

## Decisao 004
**Data:** 2026-04-01
**Tema:** CRM
**Decisao:** Nao usar Chatwoot. CRM proprio integrado ao dashboard
**Motivo:** Controle total sobre UX e integracao com agentes IA
**Impacto:** Tabelas conversations/messages no Supabase, inbox proprio no frontend

## Decisao 005
**Data:** 2026-04-01
**Tema:** design system
**Decisao:** Cores oficiais: Primary #1A1A2E (Midnight Navy), Secondary #C4A35A (Brass Gold). Fontes: DM Serif Display, Inter, JetBrains Mono
**Motivo:** Identidade visual consistente da marca BlackHub
**Impacto:** Eliminadas todas as cores hardcoded (#141414, #E4E3E0) em favor de tokens Tailwind

## Decisao 006
**Data:** 2026-04-18
**Tema:** fundacao-tecnica / data fetching
**Decisao:** Adotar TanStack Query (v5) como camada de cache e sincronizacao para todas as leituras do Supabase
**Motivo:** Eliminar o padrao repetido de `useEffect + useState + loading/error` em cada pagina, ganhar deduplicacao, retry automatico e invalidation fina por `queryKey`
**Impacto:**
- Adicionados `@tanstack/react-query` e `@tanstack/react-query-devtools`
- Criado `src/lib/queryClient.ts` com `staleTime: 60s`, `retry: 2` e `refetchOnWindowFocus` off em dev
- `QueryClientProvider` envolve o `<App/>` em `src/main.tsx`; Devtools so em dev
- Hooks por dominio em `src/hooks/queries/` (customers, services, appointments, settings, conversations)
- `CustomersPage` migrada como referencia do padrao

## Decisao 007
**Data:** 2026-04-18
**Tema:** fundacao-tecnica / validacao
**Decisao:** Schemas Zod em `src/schemas/` sao a fonte unica da verdade. Os tipos TS sao inferidos via `z.infer`, e `src/types/settings.ts` agora reexporta desses schemas
**Motivo:** Evitar divergencia entre validacao de formulario e os tipos usados no servico/banco
**Impacto:**
- Schemas criados: `tenantSettings`, `aiSettings`, `bookingSettings`, `customer` (com `customerFormSchema`), `service`, `appointment`
- `CustomersPage` usa `react-hook-form` + `zodResolver(customerFormSchema)`
- Interfaces duplicadas em `types/settings.ts` removidas em favor de reexports dos schemas

## Decisao 008
**Data:** 2026-04-18
**Tema:** fundacao-tecnica / UX de erros
**Decisao:** Adotar Sonner para toasts e um `ErrorBoundary` dedicado para rotas autenticadas
**Motivo:** Substituir `alert()` e `console.error` por feedback consistente; impedir que um erro derrube a pagina inteira
**Impacto:**
- `sonner` instalado e `<Toaster theme="dark" richColors/>` montado em `src/App.tsx`
- Helper `src/lib/errors.ts` (`handleError` / `handleSuccess`) centraliza mensagens
- `ErrorBoundary` envolve `DashboardLayout` e `OnboardingPage`; fallback segue a identidade visual
- Todos os `alert(...)` de settings (Barbershop, AI, Booking) substituidos por toasts

## Decisao 009
**Data:** 2026-04-18
**Tema:** fundacao-tecnica / testes
**Decisao:** Vitest + React Testing Library como infraestrutura de testes; Playwright apenas na Fase 4
**Motivo:** Vitest integra diretamente com o Vite ja existente; priorizamos service + unit tests por ROI alto
**Impacto:**
- `vitest.config.ts` herda do `vite.config.ts` com `jsdom`
- `src/test/setup.ts` importa `@testing-library/jest-dom/vitest` e faz cleanup por teste
- Mock de Supabase reutilizavel em `src/test/mocks/supabase.ts` (query builder chainable)
- Primeiros testes: `lib/utils.test.ts`, `services/settingsService.test.ts`, `schemas/customerSchema.test.ts` (16 testes verdes)
- Scripts `test`, `test:watch`, `test:ui` adicionados ao `package.json`

## Decisao 010
**Data:** 2026-04-18
**Tema:** configuracoes-unificadas
**Decisao:** Consolidar `tenant_settings`, `tenant_ai_settings` e `tenant_booking_settings` em tres tabelas por eixo semantico: `tenant_business_profile` (negocio), `tenant_ai_config` (comportamento do agente) e `tenant_booking_rules` (regras da agenda, sem sobreposicao com IA)
**Motivo:** Remover os 5 campos duplicados auditados (differentiators, customer_profile/target_audience, business_summary/description, allow_ai_booking, require_manual_confirmation/must_confirm_before_booking) para ter fonte unica de verdade e eliminar risco de divergencia no prompt do agente
**Impacto:**
- Migration `00006_unified_settings.sql` cria as 3 tabelas com RLS por `tenant_id`, triggers `updated_at` e copia dos dados antigos
- Schemas Zod em `src/schemas/tenantBusinessProfileSchema.ts`, `tenantAIConfigSchema.ts`, `tenantBookingRulesSchema.ts`
- Formularios reescritos (`BarbershopSettingsSection`, `AiSettingsSection`, `BookingSettingsSection`) usando RHF + zodResolver diretamente nas tabelas novas
- Componentes `OpeningHoursEditor` e `AmenitiesPicker` criados
- `buildSystemPrompt` em `src/lib/ai/promptBuilder.ts` com 11 testes unitarios
- `PromptPreview` incluido na aba IA
- Edge Function `build-prompt` auto-suficiente (sem importar de `src/`)
- Tabelas antigas marcadas como DEPRECATED, removidas em release futuro (2026-05)

## Decisao 011
**Data:** 2026-04-18
**Tema:** integracao n8n / evolution
**Decisao:** O webhook `n8n-webhook` normaliza payloads da Evolution para o schema interno (`clients` por telefone, `conversations` por canal, `messages` com metadata estruturada) e encaminha o payload original para o N8N de forma assincrona
**Motivo:** Isolar o N8N do schema interno — mudancas de tabela ficam contidas na Edge Function — e garantir que o insert em `messages` nao depende do sucesso do forward
**Impacto:**
- `messages` ganhou coluna `delivery_status` e `conversations` ganhou `unread_count` (migration `00008_messages_lifecycle.sql`)
- Trigger `sync_conversation_on_message` atualiza `last_message_at` / `unread_count` a cada mensagem nova
- Trigger `reset_unread_on_read` zera `unread_count` quando as mensagens sao marcadas como lidas
- `evolution-connect` agora valida o JWT do usuario via `auth.getUser()` e checa `tenant_members` com service role

## Decisao 012
**Data:** 2026-04-19
**Tema:** observabilidade / IA
**Decisao:** Criar tabela `ai_decision_logs` como fonte unica de auditoria de cada turno da IA (prompt, tools, custo, latencia, outcome) e expor via Edge Function `ai-log` para escrita pelo N8N, RPC `get_ai_health` para leitura agregada e painel `AIReasoningPanel` por mensagem
**Motivo:** Sem o snapshot do prompt + tool calls + metricas, e impossivel debugar reclamacoes do tipo "a IA marcou errado" ou rastrear custo/latencia por periodo. Centralizar em uma tabela unica evita divergencia entre logs de N8N e o historico de mensagens no Supabase.
**Impacto:**
- Migration `00009_ai_decision_logs.sql` cria a tabela com RLS por `tenant_id` + bypass dev e a funcao `get_ai_health(tenant_id, period_days)` retornando JSON agregado
- Edge Function `ai-log` aceita Bearer service-role ou header `x-ai-log-secret` e valida payload antes de inserir
- Schemas Zod em `src/schemas/aiDecisionLogSchema.ts` (log + health) com 8 testes verdes
- Hooks `useAIDecisionForMessage`, `useAIDecisionsForConversation`, `useAIHealth` em `src/hooks/queries/useAiLogs.ts`
- Componente `AIReasoningPanel` abre drawer no `MessageThread` ao clicar na bolha da IA, mostra prompt ativo, tools, custo e latencia + botao "Copiar relatorio"
- Badge de tools (`🔧 N ferramentas`) aparece na bolha da IA quando ha `tool_calls` no `metadata`
- Tab "Diagnostico" em Settings renderiza `AIHealthDashboard` com KPIs, grafico de custo por dia, ranking de tools e alertas (erro >10%, latencia p95 >10s)
- Contrato N8N documentado em `docs/n8n/ai-log-contract.md`
