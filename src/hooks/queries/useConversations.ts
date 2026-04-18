import { useQuery } from '@tanstack/react-query';
import {
  chatService,
  type ConversationChannel,
  type ConversationStatus,
} from '@/services/chatService';
import { queryKeys } from '@/lib/queryClient';

interface ConversationFilters {
  status?: ConversationStatus;
  channel?: ConversationChannel;
  search?: string;
}

export function useConversations(
  tenantId: string | null | undefined,
  filters?: ConversationFilters,
) {
  return useQuery({
    queryKey: queryKeys.conversations(tenantId ?? '', filters),
    queryFn: () => chatService.getConversations(tenantId as string, filters),
    enabled: !!tenantId,
  });
}

export function useMessages(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId ?? ''),
    queryFn: () => chatService.getMessages(conversationId as string),
    enabled: !!conversationId,
  });
}
