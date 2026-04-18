# Etapa 09 — Analytics com Funil

**Duração estimada:** 3-4 dias
**Depende de:** [05 — Observabilidade IA](05-observabilidade-ia.md) + [06 — Financeiro](06-painel-financeiro.md)
**Prioridade:** 🟢 Alto valor

## Objetivo

Substituir o dashboard de dados mockados por analytics real. Mostrar ao barbeiro **onde o negócio perde clientes** no funil, **quais horários rendem mais**, **quais barbeiros performam melhor**, **qual o LTV** — dados que levam a decisões.

---

## 9.1 — Métricas chave

### Funil principal
```
Mensagens recebidas (WhatsApp)
    ↓  taxa de resposta da IA
Conversas ativas
    ↓  taxa de agendamento
Agendamentos criados
    ↓  taxa de confirmação
Agendamentos confirmados
    ↓  taxa de comparecimento (1 - no_show_rate)
Atendimentos completos
    ↓  ticket médio
Receita
```

### Outras métricas
- **LTV médio por cliente** — soma histórica / número de clientes
- **CAC estimado** — custo IA + custo de campanha / novos clientes (quando houver)
- **No-show rate por barbeiro / horário / dia da semana**
- **Horários mais rentáveis** (heatmap 7 dias × 24 horas)
- **Ticket médio por serviço**
- **Taxa de reagendamento**
- **Taxa de retenção** (% clientes que voltam em 30/60/90 dias)
- **Duração média de conversa** (quantas mensagens até agendar)

---

## 9.2 — Views SQL materializadas

```sql
-- View: funnel diário
CREATE MATERIALIZED VIEW daily_funnel AS
SELECT
  tenant_id,
  DATE(created_at) AS day,
  COUNT(DISTINCT conversation_id) FILTER (WHERE role = 'client') AS conversations_with_inbound,
  COUNT(DISTINCT conversation_id) FILTER (WHERE role = 'ai') AS conversations_with_ai_reply,
  (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = m.tenant_id AND DATE(a.created_at) = DATE(m.created_at)) AS appointments_created,
  (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = m.tenant_id AND DATE(a.created_at) = DATE(m.created_at) AND a.status = 'completed') AS appointments_completed,
  (SELECT COALESCE(SUM(price_cents), 0) FROM appointments a WHERE a.tenant_id = m.tenant_id AND DATE(a.created_at) = DATE(m.created_at) AND a.status = 'completed') AS revenue_cents
FROM messages m
GROUP BY tenant_id, DATE(created_at);

CREATE UNIQUE INDEX ON daily_funnel (tenant_id, day);

-- Refresh a cada hora via pg_cron
```

Outras views:
- `hourly_heatmap` — 7×24 com revenue e count
- `barber_performance` — por barbeiro, janela móvel de 30 dias
- `customer_cohorts` — retenção por mês de primeira visita
- `service_performance` — receita e popularidade por serviço

---

## 9.3 — Substituir o dashboard atual

O Dashboard hoje ([DashboardPage.tsx:20-44](src/pages/dashboard/DashboardPage.tsx#L20-L44)) tem arrays mockados. Vamos substituir (embora o usuário tenha dito para não priorizar isso agora pois depende do N8N) por um dashboard que:

- **Se há dados** → mostra dados reais
- **Se não há dados (pré-N8N)** → mostra estado vazio com CTA "Conectar WhatsApp para começar"

### Novos cards do dashboard

1. **Hoje em números**: agendamentos hoje, receita prevista, conversas ativas, mensagens não lidas
2. **Funil da semana**: visualização compacta dos 5 estágios
3. **Próximos 3 agendamentos** (real)
4. **Atividade IA recente** (real, de `ai_decision_logs`)
5. **Top 3 barbeiros do mês** (real)

---

## 9.4 — Página dedicada: `/analytics`

Mais profunda que o dashboard, para quando o barbeiro quer investigar:

```
src/pages/analytics/
├── AnalyticsPage.tsx
├── components/
│   ├── PeriodSelector.tsx       (7d/30d/90d/custom)
│   ├── FunnelChart.tsx          (funil visual)
│   ├── RevenueHeatmap.tsx       (7×24)
│   ├── BarberComparison.tsx     (gráfico radar)
│   ├── CohortRetentionTable.tsx (matriz de retenção)
│   ├── ServicePopularityChart.tsx
│   └── AIContributionCard.tsx   (% receita gerada pela IA)
```

---

## 9.5 — Insights automáticos

Bloco "💡 Insights" no topo da página de analytics que mostra 2-3 observações geradas por query:

- "Terças às 15h rendem 2x mais que a média — considere bloquear para alta demanda"
- "Cliente João Silva não volta há 60 dias — historicamente gasta R$ 120/mês"
- "No-show rate aumentou 15% esta semana — revise lembretes automáticos?"

Gerados por queries agendadas, cacheados por 1 hora.

---

## 9.6 — Exportação

- [ ] Botão "Exportar relatório" → PDF com todas as métricas do período
- [ ] CSV com dados brutos para análise externa

---

## Critérios de aceitação

- [ ] Todas as views materializadas criadas e refresh agendado
- [ ] Dashboard principal sem mais dados mockados (ou estado vazio bonito se N8N não conectado)
- [ ] Página `/analytics` com funil, heatmap, cohort
- [ ] Insights automáticos aparecem e são acionáveis
- [ ] Privacy Mode respeitado em todos os valores
- [ ] Performance: todas as queries < 200ms (graças às materialized views)
- [ ] Testes: queries retornam dados consistentes
