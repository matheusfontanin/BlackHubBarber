import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { chatService, Conversation, ConversationStatus, ConversationChannel } from '@/services/chatService';

export function useConversations() {
  const { tenantId } = useTenant();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const fetchConversations = useCallback(async (
    status?: ConversationStatus | '',
    channel?: ConversationChannel | '',
    search?: string
  ) => {
    if (!tenantId) return;
    try {
      const data = await chatService.getConversations(tenantId, {
        status: status || undefined,
        channel: channel || undefined,
        search: search || undefined,
      });
      setConversations(data);
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!tenantId) return;

    const convChannel = chatService.subscribeToConversations(tenantId, () => {
      fetchConversations();
    });

    setIsConnected(true);

    return () => {
      convChannel.unsubscribe();
    };
  }, [tenantId, fetchConversations]);

  return {
    conversations,
    loading,
    isConnected,
    refetch: fetchConversations,
  };
}