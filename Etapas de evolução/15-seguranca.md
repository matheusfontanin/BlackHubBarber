# Etapa 15 — Segurança e Rate Limiting

**Duração estimada:** 2-3 dias
**Depende de:** as features relevantes (04, 06, 12)
**Prioridade:** 🔴 Crítica antes de ir para produção

## Objetivo

Fechar vetores de abuso, hardening de Edge Functions, revisão de RLS, e preparação para auditoria básica.

---

## 15.1 — Rate limiting em Edge Functions

Todas as Edge Functions expostas precisam de rate limit. Hoje [evolution-proxy](supabase/functions/evolution-proxy/) e [google-calendar-oauth](supabase/functions/google-calendar-oauth/) estão expostos sem limites.

### Implementação com Upstash Redis (recomendado)

```ts
// supabase/functions/_shared/rateLimit.ts
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit';
import { Redis } from 'https://esm.sh/@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

export const limiter = (prefix: string, requests: number, window: string) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
  });
```

### Aplicar em cada função

```ts
const rl = limiter('evolution', 30, '1 m');
const { success } = await rl.limit(req.headers.get('x-forwarded-for') ?? 'anon');
if (!success) return new Response('Rate limit exceeded', { status: 429 });
```

### Limites por função

| Função | Limite | Janela | Chave |
|---|---|---|---|
| `evolution-connect` | 5 | 1 min | tenant_id |
| `evolution-status` | 60 | 1 min | tenant_id |
| `public-book` | 5 | 1 hora | IP |
| `public-tenant-info` | 60 | 1 min | IP |
| `stripe-webhook` | ∞ | — | assinatura HMAC |
| `kb-search` | 120 | 1 min | tenant_id |
| `ai-log` | 600 | 1 min | tenant_id |
| `build-prompt` | 60 | 1 min | tenant_id |

### Tarefas

- [ ] Criar conta Upstash (free tier suficiente para começar)
- [ ] Configurar secrets `UPSTASH_REDIS_URL` e `UPSTASH_REDIS_TOKEN`
- [ ] Criar helper compartilhado
- [ ] Aplicar em todas as Edge Functions
- [ ] Testes: simular flood e verificar 429

---

## 15.2 — Auditoria de RLS

### Checklist

- [ ] **Toda** tabela com `tenant_id` tem policy `USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()))`
- [ ] Tabelas sem `tenant_id` (ex: `tenants` own row) têm policy específica
- [ ] Nenhuma tabela tem `GRANT ALL TO anon`
- [ ] Service role usado apenas em Edge Functions (nunca exposto ao front)
- [ ] Testar cada tabela com dois tenants diferentes — um não pode ver nada do outro
- [ ] Automatizar teste de RLS: script SQL que cria 2 tenants mock e valida isolamento

### Tarefas

- [ ] Criar [supabase/tests/rls-isolation.test.sql](supabase/tests/rls-isolation.test.sql)
- [ ] Documentar matriz de permissões em [docs/security/rls-matrix.md](docs/security/rls-matrix.md)

---

## 15.3 — Limpeza de dev bypass

Vi referência a `isDev` em [App.tsx:18](src/App.tsx#L18) e UUID hardcoded `00000000-...` no CLAUDE.md.

- [ ] Garantir que `isDev` só funciona quando `import.meta.env.DEV === true`
- [ ] Código morto removido do build de produção
- [ ] `useTenant` nunca retorna UUID fallback em prod
- [ ] `.env.example` atualizado com todas as vars necessárias

---

## 15.4 — CSP + cabeçalhos de segurança

Adicionar em [vercel.json](vercel.json):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'" }
      ]
    }
  ]
}
```

---

## 15.5 — Secrets management

- [ ] Auditar `.env` e `.env.local` — nenhum commit acidental
- [ ] Verificar `.gitignore` inclui `.env*` (exceto `.env.example`)
- [ ] Secrets do Supabase Edge Functions via `supabase secrets set`
- [ ] Rotação trimestral planejada (checklist em docs)
- [ ] Service role key **jamais** exposta no frontend

---

## 15.6 — Webhook signature verification

Para webhooks recebidos (Stripe, Evolution, N8N):

- [ ] Stripe: HMAC via `stripe.webhooks.constructEvent`
- [ ] Evolution: token compartilhado em header `x-evolution-token`
- [ ] N8N: HMAC SHA-256 com secret compartilhado

---

## 15.7 — Auditoria de dependências

- [ ] `npm audit` sem vulnerabilidades high/critical
- [ ] Dependabot ativo no GitHub
- [ ] Plano de resposta: qualquer CVE crítica, patch em 48h

---

## 15.8 — LGPD / privacidade

Barbearias manipulam dados pessoais de clientes — LGPD aplica.

- [ ] Página `/privacidade` com política
- [ ] Botão "Solicitar exclusão de dados" para o cliente final (via link público)
- [ ] Export de dados de um cliente (JSON) — `data-export.ts` Edge Function
- [ ] Retenção: política de deletar conversas inativas > 2 anos
- [ ] Consentimento explícito para marketing (checkbox `opted_out_marketing`)

---

## Critérios de aceitação

- [ ] Todas as Edge Functions com rate limit
- [ ] Matriz de RLS documentada e testada
- [ ] Bypass dev removido de build de produção
- [ ] Headers de segurança configurados
- [ ] Webhooks com assinatura verificada
- [ ] `npm audit` limpo
- [ ] Política de privacidade publicada
- [ ] Export e delete de dados funcionais
- [ ] Checklist de segurança em [docs/security/pre-launch-checklist.md](docs/security/pre-launch-checklist.md)
