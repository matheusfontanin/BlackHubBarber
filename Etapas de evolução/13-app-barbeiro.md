# Etapa 13 — App do Barbeiro (Mobile-First)

**Duração estimada:** 4-5 dias
**Depende de:** [11 — Team Management](11-team-management.md)
**Prioridade:** 🟡 Média

## Objetivo

Interface mobile dedicada para o **barbeiro operacional** (não o dono). Hoje o Dashboard é desktop-first; quem está no balcão com o celular no bolso precisa de algo diferente: grande, direto, tocável.

Não é um app nativo. É uma **rota responsiva** otimizada para mobile, servida pela mesma SPA, reconhecendo automaticamente quando o usuário tem role `barber`.

---

## 13.1 — Detecção automática

Quando usuário faz login:
- Se `role = 'owner'` ou `'admin'` → vai para `/dashboard` (desktop ou mobile responsivo do dashboard)
- Se `role = 'barber'` → vai para `/barber/hoje` (interface mobile dedicada)

### Tarefas

- [ ] Ajustar [src/App.tsx](src/App.tsx) para redirecionamento por role após login
- [ ] `BarberRoute` wrapper que valida role
- [ ] Layout `<BarberMobileLayout />` sem sidebar, com bottom nav

---

## 13.2 — Telas

### `/barber/hoje` — Dashboard do dia
```
┌────────────────────────────┐
│ Olá, Carlos 👋             │
│ Hoje • 5 atendimentos      │
├────────────────────────────┤
│  09:00  João Silva         │
│  Corte Degradê             │
│  R$ 50          [ INICIAR ]│
├────────────────────────────┤
│  10:00  Pedro Santos       │
│  Barba                     │
│  R$ 35          [ INICIAR ]│
├────────────────────────────┤
│  ...                       │
├────────────────────────────┤
│ 🏆 Hoje: R$ 185 em 3 feitos│
└────────────────────────────┘
       [ Hoje ] [ Semana ] [ Eu ]
```

### `/barber/semana`
Visão semanal comprimida. Apenas leitura.

### `/barber/eu`
- Meu perfil (foto, nome, horários)
- Minhas comissões (mês atual)
- Botão "Solicitar folga"
- Botão "Sair"

---

## 13.3 — Ações rápidas por agendamento

Ao tocar num card de agendamento:
- **Iniciar** → marca `status='in_progress'`
- **Concluir** → marca `status='completed'` + mostra confirmação de preço (editável)
- **No-show** → marca `status='no_show'`
- **Ver cliente** → abre drawer com histórico e preferências
- **Marcar gorjeta** → input rápido para gorjeta

---

## 13.4 — Push / Notificações (preparação)

- [ ] Estrutura para notificações via Web Push (futuro)
- [ ] Por enquanto: alerta visual dentro do app quando chega próximo agendamento (15 min antes)
- [ ] Som opcional

---

## 13.5 — Offline-first (nice to have)

- [ ] Service Worker simples cacheando lista do dia
- [ ] Permite ver agenda mesmo sem sinal
- [ ] Ações em modo offline entram em fila e sincronizam quando voltar

*Não bloqueia etapa — entregar como melhoria posterior.*

---

## 13.6 — UX mobile-specific

- Botões ≥ 48px (touch-friendly)
- Fontes ≥ 16px
- Gesto swipe para concluir
- Pull-to-refresh
- Bottom navigation fixa
- Fonte legível em luz forte (contraste alto)

---

## Critérios de aceitação

- [ ] Barbeiro faz login e cai em `/barber/hoje`
- [ ] Vê apenas seus próprios agendamentos
- [ ] Pode iniciar/concluir atendimento em 2 toques
- [ ] Vê comissões do mês
- [ ] Vê histórico do cliente ao tocar
- [ ] Responsivo de 320px (iPhone SE) até tablet
- [ ] RLS confirmado — barbeiro não vê dados alheios
- [ ] Testes: fluxo iniciar → concluir cria transaction correta
