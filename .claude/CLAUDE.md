# CLAUDE.md — BarberFlow

## Sobre o Projeto
BarberFlow é um SaaS multi-tenant para barbearias. Centraliza atendimento via WhatsApp/Instagram com IA humanizada, agendamentos inteligentes, CRM e dashboard de métricas.

## Arquitetura
- **N8N:** Orquestração de mensagens (WhatsApp/Instagram -> Agente IA -> Google Calendar).
- **Next.js:** Plataforma SaaS (Dashboard, CRM, Configurações, Stripe).
- **Supabase:** Banco compartilhado com isolamento RLS e suporte a RAG (pgvector).

## Stack
- Next.js 15 (App Router)
- Tailwind CSS 4 + shadcn/ui
- Supabase (Auth, DB, Realtime)
- Anthropic Claude API
- Evolution API (WhatsApp)

## Convenções de Código
- **TypeScript:** Strict mode sempre.
- **Componentes:** PascalCase (ex: `ClientCard.tsx`).
- **Hooks/Utils:** camelCase (ex: `useClients.ts`).
- **RLS:** Sempre habilitado por tenant_id.
- **Git:** Conventional Commits (feat, fix, docs).

## Comandos Úteis
- `npm run dev`: Iniciar servidor de desenvolvimento.
- `npm run build`: Build de produção.
- `npm run lint`: Rodar linting.
- `npm run type-check`: Verificar tipos TypeScript.
