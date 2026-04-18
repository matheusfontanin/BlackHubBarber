-- Migration 00007: Enable Realtime for Conversations and Messages — Etapa 04
-- Habilitar realtime para tabelas de conversas e mensagens para N8N

-- =============================================================
-- 1. Habilitar realtime para conversations
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- =============================================================
-- 2. Habilitar realtime para messages
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =============================================================
-- 3. Habilitar realtime para appointments (para atualizações de agenda)
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;