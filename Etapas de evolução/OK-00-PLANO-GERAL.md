# Plano Geral de Evolução — BlackHub Barber

> Documento mestre. Cada etapa abaixo tem um arquivo próprio com detalhamento.
> Data de criação: 2026-04-10

---

## Visão

Transformar o BlackHub Barber de MVP para produto pronto para lançamento, priorizando:
1. **Qualidade técnica sólida** antes de empilhar features (testes, cache, erros, observabilidade)
2. **Preparação robusta para integração N8N + Evolution API** — o sistema deve estar pronto para receber dados do agente IA sem precisar refatoração
3. **Formulários de configuração consolidados** — única fonte da verdade para construir o prompt da IA
4. **Segurança visual** — o app roda em telas de barbearia com clientes vendo; dados financeiros e pessoais precisam ser ocultáveis
5. **Features que geram receita** — financeiro, fidelidade, campanhas, analytics

---

## Fases e Ordem de Execução

### FASE 1 — Fundação (bloqueia tudo o que vem depois)
- **[01 — Fundação Técnica](01-fundacao-tecnica.md)**
  TanStack Query, Zod schemas, ErrorBoundary, sistema de toasts, infraestrutura de testes (Vitest + RTL).
- **[02 — Refatoração de Componentes Grandes](02-refatoracao-componentes.md)**
  Quebrar Calendar (932 linhas) e Chat (799 linhas) em componentes gerenciáveis.
- **[03 — Configurações Unificadas](03-configuracoes-unificadas.md)** ⭐
  Consolidar formulários, eliminar duplicações, desenhar schema único que alimenta o prompt da IA.

### FASE 2 — Preparação para a IA Real
- **[04 — Preparação N8N + Evolution API](04-preparacao-n8n-evolution.md)**
  Contratos de webhook, canais realtime, ponto único de configuração de telefone.
- **[05 — Observabilidade de IA](05-observabilidade-ia.md)**
  Logs estruturados do que a IA decidiu e por quê. Crítico antes de ir para produção.

### FASE 3 — Features de Produto
- **[06 — Painel Financeiro](06-painel-financeiro.md)** 💰
  Com botão "olho" para ocultar dados sensíveis quando o app estiver aberto no balcão.
- **[07 — Fidelidade / Loyalty](07-fidelidade.md)**
- **[08 — Campanhas de Reengajamento](08-campanhas.md)**
- **[09 — Analytics com Funil](09-analytics-funil.md)**
- **[10 — RAG / Knowledge Base](10-rag-knowledge.md)**
- **[11 — Team Management Avançado](11-team-management.md)**

### FASE 4 — Expansão de Canal
- **[12 — Booking Público (Self-Service)](12-booking-publico.md)**
- **[13 — App do Barbeiro Mobile](13-app-barbeiro.md)**
- **[14 — Multi-tenant por Subdomínio](14-multi-tenant-subdominio.md)**

### FASE 5 — Segurança & Hardening
- **[15 — Segurança e Rate Limiting](15-seguranca.md)**

---

## Dependências entre etapas

```
01 Fundação ──┬──> 02 Refatoração ──> (resto)
              │
              └──> 03 Configs ──> 04 N8N/Evo ──> 05 Observabilidade
                                        │
                                        ├──> 06 Financeiro
                                        ├──> 07 Loyalty
                                        ├──> 08 Campanhas
                                        ├──> 09 Analytics
                                        └──> 10 RAG

06 + 11 ──> 12 Booking Público
11 ──> 13 App Mobile

14 Multi-tenant e 15 Segurança podem rodar em paralelo no final.
```

## Princípios de execução

- **Cada etapa termina com**: código em produção, testes passando, documentação atualizada em `docs/ai-collab/decisoes.md`.
- **Nenhuma etapa começa sem**: a etapa anterior estar completa e validada manualmente pelo usuário.
- **Conventional Commits em português** (CLAUDE.md regra): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- **Não introduzir `any`**. Nunca. (CLAUDE.md regra.)
- **RLS sempre ligado** por `tenant_id` em qualquer tabela nova.

## Métricas de sucesso do plano como um todo

| Métrica | Baseline atual | Meta pós-plano |
|---|---|---|
| Cobertura de testes | 0% | 60% services + 40% componentes críticos |
| Linhas em arquivo de página | 932 (pior caso) | ≤ 300 por arquivo |
| Campos duplicados em Settings | 5 | 0 |
| Páginas com dados mockados | Dashboard | 0 |
| Features "Em breve" no menu | Financeiro | 0 |
| Edge Functions sem rate limit | 2 | 0 |
| Dados sensíveis visíveis sem proteção | Financeiro (futuro) | Todos com toggle |

---

## Glossário rápido

- **Etapa**: arquivo Markdown neste diretório que descreve uma unidade entregável de trabalho.
- **Tenant**: uma barbearia no sistema (multi-tenant via `tenant_id`).
- **Agent**: agente de IA no N8N (CustomerAssistant, BarberAssistant, etc. — ver `src/types/agents.ts`).
- **Prompt de IA**: texto construído dinamicamente a partir das configurações da barbearia e enviado ao modelo.
