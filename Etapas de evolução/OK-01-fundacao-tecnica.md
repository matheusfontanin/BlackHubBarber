# Etapa 01 — Fundação Técnica

**Duração estimada:** 3-5 dias
**Bloqueia:** todas as outras etapas
**Prioridade:** 🔴 Crítica

## Objetivo

Instalar a "malha de suporte" do projeto: cache de dados, validação compartilhada, tratamento de erros consistente e infraestrutura de testes. Sem isso, cada feature nova vai reinventar a roda e acumular bugs silenciosos.

---

## 1.1 — TanStack Query (React Query)

### O que é e por quê

Hoje cada página faz seu próprio `useEffect + useState + fetch`. Resultado:
- Sem cache — toda vez que navega de volta, refaz a query
- Sem deduplicação — duas páginas abertas pedem a mesma coisa duas vezes
- Sem retry automático — erro de rede exige refresh manual
- Sem refetch em foco de janela — dados ficam stale
- Código repetido em toda página (`loading`, `error`, `data`)

TanStack Query resolve tudo isso com `useQuery({ queryKey, queryFn })`.

### Tarefas

- [ ] `npm install @tanstack/react-query @tanstack/react-query-devtools`
- [ ] Criar [src/lib/queryClient.ts](src/lib/queryClient.ts) com config global:
  - `staleTime: 60_000` (1 min)
  - `retry: 2`
  - `refetchOnWindowFocus: true` em dev, configurável
- [ ] Envolver `<App />` com `<QueryClientProvider>` em [src/main.tsx](src/main.tsx)
- [ ] Adicionar `<ReactQueryDevtools />` apenas em dev
- [ ] Criar hooks por domínio em `src/hooks/queries/`:
  - `useAppointments.ts` → substitui `crudService.getAppointments` direto
  - `useCustomers.ts`
  - `useServices.ts`
  - `useConversations.ts`
  - `useSettings.ts` (por seção)
- [ ] Migrar **uma** página primeiro (sugestão: `CustomersPage` — é simples) para validar padrão
- [ ] Depois migrar Dashboard, Calendar, Chat, Services

### Convenção de query keys

```ts
['appointments', tenantId, { from, to }]
['customers', tenantId, { search }]
['settings', 'ai', tenantId]
```

Isso permite invalidation fina: `queryClient.invalidateQueries({ queryKey: ['appointments', tenantId] })`.

---

## 1.2 — Zod Schemas Compartilhados

### Situação atual

[src/types/settings.ts](src/types/settings.ts) define tipos TypeScript manualmente. Validação nos forms é feita com `react-hook-form` mas sem schema compartilhado — então o tipo e a validação podem divergir.

### Meta

Um schema Zod por domínio que:
1. **Valida** input em forms (via `@hookform/resolvers/zod`)
2. **Gera o tipo TS** com `z.infer<typeof schema>`
3. **Pode ser reusado** no service layer para validar retorno do Supabase

### Tarefas

- [ ] Criar pasta [src/schemas/](src/schemas/)
- [ ] `tenantSettingsSchema.ts` — barbearia (nome, endereço, logo, estilo, público, diferenciais)
- [ ] `aiSettingsSchema.ts` — personalidade, tom, regras de comportamento
- [ ] `bookingSettingsSchema.ts` — antecedência, buffer, políticas
- [ ] `appointmentSchema.ts` — agendamento (start, end, status, service, customer, barber)
- [ ] `customerSchema.ts` — cliente (name, phone, preferences)
- [ ] `serviceSchema.ts` — serviço (name, price, duration)
- [ ] Deletar interfaces redundantes de [src/types/settings.ts](src/types/settings.ts) e re-exportar os tipos derivados dos schemas
- [ ] Atualizar forms existentes (`BarbershopSettingsSection`, `AiSettingsSection`, etc.) para usar `useForm({ resolver: zodResolver(schema) })`

### Exemplo

```ts
// src/schemas/aiSettingsSchema.ts
import { z } from 'zod';

export const aiSettingsSchema = z.object({
  assistant_name: z.string().min(2, 'Nome muito curto').max(30),
  tone_of_voice: z.enum(['profissional', 'descontraido', 'premium']),
  service_style: z.enum(['direto', 'consultivo', 'acolhedor']),
  greeting_message: z.string().max(500).nullable(),
  // ...
});

export type AiSettings = z.infer<typeof aiSettingsSchema>;
```

---

## 1.3 — ErrorBoundary + Sistema de Toasts

### Situação atual

- Vários `console.error` + `alert('Erro ao salvar')` espalhados ([BarbershopSettingsSection.tsx:159](src/components/settings/BarbershopSettingsSection.tsx#L159), `IntegrationsSettingsSection.tsx:33`).
- Nenhum ErrorBoundary. Um erro em qualquer componente derruba a página inteira.

### Escolha: **Sonner**

Por quê:
- Biblioteca mais moderna e leve que `react-hot-toast`
- API simples: `toast.success('Salvo')`, `toast.error('Falhou')`, `toast.promise(p, {...})`
- Suporta dark theme nativo (combina com nosso Midnight Navy)
- Mantido ativamente

### Tarefas

- [ ] `npm install sonner`
- [ ] Adicionar `<Toaster position="top-right" theme="dark" />` em [src/App.tsx](src/App.tsx)
- [ ] Criar [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) — class component padrão React
- [ ] Envolver rotas autenticadas do dashboard em `<ErrorBoundary fallback={<ErrorScreen />} />`
- [ ] Criar `<ErrorScreen />` bonito (branding Midnight Navy + Brass Gold) com botão "Voltar ao Dashboard"
- [ ] Grep por `alert(` e `console.error` em components e substituir por `toast.error(mensagem)` — log do erro técnico fica em console apenas em dev
- [ ] Criar helper [src/lib/errors.ts](src/lib/errors.ts):
  ```ts
  export function handleError(err: unknown, userMessage: string) {
    if (import.meta.env.DEV) console.error(err);
    toast.error(userMessage);
  }
  ```

---

## 1.4 — Infraestrutura de Testes

### Explicação (você pediu)

**Por que testes existem?** Para você mudar código sem medo. Sem testes, cada refactor é uma aposta — você só descobre o bug quando um cliente reclama. Com testes, se algo quebra, o computador avisa em segundos.

**Tipos de teste relevantes para este projeto:**

1. **Unit tests** — testam funções puras isoladas.
   *Exemplo*: testar uma função que formata preços em BRL. Você passa `50` e espera `"R$ 50,00"`. Rápidos (milissegundos).

2. **Service tests** — testam as funções que falam com o Supabase (chatService, crudService, etc.).
   *Exemplo*: testar que `getConversations(tenantId)` retorna só conversas daquele tenant (valida que RLS e filtros funcionam). Usa um mock do Supabase ou um banco de teste real.

3. **Component tests** — testam componentes React em isolamento.
   *Exemplo*: renderizar `<CustomerCard customer={mockCustomer}/>` e verificar que o nome aparece na tela. Usa React Testing Library.

4. **E2E (end-to-end)** — simulam um usuário usando o app inteiro.
   *Exemplo*: abrir login → entrar → ir para agenda → criar agendamento → ver ele aparecer. Usa Playwright. Lentos (segundos) mas pegam bugs de integração.

**Estratégia recomendada para este projeto (pragmática, não fanática):**

- 🥇 **Service tests** primeiro — o que mais quebra quando você muda schema do Supabase. Alto ROI.
- 🥈 **Unit tests** de utilitários (`cn`, formatadores, builders de prompt). Rapidíssimos.
- 🥉 **Component tests** dos críticos: forms de settings, ErrorBoundary, modais de agendamento.
- 🎯 **E2E** só nos 3 fluxos mais importantes (login → dashboard, criar agendamento, ajustar configs da IA). Adicionar depois, quando o produto estiver mais estável.

**Ferramentas escolhidas:**
- **Vitest** — roda em cima do Vite que já usamos. Compatibilidade total com nossa config.
- **@testing-library/react** — padrão da indústria para testar componentes React.
- **@testing-library/jest-dom** — matchers úteis (`toBeInTheDocument`, `toHaveClass`, etc.).
- **Playwright** — só na FASE 4, quando for relevante.

### Tarefas

- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [ ] Criar [vitest.config.ts](vitest.config.ts) herdando de `vite.config.ts` com `environment: 'jsdom'`
- [ ] Criar [src/test/setup.ts](src/test/setup.ts) importando `@testing-library/jest-dom/vitest`
- [ ] Adicionar scripts ao `package.json`:
  ```json
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
  ```
- [ ] Criar mock global do Supabase client em [src/test/mocks/supabase.ts](src/test/mocks/supabase.ts)
- [ ] Escrever primeiro teste: [src/services/__tests__/settingsService.test.ts](src/services/__tests__/settingsService.test.ts) cobrindo `getTenantSettings`, `upsertTenantSettings`
- [ ] Escrever segundo teste: [src/lib/__tests__/utils.test.ts](src/lib/__tests__/utils.test.ts) cobrindo `cn()`
- [ ] Adicionar `npm run test` ao checklist de pré-commit (opcional agora, obrigatório na FASE 5)

### Estrutura de pastas

```
src/
├── services/
│   ├── chatService.ts
│   └── __tests__/
│       └── chatService.test.ts
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── test/
    ├── setup.ts
    └── mocks/
        └── supabase.ts
```

---

## Critérios de aceitação da Etapa 01

- [ ] `npm run test` roda e tem pelo menos 5 testes passando
- [ ] `CustomersPage` usa TanStack Query (modelo de referência)
- [ ] Toast aparece ao salvar configurações com sucesso
- [ ] ErrorBoundary captura erro forçado e mostra `<ErrorScreen />`
- [ ] Schema Zod de settings compartilhado entre form e tipos TS
- [ ] `npm run lint` passa sem erros
- [ ] Entrada no [docs/ai-collab/decisoes.md](docs/ai-collab/decisoes.md) explicando as escolhas (TanStack, Zod, Sonner, Vitest)
