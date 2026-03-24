import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TenantInfo {
  tenantId: string | null;
  loading: boolean;
  error: string | null;
}

const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export function useTenant(): TenantInfo {
  const { user, isDev } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDev) {
      setTenantId(DEV_TENANT_ID);
      setLoading(false);
      return;
    }

    if (!user) {
      setTenantId(null);
      setLoading(false);
      return;
    }

    async function fetchTenant() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('tenant_members')
          .select('tenant_id')
          .eq('user_id', user!.id)
          .limit(1)
          .single();

        if (dbError) throw dbError;
        setTenantId(data.tenant_id);
      } catch (err: unknown) {
        console.error('Erro ao carregar tenant:', err);
        setError('Não foi possível carregar os dados da barbearia.');
        setTenantId(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, [user, isDev]);

  return { tenantId, loading, error };
}
