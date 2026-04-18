import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crudService, type Appointment } from '@/services/crudService';
import { queryKeys } from '@/lib/queryClient';

interface AppointmentsRange {
  from: string;
  to: string;
}

export function useAppointments(
  tenantId: string | null | undefined,
  range: AppointmentsRange | null,
) {
  return useQuery({
    queryKey: queryKeys.appointments(tenantId ?? '', range ?? undefined),
    queryFn: () =>
      crudService.getAppointments(tenantId as string, range!.from, range!.to),
    enabled: !!tenantId && !!range,
  });
}

export function useCreateAppointment(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Appointment, 'id' | 'clients' | 'services'>) =>
      crudService.createAppointment(payload),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['appointments', tenantId] });
      }
    },
  });
}

export function useUpdateAppointment(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Appointment>;
    }) => crudService.updateAppointment(id, data),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['appointments', tenantId] });
      }
    },
  });
}

export function useDeleteAppointment(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crudService.deleteAppointment(id),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['appointments', tenantId] });
      }
    },
  });
}
