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
