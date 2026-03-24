# PLANO DE IMPLEMENTACAO — BarberFlow

> Ordem de execucao: 0 → 1 → 2 → 5 → 4 → 3 → 6 → 9 → 7 → 8 → 10 → 11 → 12

## STATUS ATUAL (24/03/2026)

**FASE 0 Progress:** 6/8 itens completos (75%)
- ✅ `.env` vars configurado
- ✅ `useTenant` hook implementado
- ✅ Auth → Tenant flow corrigido
- ✅ Refatoração TypeScript (sem `any`, tipos centralizados)
- ✅ Build validado
- ⏳ Git & GitHub (próximo)
- ⏳ Vercel (próximo)

**Próxima Fase:** FASE 1 (Auth & Onboarding) após inicializar Git

---

## FASE 0: Infraestrutura & Correcoes (Base)

- [ ] 0.1 — Inicializar Git + criar repo no GitHub + primeiro commit
- [x] 0.2 — Corrigir `.env.example` com todas as vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_N8N_WEBHOOK_URL`, `VITE_STRIPE_KEY`, `VITE_APP_URL`
- [x] 0.3 — Corrigir tenant dinamico: criado hook `useTenant` em `src/hooks/useTenant.ts`
- [x] 0.4 — Corrigir fluxo Auth → Tenant: onboardingService agora vincula user ao tenant via tenant_members
- [x] 0.5 — Refatoração TypeScript completa: removidos todos `any`, tipagem correta de errors, tipos centralizados para onboarding
- [x] 0.6 — Build validado: npm run build passa sem erros, 3145 módulos transformados
- [ ] 0.7 — Inicializar Git + criar repo no GitHub + primeiro commit
- [ ] 0.8 — Configurar Vercel: deploy preview + production branch

---

## FASE 1: Auth & Onboarding Completo

- [ ] 1.1 — Tela de registro (email+senha) com criacao automatica de tenant
- [ ] 1.2 — Onboarding WhatsApp real: integrar Evolution API, criar instancia, QR code real, webhook de status
- [ ] 1.3 — Onboarding Google Calendar real: OAuth2 flow completo, salvar refresh_token no Supabase
- [ ] 1.4 — Garantir que todos os steps do onboarding salvam corretamente no Supabase
- [ ] 1.5 — Protecao de rotas: redirecionar para onboarding se tenant nao completou setup

---

## FASE 2: Agenda & Google Calendar

- [ ] 2.1 — Calendario com dados reais do Supabase (substituir mock)
- [ ] 2.2 — Modal de agendamento completo: cliente, servico, profissional, data/hora, duracao automatica
- [ ] 2.3 — Sync bidirecional com Google Calendar (criar/editar/cancelar)
- [ ] 2.4 — Verificacao de conflitos antes de agendar
- [ ] 2.5 — Status de agendamento: confirmado, cancelado, concluido, no-show
- [ ] 2.6 — Lembrete via WhatsApp (N8N) 1h antes do agendamento

---

## FASE 3: CRM Completo

- [ ] 3.1 — Perfil do cliente expandido: historico de atendimentos, total gasto, preferencias, notas
- [ ] 3.2 — Tags e segmentacao: VIP, inativo, novo, etc
- [ ] 3.3 — Timeline do cliente: linha do tempo com todas as interacoes
- [ ] 3.4 — Busca avancada: filtros por data, servico, valor, tags
- [ ] 3.5 — Import/Export de clientes via CSV

---

## FASE 4: Chat/Inbox — Conversas WhatsApp

- [ ] 4.1 — Pagina Inbox: lista de conversas ativas com preview da ultima mensagem
- [ ] 4.2 — Chat view: visualizar conversa completa (cliente + IA) em tempo real
- [ ] 4.3 — Intervencao manual: dono assume conversa e responde via dashboard
- [ ] 4.4 — Status de conversa: aberta, resolvida pela IA, aguardando humano, fechada
- [ ] 4.5 — Supabase Realtime: mensagens novas em tempo real (subscription)
- [ ] 4.6 — Badge de conversas nao lidas + tempo medio de resposta

---

## FASE 5: Workflows N8N — Agente IA

- [ ] 5.1 — Workflow Mestre: webhook Evolution API → identificar tenant → rotear para sub-agente
- [ ] 5.2 — Agente Cliente: Claude API com contexto do tenant (servicos, horarios, precos). Intencoes: agendar, cancelar, preco, localizacao
- [ ] 5.3 — Agente Profissional: Claude API para dono (ver agenda, adicionar regra, alterar preco via WhatsApp)
- [ ] 5.4 — Tool Agendamento: verificar disponibilidade GCal → criar evento → confirmar via WhatsApp
- [ ] 5.5 — Persistencia: salvar todas as mensagens no Supabase (conversations + messages)
- [ ] 5.6 — RAG: busca semantica na base de conhecimento do tenant (pgvector)
- [ ] 5.7 — Fallback humano: marcar conversa como "aguardando humano" e notificar dono

---

## FASE 6: Dashboard com Dados Reais

- [ ] 6.1 — KPIs reais: faturamento mensal, clientes novos, agendamentos IA vs manual, taxa de conversao
- [ ] 6.2 — Graficos: faturamento por periodo, servicos populares, horarios de pico
- [ ] 6.3 — Feed de atividade IA: agendou, respondeu, escalou
- [ ] 6.4 — Resumo diario: agenda do dia, clientes esperados, faturamento previsto

---

## FASE 7: Fidelidade & Marketing

- [ ] 7.1 — Programa de pontos: configurar regras (X pontos por corte), visualizar saldo
- [ ] 7.2 — Resgate de pontos: trocar por servicos/descontos
- [ ] 7.3 — Programa de indicacao: link de indicacao, recompensa para quem indica e indicado
- [ ] 7.4 — Campanhas WhatsApp: criar campanha (reativacao, aniversario, promocao), enviar via N8N
- [ ] 7.5 — Templates de mensagem pre-aprovadas para campanhas

---

## FASE 8: Financeiro

- [ ] 8.1 — Registro de pagamentos: marcar agendamento como pago (dinheiro, PIX, cartao)
- [ ] 8.2 — Relatorio de faturamento: por periodo, por profissional, por servico
- [ ] 8.3 — Comissoes: configurar % por barbeiro, calculo automatico
- [ ] 8.4 — Despesas: registro de custos fixos/variaveis

---

## FASE 9: Stripe & Planos

- [ ] 9.1 — Checkout Stripe: tela de upgrade com planos (Free, Pro, Premium)
- [ ] 9.2 — Webhooks Stripe: atualizar status da assinatura no Supabase
- [ ] 9.3 — Feature gates: limitar features por plano (Free = 50 clientes, Pro = ilimitado)
- [ ] 9.4 — Portal do cliente: link para gerenciar assinatura/cartao no Stripe
- [ ] 9.5 — Trial: 14 dias gratis do plano Pro

---

## FASE 10: Multi-barbeiro & Equipe

- [ ] 10.1 — Convite de membros: dono convida barbeiros por email
- [ ] 10.2 — Roles e permissoes: Owner, Admin, Barber com acessos diferentes
- [ ] 10.3 — Agenda por profissional: cada barbeiro tem sua propria agenda
- [ ] 10.4 — Dashboard por profissional: barbeiro ve apenas seus dados

---

## FASE 11: Base de Conhecimento (RAG)

- [ ] 11.1 — UI de Knowledge Base: pagina para adicionar/editar artigos
- [ ] 11.2 — Geracao de embeddings: ao salvar artigo, gerar embedding e salvar no pgvector
- [ ] 11.3 — Treinamento via WhatsApp: dono envia "adicionar regra: X" e N8N salva na base
- [ ] 11.4 — Busca semantica: N8N consulta pgvector antes de cada resposta da IA

---

## FASE 12: Polish & Launch

- [ ] 12.1 — Error boundaries: tratamento de erros global no React
- [ ] 12.2 — Loading states: skeletons e spinners em todas as paginas
- [ ] 12.3 — Empty states: telas amigaveis quando nao ha dados
- [ ] 12.4 — SEO & Meta tags: Open Graph, title, description
- [ ] 12.5 — Landing page: pagina de vendas do BarberFlow
- [ ] 12.6 — Testes E2E: fluxos criticos (onboarding, agendar, chat)
- [ ] 12.7 — Monitoramento: logs, error tracking (Sentry)
