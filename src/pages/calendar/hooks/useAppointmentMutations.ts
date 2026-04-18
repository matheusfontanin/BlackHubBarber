import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crudService, type Appointment, type AppointmentStatus } from '@/services/crudService';
import { useTenant } from '@/hooks/useTenant';

export function useAppointmentMutations() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Appointment, 'id' | 'clients' | 'services' | 'barbers'>) => {
      if (!tenantId) throw new Error('Tenant not found');
      return crudService.createAppointment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Appointment>;
    }) => {
      if (!tenantId) throw new Error('Tenant not found');
      return crudService.updateAppointment(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('Tenant not found');
      return crudService.deleteAppointment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus;
    }) => {
      if (!tenantId) throw new Error('Tenant not found');
      return crudService.updateAppointment(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}