# Etapa 06 — Painel Financeiro 💰

**Duração estimada:** 5-7 dias
**Depende de:** [01 — Fundação Técnica](01-fundacao-tecnica.md)
**Prioridade:** 🟢 Alto valor

## Objetivo

Entregar um módulo financeiro completo que substitui o placeholder atual em [App.tsx:75](src/App.tsx#L75). Inclui **toggle de privacidade global** (olhinho) — pedido explícito do usuário — porque o app pode ficar aberto no balcão com clientes olhando a tela.

---

## 6.1 — Privacy Mode (olhinho) — requisito de segurança visual

### Conceito

Botão no header do dashboard (ícone 👁️ / 👁️‍🗨️) que quando ativado:
- Substitui todos os valores monetários por `R$ ••••` em toda a UI
- Substitui telefones e emails por `•••• ••••`
- Oculta nomes completos de clientes (mostra "J***** S****")
- Persiste via `localStorage` por device
- Tecla de atalho: `Ctrl+Shift+H` (Hide)

### Arquitetura

```ts
// src/contexts/PrivacyContext.tsx
interface PrivacyContextValue {
  isHidden: boolean;
  toggle: () => void;
  mask: (value: string | number, type: 'money'|'phone'|'email'|'name') => string;
}
```

### Componente utilitário

```tsx
// src/components/PrivateValue.tsx
<PrivateValue type="money">{revenue}</PrivateValue>
// renders: R$ 12.450  OR  R$ ••••• (se oculto)
```

### Tarefas

- [ ] Criar [src/contexts/PrivacyContext.tsx](src/contexts/PrivacyContext.tsx)
- [ ] Envolver `<App />` com `<PrivacyProvider>`
- [ ] Criar componente [src/components/PrivateValue.tsx](src/components/PrivateValue.tsx) com variantes `money`, `phone`, `email`, `name`, `custom`
- [ ] Criar hook `usePrivacyMask()`
- [ ] Adicionar botão 👁️ no header de [DashboardLayout](src/layouts/DashboardLayout.tsx) com tooltip
- [ ] Keyboard shortcut global (`Ctrl+Shift+H`)
- [ ] Animação suave de blur ao ativar (class Tailwind `blur-sm transition-all`)
- [ ] Persistir estado em `localStorage`
- [ ] Aplicar `<PrivateValue>` em **todos** os locais sensíveis:
  - Dashboard: KPIs de faturamento, custos IA
  - Financeiro: tudo
  - Customers: total gasto por cliente, telefone, email
  - Calendar: valor do agendamento
- [ ] Indicador visual permanente quando ativo (badge "Modo privado" no topo)

---

## 6.2 — Schema do financeiro

### `financial_transactions`
```sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('revenue','expense','refund','tip','commission_payout')),
  category TEXT,                   -- 'service','product','rent','salary','utility','other'
  description TEXT,

  amount_cents INT NOT NULL,       -- sempre em centavos para evitar float
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT CHECK (payment_method IN ('pix','credit','debit','cash','other')),

  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','appointment','stripe','imported')),

  notes TEXT,
  receipt_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tx_tenant_date ON financial_transactions (tenant_id, transaction_date DESC);
CREATE INDEX idx_tx_tenant_type ON financial_transactions (tenant_id, type);
```

### `commission_rules`
```sql
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,

  -- Se null em service_id → regra geral daquele barbeiro
  -- Se null em barber_id → regra geral daquele serviço

  rule_type TEXT CHECK (rule_type IN ('percentage','fixed')),
  percentage INT,                  -- 50 = 50%
  fixed_amount_cents INT,

  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Trigger automático: `appointment completed → transaction`

```sql
CREATE OR REPLACE FUNCTION create_transaction_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO financial_transactions (
      tenant_id, appointment_id, customer_id, barber_id,
      type, category, amount_cents, transaction_date, source
    ) VALUES (
      NEW.tenant_id, NEW.id, NEW.client_id, NEW.barber_id,
      'revenue', 'service', NEW.price_cents, CURRENT_DATE, 'appointment'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tx_on_completion
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION create_transaction_on_completion();
```

### Tarefas

- [ ] Migration `00007_financial_schema.sql` com as tabelas, triggers, RLS
- [ ] RLS: `tenant_id` filter padrão
- [ ] Schema Zod em [src/schemas/financialSchema.ts](src/schemas/financialSchema.ts)
- [ ] Service [src/services/financialService.ts](src/services/financialService.ts) com `listTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction`, `getMonthSummary`, `getBarberCommissions`

---

## 6.3 — Páginas do financeiro

### Rota: `/finance`

Substituir o placeholder em [App.tsx:75](src/App.tsx#L75) por `<FinancePage />`.

```
src/pages/finance/
├── FinancePage.tsx              (orquestração)
├── components/
│   ├── FinanceHeader.tsx        (filtro de período + novo lançamento)
│   ├── FinanceKPICards.tsx      (4 cards: receita, despesa, líquido, ticket médio)
│   ├── RevenueChart.tsx         (linha: receita diária dos últimos 30 dias)
│   ├── ExpenseBreakdown.tsx     (pizza: despesas por categoria)
│   ├── TransactionsTable.tsx    (tabela com filtros)
│   ├── TransactionModal.tsx     (criar/editar)
│   ├── CashFlowCalendar.tsx     (calendário visual com receita/dia)
│   └── ExportButton.tsx         (CSV/PDF)
└── hooks/
    ├── useTransactions.ts
    └── useMonthSummary.ts
```

### Sub-páginas (tabs dentro de /finance)

1. **Visão Geral** — KPIs + gráficos
2. **Lançamentos** — tabela completa com CRUD
3. **Comissões** — cálculo por barbeiro, com botão "marcar como pago"
4. **Relatórios** — export CSV/PDF por período, por barbeiro, por serviço
5. **Assinatura** — integração Stripe (plano do BlackHub)

### KPIs do mês

- 💰 Receita Bruta (soma `type='revenue'`)
- 📉 Despesas (soma `type='expense'`)
- 🟢 Lucro Líquido (diferença)
- 🎯 Ticket Médio (receita / número de atendimentos)
- 📈 vs mês anterior (%)
- 🤖 Custo IA do mês (de `ai_usage_stats`)

Todos com `<PrivateValue type="money">`.

---

## 6.4 — Gráficos

Escolher lib: **Recharts** (padrão, bem documentado, compatível com React 19).

- [ ] `npm install recharts`
- [ ] `RevenueChart` — LineChart com `transaction_date` × `SUM(amount_cents)` onde `type='revenue'`
- [ ] `ExpenseBreakdown` — PieChart agrupando por `category`
- [ ] `CashFlowCalendar` — heatmap estilo GitHub contributions, cada célula colorida por receita do dia
- [ ] Todos os gráficos respeitam o Privacy Mode: se ativo, esconde eixo Y e labels

---

## 6.5 — Integração Stripe

Preparação para cobrança da mensalidade do BlackHub para o barbeiro.

- [ ] Edge Function `stripe-create-checkout` (cria Checkout Session)
- [ ] Edge Function `stripe-webhook` (recebe eventos `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`)
- [ ] Atualiza `tenants.plan_status` conforme webhook
- [ ] Card em Settings → Assinatura mostrando plano atual, próxima cobrança, botão "gerenciar"
- [ ] Se `plan_status = 'past_due'`, banner de aviso no dashboard

---

## 6.6 — Exportação

- [ ] Botão "Exportar CSV" → gera CSV de `financial_transactions` do período filtrado
- [ ] Botão "Exportar PDF" → gera PDF com KPIs + tabela (usar `jsPDF` ou template HTML + `window.print()`)
- [ ] Incluir disclaimer "Dados confidenciais — uso interno"

---

## Critérios de aceitação

- [ ] `/finance` funcional, sem mais placeholders
- [ ] Privacy Mode oculta **todos** os valores monetários em toda a app (não só financeiro)
- [ ] Keyboard shortcut `Ctrl+Shift+H` funciona
- [ ] Trigger automático cria transaction quando agendamento é completado
- [ ] KPIs, gráficos e tabela mostram dados reais
- [ ] Cálculo de comissões funciona com regras por barbeiro e por serviço
- [ ] Export CSV/PDF funciona
- [ ] Stripe webhook atualiza `plan_status` corretamente (teste em sandbox)
- [ ] Testes: service com ≥ 10 cenários cobertos
- [ ] Zero regressão visual nas outras páginas
