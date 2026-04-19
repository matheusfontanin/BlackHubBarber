import { useQuery } from '@tanstack/react-query';
import { aiLogService } from '@/services/aiLogService';

export function useAIDecisionForMessage(messageId: string | null | undefined) {
  return useQuery({
    queryKey: ['ai-decision', 'message', messageId ?? ''],
    queryFn: () => aiLogService.getByMessage(messageId as string),
    enabled: !!messageId,
    staleTime: 5 * 60_000,
  });
}

export function useAIDecisionsForConversation(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ['ai-decision', 'conversation', conversationId ?? ''],
    queryFn: () => aiLogService.getByConversation(conversationId as string),
    enabled: !!conversationId,
    staleTime: 30_000,
  });
}

export function useAIHealth(tenantId: string | null | undefined, periodDays: number) {
  return useQuery({
    queryKey: ['ai-health', tenantId ?? '', periodDays],
    queryFn: () => aiLogService.getHealth(tenantId as string, periodDays),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}
