# Etapa 07 — Fidelidade / Loyalty

**Duração estimada:** 3-4 dias
**Depende de:** [06 — Painel Financeiro](06-painel-financeiro.md) (precisa de transações para calcular pontos)
**Prioridade:** 🟢 Alto valor

## Objetivo

Programa de fidelidade configurável que aumenta retenção e justifica o valor do SaaS. O schema já tem `clients.loyalty_points` — falta a lógica, regras e UI.

---

## 7.1 — Modelo de regras

### `loyalty_program`
```sql
CREATE TABLE loyalty_program (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  enabled BOOLEAN DEFAULT FALSE,
  program_name TEXT DEFAULT 'Fidelidade',

  -- Como ganhar pontos
  points_per_brl INT DEFAULT 1,             -- 1 ponto a cada R$ 1 gasto
  bonus_on_birthday INT DEFAULT 50,
  bonus_on_signup INT DEFAULT 20,
  bonus_on_referral INT DEFAULT 100,

  -- Validade
  points_expire_days INT,                   -- null = não expira

  -- Tiers (opcional)
  tiers JSONB DEFAULT '[
    {"name":"Bronze","min_points":0,"benefit":null},
    {"name":"Prata","min_points":500,"benefit":"5% desconto"},
    {"name":"Ouro","min_points":1500,"benefit":"10% desconto + bebida grátis"},
    {"name":"Platina","min_points":5000,"benefit":"15% desconto + corte grátis a cada 10"}
  ]',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `loyalty_rewards`
```sql
CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                       -- "Corte grátis", "Barba grátis"
  description TEXT,
  points_cost INT NOT NULL,
  reward_type TEXT CHECK (reward_type IN ('free_service','discount_percent','discount_fixed','gift')),
  reward_value JSONB,                       -- {service_id} ou {percent:10} ou {amount_cents:5000}

  max_redemptions_per_client INT,
  total_stock INT,                          -- null = ilimitado
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `loyalty_transactions`
```sql
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('earned','redeemed','expired','adjusted')),
  points INT NOT NULL,                      -- positivo ou negativo
  reason TEXT,
  related_appointment_id UUID REFERENCES appointments(id),
  related_reward_id UUID REFERENCES loyalty_rewards(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_client_date ON loyalty_transactions (client_id, created_at DESC);
```

### Trigger automático: agendamento completado → pontos

```sql
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  program loyalty_program;
  points_to_award INT;
BEGIN
  SELECT * INTO program FROM loyalty_program WHERE tenant_id = NEW.tenant_id;
  IF NOT FOUND OR NOT program.enabled THEN RETURN NEW; END IF;

  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    points_to_award := (NEW.price_cents / 100) * program.points_per_brl;

    INSERT INTO loyalty_transactions (tenant_id, client_id, type, points, reason, related_appointment_id)
    VALUES (NEW.tenant_id, NEW.client_id, 'earned', points_to_award,
            'Agendamento concluído', NEW.id);

    UPDATE clients SET loyalty_points = loyalty_points + points_to_award WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 7.2 — UI

### Nova página: `/loyalty`

```
src/pages/loyalty/
├── LoyaltyPage.tsx
├── components/
│   ├── LoyaltyProgramSetup.tsx    (configuração do programa)
│   ├── RewardsList.tsx            (CRUD de recompensas)
│   ├── RewardModal.tsx
│   ├── TierBadge.tsx              (badge Bronze/Prata/Ouro/Platina)
│   ├── ClientLeaderboard.tsx      (top clientes por pontos)
│   └── RedemptionHistory.tsx      (histórico de resgates)
```

### Integração na página de clientes

Em [CustomersPage](src/pages/customers/CustomersPage.tsx), adicionar:
- Coluna "Pontos" com `<TierBadge />`
- Botão "Ajustar pontos" no modal de cliente
- Histórico de transações de pontos

### Integração no chat

Quando a IA atende, o prompt passa a receber:
```
Cliente {nome} tem {X} pontos (tier {Y}). Pode oferecer: {rewards disponíveis}.
```
Isso é adicionado automaticamente pelo `promptBuilder` da Etapa 03.

---

## 7.3 — Automação via N8N

Tool nova:
```json
// redeem_reward
{ "client_id": "uuid", "reward_id": "uuid" }
```

A IA pode dizer ao cliente: "Você tem 500 pontos! Quer trocar por barba grátis?" e, com confirmação, chamar essa tool.

### Tarefas

- [ ] Tool `redeem_reward` na Edge Function de tools
- [ ] Validação: cliente tem pontos suficientes, reward está ativo, não ultrapassou `max_redemptions_per_client`
- [ ] Atualiza `loyalty_transactions` e `clients.loyalty_points`
- [ ] Aplica desconto no próximo agendamento automaticamente

---

## Critérios de aceitação

- [ ] Página `/loyalty` funcional
- [ ] Trigger SQL concede pontos automaticamente em agendamento completado
- [ ] UI de configuração do programa (ativar, pontos/real, bônus)
- [ ] CRUD de recompensas
- [ ] Integração no prompt da IA (menciona pontos do cliente)
- [ ] Tool `redeem_reward` testada
- [ ] Leaderboard de top clientes
- [ ] Testes: ganho, resgate, expiração, ajuste manual
