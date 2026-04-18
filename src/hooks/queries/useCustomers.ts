import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crudService, type Customer } from '@/services/crudService';
import { queryKeys } from '@/lib/queryClient';

export function useCustomers(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.customers(tenantId ?? ''),
    queryFn: () => crudService.getCustomers(tenantId as string),
    enabled: !!tenantId,
  });
}

export function useCreateCustomer(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Customer, 'id'>) =>
      crudService.createCustomer(payload),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['customers', tenantId] });
      }
    },
  });
}

export function useUpdateCustomer(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      crudService.updateCustomer(id, data),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['customers', tenantId] });
      }
    },
  });
}

export function useDeleteCustomer(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crudService.deleteCustomer(id),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['customers', tenantId] });
      }
    },
  });
}
