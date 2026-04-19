import { useState, useCallback } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { chatService, Message, Conversation } from '@/services/chatService';

export function useSendMessage(selectedConv: Conversation | null, onMessageSent?: (msg: Message) => void) {
  const { tenantId } = useTenant();
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !selectedConv || !tenantId) return;

    setIsSending(true);
    try {
      const msg = await chatService.sendOwnerMessage(selectedConv, content.trim());
      onMessageSent?.(msg);
      return msg;
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [selectedConv, tenantId, onMessageSent]);

  return {
    sendMessage,
    isSending,
  };
}