# CLAUDE.md — BlackHub Barber

SaaS multi-tenant para barbearias. WhatsApp/Instagram com IA humanizada, agendamentos, CRM e dashboard.
Primeiro modulo da plataforma BlackHub (futuro: Clinic, Nutri, Pet).

## Arquitetura
- **React + Vite:** SPA (Dashboard, CRM, Inbox, Agenda, Config, Stripe)
- **N8N:** Orquestracao de mensagens (Evolution API -> Claude IA -> Google Calendar)
- **Supabase:** PostgreSQL com RLS por tenant_id + pgvector + Edge Functions
- **Regra de ouro:** N8N coordena. Codigo decide. Banco guarda. IA interpreta.

## Agentes (contratos em src/types/agents.ts)
- CustomerAssistant, CustomerRAG, BarberAssistant, BarberRAG
- ScheduleManager, PromptUpdater, MemoryBuilder, ContextOrchestrator
- Todos seguem AgentInput/AgentOutput. Saida sempre JSON estruturado.

## Abstracoes (interfaces em src/types/providers.ts)
- CalendarProvider, MessagingProvider, AiProvider
- CustomerRepository, AppointmentRepository
- Nunca acoplar dominio diretamente a APIs externas.

## Convencoes
- TypeScript strict (sem `any`). Componentes PascalCase, hooks/utils camelCase.
- RLS sempre habilitado por tenant_id. Proibido misturar dados entre tenants.
- Git: Conventional Commits em portugues.
- Codigo em ingles, UI em pt-BR.
- Cores via tokens Tailwind (primary, secondary, bg). Nunca hex hardcoded.

## Design System
- Primary: Midnight Navy (#1A1A2E) | Secondary: Brass Gold (#C4A35A) | Accent: #E8B04A | Bg: #FAFAF8
- Fonts: DM Serif Display (headings), Inter (body), JetBrains Mono (dados)

## Dev
- `npm run dev` (porta 3000) | `npm run build` | `npm run lint`
- Tenant ID dev: `00000000-0000-0000-0000-000000000000`

## Colaboracao
- Registrar bloqueios em docs/ai-collab/duvidas.md
- Registrar melhorias em docs/ai-collab/sugestoes.md
- Registrar decisoes em docs/ai-collab/decisoes.md
- Atualizar docs/ai-collab/proxima-sessao.md ao fim de cada tarefa
