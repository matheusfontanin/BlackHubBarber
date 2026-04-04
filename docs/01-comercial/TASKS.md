# Pilar Comercial — Tasks

## Etapa A: Dados ✅
- [x] Adicionar `google_calendar_id` na tabela `barbers`
- [x] Corrigir FK `appointments.barber_id` → `barbers`
- [x] Adicionar novos status em constraints (appointments, conversations, messages)
- [x] Criar tabela `regras_dinamicas`
- [x] Adicionar `out_of_hours_enabled` em `tenant_booking_settings`

## Etapa B: Frontend ✅
- [x] Atualizar tipo `Barber` com `google_calendar_id`
- [x] Atualizar tipo `Appointment` com `barber_id` e `barbers` join
- [x] Adicionar campo Google Calendar ID no TeamSettingsSection
- [x] Atualizar query de appointments para trazer nome do barbeiro

## Etapa C: N8N Workflows ✅
- [x] `commercial.webhook.inbound.json` — Webhook de entrada do WhatsApp
- [x] `commercial.router.json` — Roteador de intenção do cliente
- [x] `commercial.customer.info-flow.json` — Fluxo de informações
- [x] `commercial.customer.booking-flow.json` — Fluxo de agendamento
- [x] `commercial.customer.reschedule-flow.json` — Fluxo de remarcação
- [x] `commercial.customer.cancel-flow.json` — Fluxo de cancelamento
- [x] `commercial.owner.rule-update-flow.json` — Fluxo de regras do dono
- [x] `send-whatsapp-reply.json` — Subworkflow compartilhado

## Etapa D: Integração (Pendente — Usuário)
- [ ] Importar workflows no N8N
- [ ] Configurar variáveis de ambiente no N8N (SUPABASE_URL, SUPABASE_SERVICE_KEY, EVOLUTION_API_URL, EVOLUTION_API_KEY)
- [ ] Configurar credenciais OpenAI no N8N
- [ ] Apontar IDs dos subworkflows nas variáveis WORKFLOW_*
- [ ] Testar fluxo completo com mensagem de teste
- [ ] Ativar webhook no N8N
- [ ] Configurar webhook URL na Evolution API
