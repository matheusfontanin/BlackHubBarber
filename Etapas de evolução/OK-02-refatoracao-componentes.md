# Etapa 02 — Refatoração de Componentes Grandes

**Duração estimada:** 2-3 dias
**Depende de:** [01 — Fundação Técnica](01-fundacao-tecnica.md) (precisamos de TanStack Query e toasts antes)
**Prioridade:** 🟡 Alta

## Problema

Dois arquivos ultrapassaram o limite saudável de manutenção:

| Arquivo | Linhas | Meta |
|---|---|---|
| [src/pages/calendar/CalendarPage.tsx](src/pages/calendar/CalendarPage.tsx) | 932 | ≤ 250 |
| [src/pages/chat/ChatPage.tsx](src/pages/chat/ChatPage.tsx) | 799 | ≤ 200 |

Arquivos gigantes causam: conflitos de merge, difícil de revisar, difícil de testar, difícil de reusar partes.

---

## 2.1 — Refatoração do CalendarPage

### Decomposição proposta

```
src/pages/calendar/
├── CalendarPage.tsx                    (≤ 150 linhas — orquestração)
├── components/
│   ├── CalendarHeader.tsx              (navegação, modo semana/mês/dia)
│   ├── CalendarWeekGrid.tsx            (grid de semana)
│   ├── CalendarMonthGrid.tsx           (grid de mês)
│   ├── CalendarDayGrid.tsx             (grid de dia)
│   ├── AppointmentCard.tsx             (card de agendamento na grid)
│   ├── AppointmentModal.tsx            (modal de criar/editar)
│   ├── AppointmentStatusBadge.tsx      (badge de status)
│   └── BarberLegend.tsx                (legenda de cores por barbeiro)
└── hooks/
    ├── useCalendarView.ts              (estado do modo/data atual)
    └── useAppointmentMutations.ts      (create/update/delete via TanStack)
```

### Tarefas

- [ ] Extrair constantes para [src/pages/calendar/constants.ts](src/pages/calendar/constants.ts) — `BARBER_PALETTE`, `HOURS`, `STATUS_LABELS`
- [ ] Extrair `barberColor` para [src/pages/calendar/utils.ts](src/pages/calendar/utils.ts)
- [ ] Criar `AppointmentModal` — deve receber `appointment?: Appointment` (edit) ou `initialDate?: Date` (create)
- [ ] Criar `CalendarWeekGrid` — recebe `appointments`, `barbers`, `weekStart` como props
- [ ] Migrar mutations (`crudService.createAppointment`, etc.) para `useMutation` do TanStack
- [ ] Na `CalendarPage`, apenas orquestrar: hooks de dados + renderizar subcomponente de modo
- [ ] Testes: `AppointmentModal` abre com dados corretos em modo edit

### Regra de ouro

Nenhum dos componentes extraídos pode conhecer `tenant_id` diretamente — eles recebem dados já carregados como props. Apenas o `CalendarPage` chama `useTenant()` e os hooks de query.

---

## 2.2 — Refatoração do ChatPage

### Decomposição proposta

```
src/pages/chat/
├── ChatPage.tsx                        (≤ 150 linhas — orquestração + roteamento mobile)
├── components/
│   ├── ConversationList.tsx            (sidebar esquerda com lista + filtros)
│   ├── ConversationListItem.tsx        (linha da lista)
│   ├── ConversationFilters.tsx         (busca, status, canal)
│   ├── MessageThread.tsx               (área central com mensagens)
│   ├── MessageBubble.tsx               (bolha individual)
│   ├── MessageComposer.tsx             (input + botão enviar)
│   ├── CustomerProfilePanel.tsx        (sidebar direita com dados do cliente)
│   ├── CustomerMemoriesList.tsx        (lista de memórias da IA)
│   └── ConnectionStatusBadge.tsx       (wifi on/off)
└── hooks/
    ├── useConversations.ts             (query + filtros)
    ├── useMessages.ts                  (query + realtime subscription)
    └── useSendMessage.ts               (mutation)
```

### Tarefas

- [ ] Extrair constantes para [src/pages/chat/constants.ts](src/pages/chat/constants.ts) — `STATUS_CONFIG`, `ROLE_CONFIG`, `CHANNEL_ICON`
- [ ] Criar `ConversationList` com filtros controlados via props/callback
- [ ] Criar `MessageThread` que recebe `messages: Message[]` e faz scroll automático para o final
- [ ] Criar `CustomerProfilePanel` que recebe `customer: Conversation['clients']` e `memories: CustomerMemory[]`
- [ ] Criar `useMessages(conversationId)` que faz query + subscribe em Supabase Realtime (preparação para Etapa 04)
- [ ] Manter layout mobile: list → thread → profile como overlay
- [ ] Testes: `ConversationListItem` mostra canal correto e status correto

### Preparação para Realtime (pseudo-código)

```ts
// src/pages/chat/hooks/useMessages.ts
export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId!),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return query;
}
```

---

## 2.3 — Outros arquivos a monitorar

| Arquivo | Linhas | Ação |
|---|---|---|
| [BarbershopSettingsSection.tsx](src/components/settings/BarbershopSettingsSection.tsx) | 321 | Será reescrito na Etapa 03 |
| [TeamSettingsSection.tsx](src/components/settings/TeamSettingsSection.tsx) | 242 | Extrair `BarberFormModal` na Etapa 11 |
| [CustomersPage.tsx](src/pages/customers/CustomersPage.tsx) | 352 | Extrair `CustomerModal` e `CustomerFilters` |
| [ServicesPage.tsx](src/pages/services/ServicesPage.tsx) | 314 | Extrair `ServiceModal` |

---

## Critérios de aceitação

- [ ] `CalendarPage.tsx` ≤ 250 linhas
- [ ] `ChatPage.tsx` ≤ 200 linhas
- [ ] Cada componente extraído tem `props` tipadas via interface explícita
- [ ] Nenhum componente extraído importa `useTenant` diretamente
- [ ] Testes dos modais (create e edit) passam
- [ ] Funcionamento idêntico ao antes — zero regressões visuais
- [ ] `useMessages` já está estruturado para Realtime (mesmo que o subscribe só seja ativado na Etapa 04)
