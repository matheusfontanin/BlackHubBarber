import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQueryBuilder } from '@/test/mocks/supabase';

type QueryBuilder = ReturnType<typeof createQueryBuilder>;

vi.mock('@/lib/supabase/client', async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabase');
  const supabase = createSupabaseMock();
  return { supabase };
});

import { supabase } from '@/lib/supabase/client';
import {
  getTenantSettings,
  upsertTenantSettings,
  getAISettings,
  upsertAISettings,
} from '@/services/settingsService';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';
const supabaseMock = supabase as unknown as {
  from: ReturnType<typeof vi.fn>;
};
const builders = new Map<string, QueryBuilder>();

supabaseMock.from.mockImplementation((table: string) => {
  const b = builders.get(table);
  if (!b) {
    const fallback = createQueryBuilder({ data: null, error: null });
    builders.set(table, fallback);
    return fallback;
  }
  return b;
});

function setBuilder(table: string, builder: QueryBuilder) {
  builders.set(table, builder);
}

beforeEach(() => {
  builders.clear();
  supabaseMock.from.mockClear();
});

describe('settingsService', () => {
  describe('getTenantSettings', () => {
    it('retorna os dados quando a query tem sucesso', async () => {
      const payload = { tenant_id: TENANT_ID, owner_name: 'João' };
      setBuilder('tenant_settings', createQueryBuilder({ data: payload, error: null }));

      const result = await getTenantSettings(TENANT_ID);

      expect(result).toEqual(payload);
      expect(supabaseMock.from).toHaveBeenCalledWith('tenant_settings');
    });

    it('lança quando o Supabase retorna erro', async () => {
      setBuilder(
        'tenant_settings',
        createQueryBuilder({ data: null, error: { message: 'boom' } }),
      );

      await expect(getTenantSettings(TENANT_ID)).rejects.toMatchObject({ message: 'boom' });
    });

    it('retorna null quando não há registros', async () => {
      setBuilder('tenant_settings', createQueryBuilder({ data: null, error: null }));
      const result = await getTenantSettings(TENANT_ID);
      expect(result).toBeNull();
    });
  });

  describe('upsertTenantSettings', () => {
    it('aplica updated_at e retorna o registro persistido', async () => {
      const stored = { tenant_id: TENANT_ID, owner_name: 'Nova Barbearia' };
      setBuilder('tenant_settings', createQueryBuilder({ data: stored, error: null }));

      const result = await upsertTenantSettings({
        tenant_id: TENANT_ID,
        owner_name: 'Nova Barbearia',
      });

      expect(result).toEqual(stored);
    });
  });

  describe('getAISettings / upsertAISettings', () => {
    it('usa a tabela tenant_ai_settings e respeita tenant_id', async () => {
      setBuilder(
        'tenant_ai_settings',
        createQueryBuilder({ data: { tenant_id: TENANT_ID, assistant_name: 'Maya' }, error: null }),
      );

      const result = await getAISettings(TENANT_ID);

      expect(result).toMatchObject({ tenant_id: TENANT_ID, assistant_name: 'Maya' });
      expect(supabaseMock.from).toHaveBeenCalledWith('tenant_ai_settings');
    });

    it('upsertAISettings retorna o registro persistido', async () => {
      const stored = { tenant_id: TENANT_ID, assistant_name: 'Maya' };
      setBuilder('tenant_ai_settings', createQueryBuilder({ data: stored, error: null }));

      const result = await upsertAISettings({
        tenant_id: TENANT_ID,
        assistant_name: 'Maya',
      });

      expect(result).toEqual(stored);
    });
  });
});
