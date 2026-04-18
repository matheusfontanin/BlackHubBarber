-- ============================================================
-- DEV ONLY — Liberar RLS para seed do tenant dev
-- ============================================================
-- As policies originais usam get_user_tenant_id() que depende de
-- auth.uid(), e o modo dev da aplicação usa a anon key sem usuário
-- autenticado. Isso bloqueia INSERT em conversations/messages/
-- customer_memories/barbers/etc.
--
-- Este patch adiciona uma policy "dev_tenant_bypass" que libera
-- operações para o tenant dev fixo (00000000-0000-0000-0000-000000000000)
-- em TODAS as tabelas do domínio, sem afetar a isolação multi-tenant
-- em produção.
--
-- Rode manualmente no SQL Editor do Supabase.
-- ============================================================

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'services',
    'clients',
    'appointments',
    'conversations',
    'messages',
    'campaigns',
    'loyalty_transactions',
    'referrals',
    'products',
    'ai_knowledge',
    'analytics_events',
    'customer_memories',
    'agent_logs',
    'regras_dinamicas',
    'barber_schedules',
    'tenant_integrations',
    'prompt_versions',
    'audit_events'
  ]) LOOP
    -- Só aplica se a tabela existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS "dev_tenant_bypass_%s" ON %I',
        tbl, tbl
      );
      EXECUTE format(
        'CREATE POLICY "dev_tenant_bypass_%s" ON %I FOR ALL USING (tenant_id = ''00000000-0000-0000-0000-000000000000''::uuid) WITH CHECK (tenant_id = ''00000000-0000-0000-0000-000000000000''::uuid)',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- barbers table (criada fora do script de RLS base) precisa de tratamento à parte
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'barbers') THEN
    -- Garante RLS habilitado e adiciona bypass
    EXECUTE 'ALTER TABLE barbers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "dev_tenant_bypass_barbers" ON barbers';
    EXECUTE 'CREATE POLICY "dev_tenant_bypass_barbers" ON barbers FOR ALL USING (tenant_id = ''00000000-0000-0000-0000-000000000000''::uuid) WITH CHECK (tenant_id = ''00000000-0000-0000-0000-000000000000''::uuid)';
  END IF;
END $$;
