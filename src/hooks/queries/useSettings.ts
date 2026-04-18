import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTenantSettings,
  upsertTenantSettings,
  getAISettings,
  upsertAISettings,
  getBookingSettings,
  upsertBookingSettings,
  getIntegrationsOverview,
} from '@/services/settingsService';
import { queryKeys } from '@/lib/queryClient';
import type {
  TenantSettings,
  TenantAISettings,
  TenantBookingSettings,
} from '@/types/settings';

export function useTenantSettings(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.settings.tenant(tenantId ?? ''),
    queryFn: () => getTenantSettings(tenantId as string),
    enabled: !!tenantId,
  });
}

export function useUpsertTenantSettings(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantSettings> & { tenant_id: string }) =>
      upsertTenantSettings(data),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: queryKeys.settings.tenant(tenantId) });
      }
    },
  });
}

export function useAISettings(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.settings.ai(tenantId ?? ''),
    queryFn: () => getAISettings(tenantId as string),
    enabled: !!tenantId,
  });
}

export function useUpsertAISettings(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantAISettings> & { tenant_id: string }) =>
      upsertAISettings(data),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: queryKeys.settings.ai(tenantId) });
      }
    },
  });
}

export function useBookingSettings(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.settings.booking(tenantId ?? ''),
    queryFn: () => getBookingSettings(tenantId as string),
    enabled: !!tenantId,
  });
}

export function useUpsertBookingSettings(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantBookingSettings> & { tenant_id: string }) =>
      upsertBookingSettings(data),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({
          queryKey: queryKeys.settings.booking(tenantId),
        });
      }
    },
  });
}

export function useIntegrationsOverview(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.settings.integrations(tenantId ?? ''),
    queryFn: () => getIntegrationsOverview(tenantId as string),
    enabled: !!tenantId,
  });
}
