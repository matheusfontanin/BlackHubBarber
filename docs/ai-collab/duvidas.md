# Dúvidas de Modelagem — BlackHub Barber

> Gerado em: 2026-04-02 | Contexto: Patch de Evolução Config + Onboarding

---

## 1. Duplicação de campos entre `tenants` e `tenant_settings`

**Situação**: Campos como `phone`, `email`, `address`, `city`, `state` existem em `tenants` (tabela principal) e também em `tenant_settings` (tabela complementar criada neste patch).

**Decisão tomada**: `tenant_settings` guarda dados complementares (description, business_style, target_audience, differentiators). Campos básicos como phone/email são copiados para `tenant_settings` durante o onboarding para facilitar a UI, mas a **fonte de verdade** é `tenants`.

**Risco**: Se o usuário alterar o phone em `tenant_settings` mas não em `tenants`, os dados ficam dessincronizados.

**Recomendação**: Na próxima fase, unificar a atualização — quando se salva em configurações, atualizar ambas as tabelas, ou migrar todos os dados para `tenant_settings` e manter `tenants` apenas com id/name/created_at.

---

## 2. `barbers.id` vs `tenant_members.id` em `appointments`

**Situação**: A tabela `appointments` tem `barber_id` que referencia `tenant_members.id`. Mas a nova tabela `barbers` é o local correto para profissionais.

**Decisão tomada**: Manter a FK atual e planejar a migração. A tabela `barbers` foi criada sem alterar `appointments`.

**Recomendação**: Na fase de "Agenda por Barbeiro", fazer a migração:
1. Adicionar coluna `barber_id_new` → FK para `barbers.id`
2. Migrar dados mapeando tenant_members → barbers
3. Remover a FK antiga

---

## 3. Granularidade de RLS

**Situação**: Todas as policies de RLS das novas tabelas permitem qualquer membro do tenant acessar/modificar dados.

**Pergunta**: Devemos restringir para que apenas `owner` e `admin` possam modificar configurações e apenas `owner` possa alterar AI settings?

**Decisão tomada**: Manter aberto para todos os membros por enquanto (simplifica o MVP).

**Recomendação**: Quando houver mais de 1 membro real por tenant, implementar roles granulares.

---

## 4. `tenant_integrations` vs campos diretos em `tenants`

**Situação**: WhatsApp e Google Calendar têm campos diretos em `tenants` (`whatsapp_connected`, `google_calendar_connected`). Mas também existe `tenant_integrations` como tabela genérica.

**Pergunta**: Qual é a fonte de verdade para status de integração?

**Decisão tomada**: O componente `IntegrationsSettingsSection` lê de ambos (`tenants` para WA/GCal, `tenant_integrations` para N8N).

**Recomendação**: Migrar tudo para `tenant_integrations` e remover campos legados de `tenants` quando possível.
