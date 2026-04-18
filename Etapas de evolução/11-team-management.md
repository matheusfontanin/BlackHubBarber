# Etapa 11 — Team Management Avançado

**Duração estimada:** 3-4 dias
**Depende de:** [03 — Configurações Unificadas](03-configuracoes-unificadas.md) + [06 — Financeiro](06-painel-financeiro.md)
**Prioridade:** 🟡 Média

## Objetivo

Evoluir o cadastro de barbeiros de um CRUD simples para um módulo completo que considera: horários individuais, comissões, folgas, bloqueios, e controle de acesso ao sistema.

---

## 11.1 — Expandir schema de `barbers`

Hoje [src/types/settings.ts:65-77](src/types/settings.ts#L65-L77) tem apenas campos básicos. Expandir para:

```sql
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS commission_percentage INT DEFAULT 50;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS hired_date DATE;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS is_bookable_by_ai BOOLEAN DEFAULT TRUE;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS color_theme TEXT;  -- cor no calendário
```

### Novas tabelas

#### `barber_schedules` — horário padrão por dia da semana
```sql
CREATE TABLE barber_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,

  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,

  is_available BOOLEAN DEFAULT TRUE,

  UNIQUE(barber_id, day_of_week)
);
```

#### `barber_time_off` — folgas e bloqueios pontuais
```sql
CREATE TABLE barber_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,

  type TEXT CHECK (type IN ('vacation','sick','personal','blocked')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  approved BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `barber_services` — quais serviços cada barbeiro executa
```sql
CREATE TABLE barber_services (
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_price_cents INT,          -- override do preço padrão
  custom_duration_minutes INT,     -- override da duração
  PRIMARY KEY (barber_id, service_id)
);
```

---

## 11.2 — UI: Team Section reformulado

Reformular [TeamSettingsSection.tsx](src/components/settings/TeamSettingsSection.tsx):

```
src/components/settings/team/
├── TeamSettingsSection.tsx       (lista de barbeiros)
├── BarberCard.tsx                (card compacto)
├── BarberFormModal.tsx           (criar/editar — agora multi-step)
│   ├── BasicInfoStep.tsx         (nome, foto, contato)
│   ├── ScheduleStep.tsx          (grid semanal de horários)
│   ├── ServicesStep.tsx          (quais serviços executa)
│   ├── CommissionStep.tsx        (percentual ou regras)
│   └── AccessStep.tsx            (convidar para acessar o sistema?)
├── TimeOffManager.tsx            (aprovar/registrar folgas)
└── CommissionReport.tsx          (relatório mensal por barbeiro)
```

### Grid de horário visual

Componente reutilizável `<WeekScheduleGrid />` que mostra 7 linhas (dias) × timeline contínua, permite clicar e arrastar para definir horário de trabalho. Também usado em Settings → Agenda (horário da barbearia).

---

## 11.3 — Controle de acesso (opcional por barbeiro)

Hoje só o dono acessa o sistema. Adicionar:

- [ ] Botão "Convidar para acessar" no form do barbeiro
- [ ] Envia e-mail com link de signup
- [ ] Cria entrada em `tenant_members` com `role='barber'`
- [ ] Role `barber` tem permissões reduzidas:
  - ✅ Ver sua agenda
  - ✅ Marcar agendamentos como "em andamento" / "concluído"
  - ✅ Ver suas comissões
  - ❌ Ver financeiro geral
  - ❌ Editar settings da barbearia
  - ❌ Ver outros barbeiros
- [ ] RLS policies atualizadas para filtrar por `barber_id` quando role = 'barber'

---

## 11.4 — Relatório de comissão

Dentro de `/finance → Comissões`:

- Lista de barbeiros com:
  - Total de atendimentos no mês
  - Receita gerada
  - Comissão calculada (R$)
  - Pendente / Pago
  - Botão "Marcar como pago" → cria `financial_transactions` tipo `commission_payout`

---

## 11.5 — Integração com agenda

- [ ] `CalendarPage` respeita `barber_schedules` — não permite criar agendamento fora do horário do barbeiro
- [ ] Barra visual mostrando "fora do expediente" em cinza
- [ ] Folgas aparecem como blocos bloqueados
- [ ] IA não sugere horários fora do expediente do barbeiro

---

## 11.6 — Integração com prompt da IA

Atualizar `buildSystemPrompt` (Etapa 03) para incluir:

```
# EQUIPE E HORÁRIOS
- Carlos Silva: Seg-Sex 09h-18h, Sáb 09h-14h. Especialidade: degradê americano
- Rafael Santos: Ter-Sáb 10h-20h. Especialidade: barba
```

Assim a IA pode sugerir "Carlos atende até 18h, quer encaixar às 17h?".

---

## Critérios de aceitação

- [ ] Barbeiro com horário semanal configurável
- [ ] Folgas registradas e bloqueiam a agenda
- [ ] Comissão calculada e exportada
- [ ] Relatório de comissão com botão "marcar como pago"
- [ ] Controle de acesso (role barber) funcional
- [ ] RLS testado — barbeiro não vê dados de outros
- [ ] IA respeita horários ao sugerir slots
- [ ] Testes: cálculo de comissão, conflitos de horário, acesso negado
