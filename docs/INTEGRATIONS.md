# INTEGRATIONS.md — BarberFlow

## 1. WhatsApp (Evolution API)
- **URL:** `https://sua-instancia.evolution.com`
- **Webhook:** N8N recebe eventos `messages.upsert`.
- **Identificação:** O nome da instância no Evolution segue o padrão `barberflow_{tenant_slug}`.

## 2. Instagram Messaging
- **Graph API:** Conectado via N8N.
- **Janela de 24h:** Respostas automáticas permitidas apenas dentro da janela de interação do usuário.

## 3. Google Calendar
- **OAuth2:** Cada tenant autoriza sua própria conta Google.
- **Sincronização:** Agendamentos criados pela IA no N8N são inseridos no calendário do tenant.

## 4. Claude API (Anthropic)
- **Modelo:** `claude-3-5-sonnet` ou `claude-3-opus`.
- **Uso:** Orquestrado pelo N8N para gerar respostas humanizadas e processar intenções.

## 5. Stripe
- **Assinaturas:** Gestão de planos (Basic, Professional, Premium) para os tenants.
- **Webhooks:** Atualizam o status da conta no Supabase.
