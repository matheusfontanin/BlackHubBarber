# Etapa 12 — Booking Público (Self-Service)

**Duração estimada:** 4-5 dias
**Depende de:** [11 — Team Management](11-team-management.md)
**Prioridade:** 🟡 Média

## Objetivo

Link público `/b/{slug}` onde clientes finais podem agendar sozinhos sem precisar mandar mensagem no WhatsApp. **Complementa** (não substitui) o atendimento via IA. Ideal para:
- Cliente que prefere clicar em vez de conversar
- Link na bio do Instagram
- QR Code no balcão
- Compartilhamento em grupos

---

## 12.1 — Rotas públicas

```
/b/:slug                       → Home da barbearia (sobre, serviços, equipe, horários)
/b/:slug/agendar               → Wizard de agendamento
/b/:slug/meus-agendamentos     → Cliente visualiza agendamentos via link mágico
```

### Layout sem autenticação

Criar `<PublicLayout />` separado do `<DashboardLayout />`. Tema baseado no branding do tenant: logo, cores podem ser customizáveis (Etapa 14), ou usar default Midnight Navy + Brass Gold.

---

## 12.2 — Wizard de agendamento (3 passos)

### Passo 1: Escolher serviço
Cards com nome, duração, preço, descrição. Layout em grid.

### Passo 2: Escolher barbeiro e horário
- Seletor de barbeiro ("qualquer um" ou escolher específico)
- Calendário com dias disponíveis (cinza = sem vagas)
- Grade de horários do dia selecionado

### Passo 3: Dados do cliente
- Nome
- Telefone (com máscara)
- E-mail (opcional)
- Observações
- Checkbox: "Quero receber mensagens sobre promoções"

### Confirmação
- Resumo visual
- Botão "Confirmar"
- Após confirmação: página de sucesso com código + instruções

---

## 12.3 — Schema adicional

### `public_bookings` (opcional — pode usar `appointments` direto)
Marcar `appointments.source = 'public_booking'` já é suficiente. Apenas adicionar:

```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
  CHECK (source IN ('manual','ai','public_booking','api'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS public_confirmation_code TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_notes TEXT;
```

---

## 12.4 — Segurança

### Preocupações

1. **Bot flood** — alguém cria 10000 agendamentos fake
2. **Scraping** — alguém extrai lista de clientes

### Mitigações

- [ ] **Cloudflare Turnstile** ou **hCaptcha** no passo de confirmação
- [ ] Rate limit por IP na Edge Function `public-book`: máx 5 agendamentos/hora
- [ ] Fingerprint browser + cookie para detectar mesmo dispositivo
- [ ] Confirmação por SMS/WhatsApp opcional (envia código de 4 dígitos para validar telefone)
- [ ] RLS: rota pública nunca vê dados de outros clientes ou de barbeiros ausentes
- [ ] Campo `is_publicly_bookable` em `tenants` — pode desativar o link público

---

## 12.5 — Edge Functions

### `public-tenant-info`
```ts
// GET /functions/v1/public-tenant-info?slug=...
// response: { name, logo, description, services, barbers, opening_hours, address }
```
Apenas dados públicos. Sem autenticação.

### `public-available-slots`
```ts
// GET /functions/v1/public-available-slots?slug=...&service_id=...&date=...
// response: { slots: [{ start, end, barber_id }] }
```

### `public-book`
```ts
// POST /functions/v1/public-book
// body: { slug, service_id, barber_id, start_at, customer: {...}, captcha_token }
// response: { success, confirmation_code, appointment_id }
```
Com rate limit + captcha verification.

### `public-manage-booking`
```ts
// GET /functions/v1/public-manage-booking?code=...
// response: { appointment, allowed_actions: ['cancel','reschedule'] }
```

---

## 12.6 — UI

```
src/pages/public/
├── PublicLayout.tsx
├── PublicHomePage.tsx           (/b/:slug)
├── BookingWizard/
│   ├── BookingWizardPage.tsx    (/b/:slug/agendar)
│   ├── Step1ServiceSelection.tsx
│   ├── Step2DateTime.tsx
│   ├── Step3CustomerInfo.tsx
│   └── BookingSuccess.tsx
└── MyBookingPage.tsx            (/b/:slug/meus-agendamentos)
```

### Responsivo 100%

Link público será aberto majoritariamente no celular (via Instagram bio). Mobile-first obrigatório.

---

## 12.7 — Configuração do link público

Em Settings → Barbearia, adicionar seção:

```
┌──────────────────────────────────────────────┐
│ 🔗 Link Público de Agendamento               │
├──────────────────────────────────────────────┤
│ Status:  🟢 Ativo                            │
│ Link:    blackhub.com/b/sua-barbearia  [📋]  │
│                                              │
│ [Baixar QR Code]  [Compartilhar]             │
│                                              │
│ ☑ Permitir agendamento público               │
│ ☐ Exigir captcha                             │
│ ☐ Exigir confirmação SMS                     │
└──────────────────────────────────────────────┘
```

### Tarefas

- [ ] Input para customizar slug (único, validar disponibilidade)
- [ ] Gerador de QR Code (lib `qrcode` ou Edge Function)
- [ ] Botão "Copiar link"
- [ ] Preview do link em iframe opcional

---

## Critérios de aceitação

- [ ] Rota pública `/b/:slug` funcional sem autenticação
- [ ] Wizard completo de 3 passos
- [ ] Agendamento criado com `source='public_booking'`
- [ ] Aparece imediatamente na agenda do barbeiro (via Realtime)
- [ ] Rate limit + captcha funcionais
- [ ] Mobile responsivo
- [ ] QR Code gerado e baixável
- [ ] Testes: fluxo completo, rate limit bloqueia após 5, slug inválido retorna 404
