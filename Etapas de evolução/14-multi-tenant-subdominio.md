# Etapa 14 — Multi-tenant por Subdomínio

**Duração estimada:** 2-3 dias
**Depende de:** [12 — Booking Público](12-booking-publico.md)
**Prioridade:** 🟡 Média

## Objetivo

Permitir que cada barbearia tenha sua própria URL: `barbearia-x.blackhub.com` ou, para clientes premium, domínio próprio (`agendar.minhabarbearia.com`).

---

## 14.1 — Sobre a Vercel (sua pergunta)

**Resposta curta:** Sim e não. A Vercel **suporta** tudo que precisamos, mas **não faz automaticamente**. Você precisa:

1. Configurar um **domínio wildcard** na Vercel: `*.blackhub.com`
2. Apontar esse wildcard ao projeto Vercel
3. No código da SPA, detectar o subdomínio e carregar o tenant correspondente
4. Para domínios customizados (`agendar.clientex.com`), o cliente aponta CNAME para `cname.vercel-dns.com` e você adiciona o domínio via Vercel API ou dashboard

**Vercel cobra extra** por domínios customizados em alguns planos — checar o plano atual.

---

## 14.2 — Arquitetura

```
blackhub.com                 → Landing page / login
app.blackhub.com             → Dashboard (login necessário)
{slug}.blackhub.com          → Homepage pública da barbearia (redireciona /b/:slug internamente)
```

### Detecção no frontend

```ts
// src/lib/tenantResolver.ts
export function resolveTenantFromHost(hostname: string): { type: 'app' | 'public'; slug?: string } {
  if (hostname === 'blackhub.com' || hostname === 'www.blackhub.com') return { type: 'app' };
  if (hostname === 'app.blackhub.com') return { type: 'app' };
  if (hostname.endsWith('.blackhub.com')) {
    const slug = hostname.replace('.blackhub.com', '');
    return { type: 'public', slug };
  }
  // domínio customizado — buscar no Supabase
  return { type: 'public', slug: 'custom' };
}
```

### Em [src/App.tsx](src/App.tsx)

- Se `type='public'`, renderizar `<PublicRouter />` com wizard de booking
- Se `type='app'`, renderizar `<AppRouter />` normal (dashboard)

---

## 14.3 — Domínios customizados

### Schema

```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain_ssl_status TEXT;
```

### Fluxo do cliente adicionando domínio

1. Em Settings → Branding → Domínio, cliente insere `agendar.clientex.com`
2. Sistema mostra instruções: "Adicione CNAME apontando para cname.vercel-dns.com"
3. Cliente configura no provedor de DNS dele
4. Botão "Verificar" checa DNS via Edge Function `verify-custom-domain`
5. Se OK, chama Vercel API para adicionar o domínio ao projeto
6. Aguarda SSL ser provisionado
7. Marca `custom_domain_verified = true`

### Tarefas

- [ ] Edge Function `verify-custom-domain` (DNS lookup + Vercel API)
- [ ] Requer `VERCEL_API_TOKEN` em secrets
- [ ] UI em Settings → Branding com estado visual do progresso
- [ ] Documentação para o cliente

---

## 14.4 — Branding customizável

Agora que cada barbearia pode ter sua URL, faz sentido permitir:

- Logo próprio (já existe)
- Cores primária/secundária (tokens Tailwind dinâmicos via CSS variables)
- Fonte customizada (opcional)
- Texto da página inicial pública

### Schema

```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_primary_color TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_font_family TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS public_hero_title TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS public_hero_subtitle TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS public_hero_image_url TEXT;
```

### Implementação com CSS Variables

```tsx
// Em PublicLayout
<div style={{
  '--brand-primary': tenant.brand_primary_color || '#1A1A2E',
  '--brand-secondary': tenant.brand_secondary_color || '#C4A35A',
}}>
  {children}
</div>
```

Tailwind classes tipo `bg-[var(--brand-primary)]`.

---

## 14.5 — SEO básico

Página pública de cada barbearia precisa:
- `<title>` dinâmico com nome da barbearia
- `<meta description>` com descrição
- Open Graph tags (compartilhar no WhatsApp pega a imagem)
- Schema.org LocalBusiness JSON-LD
- `robots.txt` permitindo indexação das páginas `/b/*`

### Tarefas

- [ ] Lib `react-helmet-async` para metadata dinâmica
- [ ] Componente `<PublicSEO tenant={...} />`
- [ ] OG image pré-gerada por tenant (Edge Function via Vercel OG)

---

## Critérios de aceitação

- [ ] `barbearia-x.blackhub.com` carrega a página pública do tenant correto
- [ ] Domínios customizados configuráveis via UI
- [ ] Verificação de DNS automática
- [ ] SSL provisionado automaticamente via Vercel
- [ ] Branding (cores, logo, hero) refletido na página pública
- [ ] SEO tags corretas em cada rota pública
- [ ] OG image compartilhável
- [ ] Testes: resolução de tenant por host, fallback para slug inválido
