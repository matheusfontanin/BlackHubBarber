# DATABASE.md — BarberFlow

## Schema Overview
O banco de dados é hospedado no Supabase (PostgreSQL) e utiliza extensões para UUID, busca textual e vetores.

## Principais Tabelas

### `tenants`
Armazena os dados da barbearia, configurações de IA e status da assinatura.
- `id`: UUID (PK)
- `name`: Nome da barbearia
- `slug`: URL amigável
- `opening_hours`: JSONB com horários de funcionamento
- `ai_config`: Configurações de personalidade da IA

### `clients`
CRM de clientes por tenant.
- `tenant_id`: FK para tenants
- `phone`: WhatsApp do cliente
- `loyalty_points`: Pontos acumulados

### `appointments`
Agendamentos sincronizados com Google Calendar.
- `starts_at`: Início do serviço
- `status`: scheduled, confirmed, completed, canceled

### `messages`
Histórico de conversas via WhatsApp/Instagram.
- `role`: client, ai, owner
- `content`: Texto da mensagem

### `ai_knowledge`
Base de conhecimento para RAG.
- `embedding`: Vector(1536) para busca semântica

## Row Level Security (RLS)
Todas as tabelas possuem uma política de isolamento baseada no `tenant_id`.
```sql
CREATE POLICY "tenant_isolation" ON table_name 
FOR ALL USING (tenant_id = get_user_tenant_id());
```
