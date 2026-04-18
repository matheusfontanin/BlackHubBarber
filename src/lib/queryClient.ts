import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: import.meta.env.DEV ? false : true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  appointments: (tenantId: string, range?: { from: string; to: string }) =>
    ['appointments', tenantId, range] as const,
  customers: (tenantId: string, filters?: { search?: string }) =>
    ['customers', tenantId, filters] as const,
  services: (tenantId: string) => ['services', tenantId] as const,
  conversations: (
    tenantId: string,
    filters?: { status?: string; channel?: string; search?: string },
  ) => ['conversations', tenantId, filters] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  settings: {
    tenant: (tenantId: string) => ['settings', 'tenant', tenantId] as const,
    ai: (tenantId: string) => ['settings', 'ai', tenantId] as const,
    booking: (tenantId: string) => ['settings', 'booking', tenantId] as const,
    integrations: (tenantId: string) =>
      ['settings', 'integrations', tenantId] as const,
  },
  barbers: (tenantId: string) => ['barbers', tenantId] as const,
} as const;
