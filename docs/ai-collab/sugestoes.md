# Sugestões de Evolução — BlackHub Barber

> Gerado em: 2026-04-02 | Contexto: Patch de Evolução Config + Onboarding

---

## 1. Context Builder para IA (Prioridade Alta)

Criar uma Edge Function ou serviço que monta o **contexto completo do tenant** em formato JSON/texto para alimentar o prompt da IA. Consulta unificada em:

- `tenants` → nome, endereço, horários
- `tenant_settings` → descrição, estilo, público-alvo, diferenciais
- `tenant_ai_settings` → tom de voz, estilo de atendimento, mensagens padrão
- `tenant_booking_settings` → regras de agendamento, políticas
- `barbers` → equipe ativa com especialidades
- `services` → catálogo de serviços com preços e duração

**Benefício**: O prompt da IA nunca fica desatualizado — sempre reflete o estado real do tenant.

---

## 2. Agenda por Barbeiro (Prioridade Alta)

Atualmente, a agenda é por tenant. A equipe já está separada na tabela `barbers`. Próximo passo natural:

- Adicionar `barber_id` (FK → barbers.id) na tabela `appointments`
- Permitir que clientes escolham o barbeiro no agendamento
- Suportar horários individuais por barbeiro (carga horária, folgas)

---

## 3. Validação de Formulários com Zod (Prioridade Média)

Todos os formulários de settings e onboarding usam validação básica. Migrar para schemas Zod:

- Validação tipada no frontend
- Reutilização entre formulários de settings e onboarding
- Base para validação no futuro backend/edge functions

---

## 4. Versionamento de Prompt IA (Prioridade Baixa)

Quando o agente IA estiver ativo, criar sistema de versionamento:

- Salvar versões do contexto construído (snapshot)
- Permitir A/B testing de personalidades
- Rastrear performance por versão de prompt

---

## 5. Dashboard de Integrações (Prioridade Baixa)

Expandir a aba de integrações com:

- Histórico de syncs (último sucesso, falhas)
- Botão de reconexão para WhatsApp
- Teste de webhook N8N inline
- Status de saúde das integrações em tempo real

---

## 6. Onboarding Progressivo (Prioridade Baixa)

Permitir que o onboarding seja **revisitável**:

- Indicador no dashboard mostrando % de configuração completa
- Link para completar itens pendentes (ex: equipe, IA)
- Gamificação leve (barra de progresso de setup)
