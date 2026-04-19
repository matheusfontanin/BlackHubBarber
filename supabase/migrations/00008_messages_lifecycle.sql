-- Migration 00008: Messages lifecycle — Etapa 04
-- Preparar o schema para receber mensagens vindas do N8N/Evolution:
--   * delivery_status explícito na tabela messages
--   * unread_count nas conversations
--   * trigger que sincroniza last_message_at e unread_count ao inserir uma mensagem

-- =============================================================
-- 1. messages.delivery_status
-- =============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS delivery_status TEXT
  CHECK (delivery_status IN ('pending','sent','delivered','read','failed'))
  DEFAULT 'delivered';

-- =============================================================
-- 2. conversations.unread_count
-- =============================================================
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS unread_count INT NOT NULL DEFAULT 0;

-- =============================================================
-- 3. Trigger: atualizar last_message_at e unread_count
-- =============================================================
CREATE OR REPLACE FUNCTION sync_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'client' THEN
    UPDATE conversations
       SET last_message_at = NEW.created_at,
           unread_count = unread_count + 1
     WHERE id = NEW.conversation_id;
  ELSE
    UPDATE conversations
       SET last_message_at = NEW.created_at
     WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_conversation_on_message ON messages;
CREATE TRIGGER trg_sync_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION sync_conversation_on_message();

-- =============================================================
-- 4. Trigger: zerar unread_count quando todas as mensagens da conversa forem lidas
-- =============================================================
CREATE OR REPLACE FUNCTION reset_unread_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND (OLD.is_read IS DISTINCT FROM TRUE) THEN
    UPDATE conversations
       SET unread_count = GREATEST(0, (
         SELECT COUNT(*) FROM messages
         WHERE conversation_id = NEW.conversation_id
           AND role = 'client'
           AND is_read = FALSE
       ))
     WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reset_unread_on_read ON messages;
CREATE TRIGGER trg_reset_unread_on_read
  AFTER UPDATE OF is_read ON messages
  FOR EACH ROW EXECUTE FUNCTION reset_unread_on_read();
