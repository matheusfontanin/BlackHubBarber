import { useQuery } from '@tanstack/react-query';
import { getActiveBarbers } from '@/services/teamService';
import { queryKeys } from '@/lib/queryClient';
import type { Barber } from '@/types/settings';

export function useBarbers(tenantId: string | null | undefined) {
  return useQuery<Barber[]>({
    queryKey: queryKeys.barbers(tenantId ?? ''),
    queryFn: () => getActiveBarbers(tenantId as string).catch(() => [] as Barber[]),
    enabled: !!tenantId,
  });
}
