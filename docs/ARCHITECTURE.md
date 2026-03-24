# ARCHITECTURE.md — BarberFlow

## Visão Geral
O BarberFlow é um SaaS multi-tenant projetado para barbearias. Ele utiliza uma arquitetura de duas camadas para separar a orquestração de mensagens da interface de gestão.

## Camadas

### 1. Camada de Orquestração (N8N)
- **Responsabilidade:** Receber webhooks, processar lógica de IA, integrar com WhatsApp/Instagram e Google Calendar.
- **Ferramentas:** N8N, Claude API, Evolution API (WhatsApp), Google Calendar API.
- **Fluxo:** Webhook -> Identificação de Tenant -> Agente IA -> Ação (Agendamento/Resposta).

### 2. Camada de Gestão (Next.js)
- **Responsabilidade:** Dashboard para o dono, CRM, configurações de IA, gestão de serviços e faturamento.
- **Ferramentas:** Next.js 15, Tailwind CSS 4, shadcn/ui, Supabase Auth/Realtime.
- **Fluxo:** Autenticação -> Dashboard -> Gestão de Dados.

## Banco de Dados (Supabase)
- **Fonte de Verdade:** Centraliza todos os dados (tenants, clientes, agendamentos, mensagens, base de conhecimento).
- **Isolamento:** Row Level Security (RLS) garante que cada tenant acesse apenas seus próprios dados.
- **RAG:** Utiliza `pgvector` para busca semântica na base de conhecimento.

## Integrações
Consulte `docs/INTEGRATIONS.md` para detalhes técnicos.
