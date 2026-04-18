# Etapa 03 — Configurações Unificadas & Prompt Builder

**Duração estimada:** 4-6 dias
**Depende de:** [01 — Fundação Técnica](01-fundacao-tecnica.md)
**Prioridade:** 🔴 Crítica ⭐

> Esta etapa é a **extra** que você pediu. Ela resolve duplicações, cria uma fonte única de verdade e, o mais importante, monta o prompt ideal para a IA do N8N.

---

## Duplicações confirmadas na auditoria

Conferi os arquivos de settings existentes e encontrei 5 campos duplicados:

| Campo | Lugar 1 | Lugar 2 | Decisão |
|---|---|---|---|
| `differentiators` | `TenantSettings` (Barbearia) | `TenantAISettings` (IA) | **Mover para Barbearia** — é dado do negócio |
| `target_audience` / `customer_profile` | `TenantSettings` | `TenantAISettings` | **Unificar** em `target_audience` em Barbearia |
| `description` / `business_summary` | `TenantSettings` | `TenantAISettings` | **Unificar** em `description` em Barbearia |
| `can_auto_schedule` | `TenantAISettings` | — | Renomear para `ai_can_auto_schedule` |
| `allow_ai_booking` | `TenantBookingSettings` | `TenantAISettings` | **Deletar um** — mesmo toggle duplicado |
| `must_confirm_before_booking` / `require_manual_confirmation` | `TenantAISettings` | `TenantBookingSettings` | **Unificar** em `ai_must_confirm_before_booking` |

Campos duplicados fazem o barbeiro preencher duas vezes e criam risco de inconsistência (se ele mudou em um lugar e não no outro, qual o agente IA usa?).

---

## 3.1 — Novo modelo de dados

### Tabelas consolidadas

Reorganizar em **3 tabelas claras** (uma por eixo semântico):

#### `tenant_business_profile` — tudo sobre o negócio
```sql
CREATE TABLE tenant_business_profile (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identidade
  legal_name TEXT,                 -- razão social (p/ nota fiscal)
  trade_name TEXT NOT NULL,        -- nome fantasia (aparece p/ cliente)
  owner_name TEXT,
  tagline TEXT,                    -- frase curta: "A barbearia do guerreiro moderno"
  description TEXT,                -- 2-4 parágrafos sobre o negócio
  founded_year INT,
  logo_url TEXT,

  -- Contato
  business_phone TEXT NOT NULL,    -- aparece p/ cliente
  whatsapp_number TEXT,            -- número usado pela IA (Evolution API)
  business_email TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  google_maps_url TEXT,

  -- Localização
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  landmark TEXT,                   -- "em frente ao mercado X" — útil p/ a IA explicar

  -- Posicionamento (alimenta o prompt)
  business_style TEXT CHECK (business_style IN ('classica','moderna','premium','urbana','vintage','familiar')),
  target_audience TEXT,            -- texto livre: "homens 25-45, executivos"
  price_positioning TEXT CHECK (price_positioning IN ('popular','intermediario','premium','luxo')),
  differentiators TEXT,            -- "ambiente climatizado, cerveja grátis, wi-fi"
  dress_code TEXT,                 -- "casual, sem camiseta regata"
  amenities TEXT[],                -- ['wifi','cerveja','cafe','estacionamento','tv']

  -- Horários (estruturado, não texto livre)
  opening_hours JSONB NOT NULL DEFAULT '{}',
  -- formato: { "mon": {"open":"09:00","close":"20:00","closed":false}, ... }
  holiday_dates DATE[],            -- datas específicas fechadas
  special_hours JSONB,             -- datas com horário diferente

  -- Regras de pagamento que a IA precisa saber
  payment_methods TEXT[],          -- ['pix','credito','debito','dinheiro']
  accepts_walk_in BOOLEAN DEFAULT TRUE,
  requires_deposit BOOLEAN DEFAULT FALSE,
  deposit_percentage INT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tenant_ai_config` — tudo sobre o comportamento do agente
```sql
CREATE TABLE tenant_ai_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identidade do agente
  assistant_name TEXT NOT NULL DEFAULT 'Assistente',
  assistant_avatar_url TEXT,
  assistant_gender TEXT CHECK (assistant_gender IN ('masculino','feminino','neutro')),

  -- Personalidade
  tone_of_voice TEXT CHECK (tone_of_voice IN ('profissional','descontraido','premium','amigo')),
  service_style TEXT CHECK (service_style IN ('direto','consultivo','acolhedor')),
  formality_level INT CHECK (formality_level BETWEEN 1 AND 5), -- 1=muito informal, 5=muito formal
  uses_emojis BOOLEAN DEFAULT TRUE,
  uses_slang BOOLEAN DEFAULT FALSE,

  -- Comportamento operacional (ÚNICO local — não duplicar em booking)
  can_auto_schedule BOOLEAN DEFAULT FALSE,
  must_confirm_before_booking BOOLEAN DEFAULT TRUE,
  can_reply_outside_business_hours BOOLEAN DEFAULT FALSE,
  can_suggest_services BOOLEAN DEFAULT TRUE,
  can_negotiate_price BOOLEAN DEFAULT FALSE,
  can_collect_feedback BOOLEAN DEFAULT TRUE,
  max_messages_before_escalation INT DEFAULT 20,
  escalation_keywords TEXT[],      -- ['reclamação','gerente','processo']

  -- Contexto específico (alimenta o system prompt)
  important_notes TEXT,            -- "nunca prometa horário sem confirmar na agenda"
  forbidden_topics TEXT[],         -- ['política','religião']
  signature_services TEXT,         -- "destaque: nosso corte executivo + lavagem premium"
  upsell_guidelines TEXT,          -- "sempre ofereça barba se cliente pediu só corte"

  -- Mensagens padrão (com placeholders {nome}, {barbearia}, etc.)
  greeting_message TEXT,
  out_of_hours_message TEXT,
  booking_confirmation_template TEXT,
  booking_reminder_template TEXT,
  cancellation_message_template TEXT,
  post_service_thankyou TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tenant_booking_rules` — apenas regras de agenda (sem sobreposição com IA)
```sql
CREATE TABLE tenant_booking_rules (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  min_booking_notice_minutes INT DEFAULT 60,
  max_booking_notice_days INT DEFAULT 30,
  buffer_between_appointments_minutes INT DEFAULT 10,
  allow_simultaneous_per_barber BOOLEAN DEFAULT FALSE,
  slot_granularity_minutes INT DEFAULT 15, -- horários em incrementos de 15min

  reschedule_limit INT DEFAULT 2,
  reschedule_min_notice_hours INT DEFAULT 2,
  cancellation_min_notice_hours INT DEFAULT 2,
  cancellation_policy TEXT,

  no_show_penalty TEXT,            -- texto explicando
  no_show_blocks_future_bookings BOOLEAN DEFAULT FALSE,
  no_show_max_before_block INT DEFAULT 2,

  send_reminder_hours_before INT DEFAULT 24,
  send_confirmation_on_booking BOOLEAN DEFAULT TRUE,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migração do schema antigo

- [ ] Criar `supabase/migrations/00005_unified_settings.sql` com:
  - Criação das 3 novas tabelas com RLS por `tenant_id`
  - Trigger de `updated_at` automático
  - Copy de dados de `tenant_settings`, `tenant_ai_settings`, `tenant_booking_settings` para as novas
  - Manter tabelas antigas por 1 release (com comentário `-- DEPRECATED: remover em 2026-05`)
- [ ] Policies RLS:
  ```sql
  CREATE POLICY "tenant_can_read_own_profile"
  ON tenant_business_profile FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
  ```

---

## 3.2 — UI: Formulário unificado multi-step

### Estrutura nova das abas em Settings

```
Settings/
├── Barbearia (aba 1)
│   ├── Identidade (nome, logo, tagline, descrição)
│   ├── Contato (telefone, whatsapp, email, redes)
│   ├── Localização (endereço estruturado + mapa)
│   ├── Posicionamento (estilo, público, preço, diferenciais)
│   ├── Horários (grid visual por dia da semana)
│   ├── Comodidades & Pagamento
│   └── Feriados & Datas especiais
├── Equipe (aba 2) — ver Etapa 11
├── Agenda (aba 3)
│   ├── Antecedência e buffer
│   ├── Reagendamento e cancelamento
│   ├── No-show
│   └── Lembretes
├── IA (aba 4)
│   ├── Identidade do Assistente (nome, avatar, gênero)
│   ├── Personalidade (tom, estilo, formalidade, emojis)
│   ├── Poderes (pode agendar, confirmar, negociar...)
│   ├── Guardrails (tópicos proibidos, palavras de escalação)
│   ├── Mensagens Padrão (com preview de placeholders)
│   └── 🎯 Preview do Prompt Final (ver 3.3)
└── Integrações (aba 5) — ver Etapa 04
```

### Tarefas

- [ ] Reescrever [BarbershopSettingsSection.tsx](src/components/settings/BarbershopSettingsSection.tsx) com sub-seções colapsáveis
- [ ] Criar componente `<OpeningHoursEditor />` — grid com 7 linhas (dias) × colunas (abre/fecha/fechado)
- [ ] Criar componente `<AmenitiesPicker />` — multi-select com ícones
- [ ] Reescrever [AiSettingsSection.tsx](src/components/settings/AiSettingsSection.tsx) sem os campos duplicados
- [ ] Reescrever [BookingSettingsSection.tsx](src/components/settings/BookingSettingsSection.tsx) sem toggles de IA
- [ ] Todos os forms usando `useForm + zodResolver` (resultado da Etapa 01)
- [ ] Toasts em vez de `alert()` (resultado da Etapa 01)

---

## 3.3 — Prompt Builder (o coração da etapa)

### O que é

Uma função pura que transforma `tenant_business_profile + tenant_ai_config + serviços + barbeiros + regras de agenda` em um **system prompt** que o N8N vai enviar ao modelo de IA.

### Arquivo: `src/lib/ai/promptBuilder.ts`

```ts
import type { TenantBusinessProfile, TenantAIConfig, TenantBookingRules, Service, Barber } from '@/types';

interface PromptContext {
  profile: TenantBusinessProfile;
  ai: TenantAIConfig;
  booking: TenantBookingRules;
  services: Service[];
  barbers: Barber[];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  return `
# IDENTIDADE
Você é ${ctx.ai.assistant_name}, assistente virtual da ${ctx.profile.trade_name}.
${ctx.profile.tagline ? `Slogan do negócio: "${ctx.profile.tagline}"` : ''}

# SOBRE A BARBEARIA
${ctx.profile.description}

- Estilo: ${ctx.profile.business_style}
- Público-alvo: ${ctx.profile.target_audience}
- Posicionamento de preço: ${ctx.profile.price_positioning}
- Diferenciais: ${ctx.profile.differentiators}
- Comodidades: ${ctx.profile.amenities?.join(', ')}

# LOCALIZAÇÃO E CONTATO
Endereço: ${formatAddress(ctx.profile)}
${ctx.profile.landmark ? `Referência: ${ctx.profile.landmark}` : ''}
Telefone: ${ctx.profile.business_phone}
Instagram: ${ctx.profile.instagram_handle}
${ctx.profile.google_maps_url ? `Mapa: ${ctx.profile.google_maps_url}` : ''}

# HORÁRIOS DE FUNCIONAMENTO
${formatOpeningHours(ctx.profile.opening_hours)}
${ctx.profile.holiday_dates?.length ? `Datas fechadas: ${ctx.profile.holiday_dates.join(', ')}` : ''}

# SERVIÇOS OFERECIDOS
${ctx.services.map(s => `- ${s.name}: R$ ${s.price} (${s.duration_minutes} min)${s.description ? ` — ${s.description}` : ''}`).join('\n')}

${ctx.ai.signature_services ? `\n**Serviços em destaque:** ${ctx.ai.signature_services}` : ''}
${ctx.ai.upsell_guidelines ? `\n**Orientação de upsell:** ${ctx.ai.upsell_guidelines}` : ''}

# EQUIPE
${ctx.barbers.map(b => `- ${b.name}${b.specialties ? ` (especialidades: ${b.specialties})` : ''}`).join('\n')}

# PERSONALIDADE
- Tom de voz: ${ctx.ai.tone_of_voice}
- Estilo de atendimento: ${ctx.ai.service_style}
- Nível de formalidade: ${ctx.ai.formality_level}/5
- Usar emojis: ${ctx.ai.uses_emojis ? 'sim, moderadamente' : 'não'}
- Usar gírias: ${ctx.ai.uses_slang ? 'pode' : 'não use'}

# REGRAS DE AGENDAMENTO
- Antecedência mínima: ${ctx.booking.min_booking_notice_minutes} minutos
- Antecedência máxima: ${ctx.booking.max_booking_notice_days} dias
- Intervalo entre atendimentos: ${ctx.booking.buffer_between_appointments_minutes} min
- Limite de reagendamentos: ${ctx.booking.reschedule_limit}
- Política de cancelamento: ${ctx.booking.cancellation_policy}

# SEUS PODERES
${ctx.ai.can_auto_schedule ? '✅ Você PODE criar agendamentos diretamente.' : '❌ Você NÃO pode criar agendamentos sem confirmação humana.'}
${ctx.ai.must_confirm_before_booking ? '⚠️ SEMPRE confirme horário e serviço com o cliente antes de fechar.' : ''}
${ctx.ai.can_reply_outside_business_hours ? '✅ Você pode responder fora do horário comercial.' : '❌ Fora do horário, use a mensagem de ausência.'}
${ctx.ai.can_suggest_services ? '✅ Você pode sugerir serviços.' : ''}
${ctx.ai.can_negotiate_price ? '✅ Você pode negociar preço (consulte o dono primeiro em casos grandes).' : '❌ NÃO negocie preço. Preços são fixos.'}

# GUARDRAILS
${ctx.ai.forbidden_topics?.length ? `Jamais fale sobre: ${ctx.ai.forbidden_topics.join(', ')}.` : ''}
${ctx.ai.escalation_keywords?.length ? `Se o cliente usar as palavras [${ctx.ai.escalation_keywords.join(', ')}], escale para um humano imediatamente.` : ''}

# OBSERVAÇÕES CRÍTICAS DO DONO
${ctx.ai.important_notes || '(nenhuma)'}

# SAÍDA
Responda sempre de forma natural. Quando agendar, use a tool 'create_appointment' com JSON estruturado. Quando precisar de informação de cliente, use 'lookup_customer'. Quando escalar, use 'escalate_to_human' com motivo.
  `.trim();
}
```

### Preview no dashboard de settings

Na aba IA, adicionar um painel colapsável **"🎯 Pré-visualização do prompt"** que chama `buildSystemPrompt()` com os valores atuais do form e mostra o resultado. Isso dá feedback visual imediato ao barbeiro do que a IA "sabe".

### Tarefas

- [ ] Criar [src/lib/ai/promptBuilder.ts](src/lib/ai/promptBuilder.ts) com a função `buildSystemPrompt`
- [ ] Testes unitários cobrindo: prompt com todos os campos preenchidos, prompt com campos opcionais vazios, formatação de horários, formatação de endereço
- [ ] Criar endpoint Edge Function `build-prompt` que o N8N chama para pegar o prompt atualizado (assim o N8N nunca fica com cache velho)
- [ ] Componente [src/components/settings/PromptPreview.tsx](src/components/settings/PromptPreview.tsx) — textarea readonly com botão "copiar"
- [ ] Incluir `PromptPreview` no fim da aba IA

---

## 3.4 — Migração dos dados existentes

- [ ] Script SQL que copia dados de `tenant_settings` → `tenant_business_profile`
- [ ] Script SQL que copia dados de `tenant_ai_settings` → `tenant_ai_config`
- [ ] Script SQL que copia dados de `tenant_booking_settings` → `tenant_booking_rules`
- [ ] Validar que nenhum tenant perdeu dados (query de conferência)

---

## Critérios de aceitação

- [ ] Zero campos duplicados entre os 3 domínios
- [ ] Schema Zod para cada uma das 3 tabelas
- [ ] Forms usando RHF + Zod
- [ ] `buildSystemPrompt` tem pelo menos 8 testes unitários
- [ ] Preview do prompt visível na aba IA, atualiza ao vivo conforme o form muda
- [ ] Edge Function `build-prompt` acessível com autenticação JWT do tenant
- [ ] Migration executada em dev sem perda de dados
- [ ] `docs/ai-collab/decisoes.md` atualizado explicando a consolidação
