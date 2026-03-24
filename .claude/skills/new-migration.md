---
description: Cria uma nova migration SQL para o Supabase
user_invocable: true
---

# Nova Migration

1. Ler migrations existentes em `supabase/migrations/` para pegar o proximo numero
2. Ler schema atual para evitar conflitos
3. Criar `supabase/migrations/{numero}_{descricao}.sql`
4. Checklist pos-criacao:
   - [ ] tenant_id com RLS habilitado?
   - [ ] Policy filtra por tenant_id?
   - [ ] Indices em tenant_id e colunas de busca?
   - [ ] UUIDs como PKs?
   - [ ] Timestamps (created_at, updated_at)?
