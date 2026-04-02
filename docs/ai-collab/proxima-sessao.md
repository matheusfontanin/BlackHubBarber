# Próxima Sessão — Pós-Patch de Evolução

> Documento gerado em: 2026-04-02

---

## O que foi feito neste patch

### 1. Modelagem de Dados (Supabase)
- Criada tabela `tenant_settings` — dados complementares da barbearia
- Criada tabela `tenant_ai_settings` — configurações estruturadas da IA
- Criada tabela `tenant_booking_settings` — regras de agendamento
- Criada tabela `barbers` — profissionais da equipe
- Todas as tabelas com RLS habilitado e policies baseadas em tenant_members
- Índices de performance criados

### 2. Types TypeScript
- `src/types/settings.ts` — types para todos os domínios de configuração
- `src/types/onboarding.ts` — expandido com TeamBarberData e AiConfigData

### 3. Camada de Dados (Services)
- `src/services/settingsService.ts` — CRUD de configurações (upsert pattern)
- `src/services/teamService.ts` — CRUD de barbeiros (barbers table)
- `src/services/onboardingService.ts` — expandido para persistir novos dados

### 4. Página de Configurações (5 abas)
- BarbershopSettingsSection — dados institucionais + estratégicos
- TeamSettingsSection — CRUD completo de barbeiros com modal
- BookingSettingsSection — regras de agenda com toggles
- AiSettingsSection — personalidade, contexto, comportamento, mensagens
- IntegrationsSettingsSection — visão consolidada de integrações
- SettingsPage reescrito com sidebar de 5 seções

### 5. Onboarding Expandido (9 etapas)
- Step 5 (novo) — Equipe
- Step 8 (novo) — IA
- Fluxo expandido sem quebrar a UX existente

---

## Pendências

### Prioridade Alta
- Conectar aba Barbearia com update da tabela `tenants` principal
- Popular dados pré-existentes para tenants que já completaram onboarding

### Prioridade Média
- Reconexão de WhatsApp via aba de integrações
- Gestão de horários na aba Agenda
- Conectar barbeiros com agenda de atendimentos
- Upload de foto para barbeiros

### Prioridade Baixa
- Edge function para contexto dinâmico da IA
- Versionamento de configurações IA
- Dashboard de integrações com histórico

---

## Riscos

1. Dados duplicados entre `tenants` e `tenant_settings` — manter sincronizados
2. `barbers` vs `tenant_members` — appointments.barber_id ainda referencia tenant_members
3. RLS aberto para todo membro do tenant — pode precisar de roles granulares

---

## Próximo passo recomendado

1. Testar fluxo completo de onboarding com novo usuário
2. Verificar configurações com tenant existente
3. Conectar equipe à agenda
4. Iniciar construção do contexto dinâmico da IA
