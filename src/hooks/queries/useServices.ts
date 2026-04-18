import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crudService, type Service } from '@/services/crudService';
import { queryKeys } from '@/lib/queryClient';

export function useServices(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.services(tenantId ?? ''),
    queryFn: () => crudService.getServices(tenantId as string),
    enabled: !!tenantId,
  });
}

export function useCreateService(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Service, 'id'>) =>
      crudService.createService(payload),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['services', tenantId] });
      }
    },
  });
}

export function useUpdateService(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      crudService.updateService(id, data),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['services', tenantId] });
      }
    },
  });
}

export function useDeleteService(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crudService.deleteService(id),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['services', tenantId] });
      }
    },
  });
}
