-- Adiciona coluna para armazenar o refresh token do Google Calendar
-- Necessário para renovar access tokens server-side (N8N + Edge Functions)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Adiciona coluna whatsapp_instance no tenant (nome da instância Evolution API)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS whatsapp_instance TEXT;
