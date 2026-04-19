import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chatService';
import { queryKeys } from '@/lib/queryClient';

export function useToggleConversationAI(tenantId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useCallback(async (conversationId: string, enabled: boolean) => {
    await chatService.toggleConversationAI(conversationId, enabled);
    if (tenantId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(tenantId) });
    }
  }, [queryClient, tenantId]);
}
