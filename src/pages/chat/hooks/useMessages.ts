import { useState, useEffect, useCallback } from 'react';
import { chatService, Message, Conversation } from '@/services/chatService';

export function useMessages(selectedConv: Conversation | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async (convId: string) => {
    setLoading(true);
    try {
      const data = await chatService.getMessages(convId);
      setMessages(data);
      // Mark as read
      await chatService.markAsRead(convId);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    } else {
      setMessages([]);
    }
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    if (!selectedConv) return;

    const msgChannel = chatService.subscribeToMessages(selectedConv.id, (payload: any) => {
      const newMsg = payload.new as Message;
      setMessages(prev => [...prev, newMsg]);
      chatService.markAsRead(selectedConv.id);
    });

    return () => {
      msgChannel.unsubscribe();
    };
  }, [selectedConv]);

  return {
    messages,
    loading,
  };
}