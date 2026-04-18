import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { chatService, CustomerMemory } from '@/services/chatService';

export function useCustomerMemories(clientId: string | null) {
  const { tenantId } = useTenant();
  const [memories, setMemories] = useState<CustomerMemory[]>([]);

  const fetchMemories = useCallback(async (id: string) => {
    if (!tenantId) return;
    try {
      const data = await chatService.getCustomerMemories(id, tenantId);
      setMemories(data);
    } catch (err) {
      console.error('Erro ao buscar memórias:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    if (clientId) {
      fetchMemories(clientId);
    } else {
      setMemories([]);
    }
  }, [clientId, fetchMemories]);

  return {
    memories,
  };
}