# CLAUDE.md — BarberFlow

SaaS multi-tenant para barbearias. WhatsApp/Instagram com IA humanizada, agendamentos, CRM e dashboard.

## Arquitetura
- **React + Vite:** SPA (Dashboard, CRM, Inbox, Agenda, Config, Stripe)
- **N8N:** Orquestracao de mensagens (Evolution API -> Claude IA -> Google Calendar)
- **Supabase:** PostgreSQL com RLS por tenant_id + pgvector

## Convencoes
- TypeScript strict (sem `any`). Componentes PascalCase, hooks/utils camelCase.
- RLS sempre habilitado por tenant_id.
- Git: Conventional Commits em portugues.
- Codigo em ingles, UI em pt-BR.

## Design System
- Primary: Midnight Navy (#1A1A2E) | Secondary: Brass Gold (#C4A35A)
- Fonts: DM Serif Display (headings), Inter (body), JetBrains Mono (dados)

## Dev
- `npm run dev` (porta 3000) | `npm run build` | `npm run lint`
- Tenant ID dev: `00000000-0000-0000-0000-000000000000`
