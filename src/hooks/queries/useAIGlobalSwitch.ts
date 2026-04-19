import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryClient';

export function useAIGlobalSwitch(tenantId: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.settings.ai(tenantId ?? ''),
    queryFn: async () => {
      if (!tenantId) return true;
      const { data, error } = await supabase
        .from('tenant_ai_config')
        .select('ai_globally_enabled')
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      return data?.ai_globally_enabled ?? true;
    },
    enabled: !!tenantId,
  });

  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!tenantId) throw new Error('Tenant ID não encontrado');
      const { error } = await supabase
        .from('tenant_ai_config')
        .upsert(
          { tenant_id: tenantId, ai_globally_enabled: enabled, updated_at: new Date().toISOString() },
          { onConflict: 'tenant_id' },
        );
      if (error) throw error;
      return enabled;
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.ai(tenantId) });
      }
    },
  });

  return {
    aiEnabled: query.data,
    loading: query.isLoading,
    toggleAIGlobal: mutation.mutateAsync,
  };
}
