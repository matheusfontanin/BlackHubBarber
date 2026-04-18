# CLAUDE.md — BlackHub Barber

SaaS multi-tenant para barbearias. WhatsApp/Instagram com IA humanizada, agendamentos, CRM e dashboard.
Primeiro modulo da plataforma BlackHub (futuro: Clinic, Nutri, Pet).

## Arquitetura
- **React + Vite:** SPA (Dashboard, CRM, Inbox, Agenda, Config, Stripe)
- **N8N:** Orquestracao de mensagens (Evolution API -> Claude IA -> Google Calendar)
- **Supabase:** PostgreSQL com RLS por tenant_id + pgvector + Edge Functions
- **Regra de ouro:** N8N coordena. Codigo decide. Banco guarda. IA interpreta.

## Agentes (contratos em src/types/agents.ts)
- CustomerAssistant, CustomerRAG, BarberAssistant, BarberRAG
- ScheduleManager, PromptUpdater, MemoryBuilder, ContextOrchestrator
- Todos seguem AgentInput/AgentOutput. Saida sempre JSON estruturado.

## Abstracoes (interfaces em src/types/providers.ts)
- CalendarProvider, MessagingProvider, AiProvider
- CustomerRepository, AppointmentRepository
- Nunca acoplar dominio diretamente a APIs externas.

## Convencoes
- TypeScript strict (sem `any`). Componentes PascalCase, hooks/utils camelCase.
- RLS sempre habilitado por tenant_id. Proibido misturar dados entre tenants.
- Git: Conventional Commits em portugues.
- Codigo em ingles, UI em pt-BR.
- Cores via tokens Tailwind (primary, secondary, bg). Nunca hex hardcoded.

## Design System
- Primary: Midnight Navy (#1A1A2E) | Secondary: Brass Gold (#C4A35A) | Accent: #E8B04A | Bg: #FAFAF8
- Fonts: DM Serif Display (headings), Inter (body), JetBrains Mono (dados)

## Dev
- `npm run dev` (porta 3000) | `npm run build` | `npm run lint`
- Tenant ID dev: `00000000-0000-0000-0000-000000000000`

## Colaboracao
- Registrar bloqueios em docs/ai-collab/duvidas.md
- Registrar melhorias em docs/ai-collab/sugestoes.md
- Registrar decisoes em docs/ai-collab/decisoes.md
- Atualizar docs/ai-collab/proxima-sessao.md ao fim de cada tarefa

## Regras de UI e Conteúdo Visível

Ao implementar interfaces, formulários, cards, modais, páginas ou componentes visuais, siga estas regras rigorosamente:

### 1. Nunca transformar instruções internas em texto da interface
Observações como:
- "aparece no menu lateral"
- "isso vai para a IA"
- "usar no onboarding"
- "salvar no Supabase"
- "campo usado pelo N8N"
- "ideal: quadrado, fundo transparente"
- "máx. 500KB"
- "essa informação será usada no prompt"
- "isso alimenta o agente"
- "mostrar no dashboard depois"

NÃO devem ser renderizadas automaticamente como:
- títulos
- subtítulos
- descrições
- labels
- helper texts
- placeholders
- badges
- avisos
- tooltips
- textos secundários

Essas frases são, por padrão, instruções de implementação ou contexto de produto, e não conteúdo para o usuário final.

---

### 2. Só mostrar texto na UI se ele for explicitamente adequado ao usuário final
Antes de adicionar qualquer texto visível, valide mentalmente:

- isso faz sentido para o dono da barbearia ler?
- isso ajuda a usar a interface?
- isso parece texto de produto real?
- isso foi pedido como microcopy visível?
- isso tem função prática na experiência?

Se a resposta não for claramente "sim", não renderize o texto.

---

### 3. Diferenciar obrigatoriamente:
- regra técnica
- observação de implementação
- conteúdo visível

#### Regra técnica
Serve para código, comportamento, integração ou persistência.  
Nunca deve virar texto na UI automaticamente.

#### Observação de implementação
Serve para orientar desenvolvimento, arquitetura ou UX.  
Nunca deve virar texto visível sem pedido explícito.

#### Conteúdo visível
Só pode aparecer na interface quando for claramente uma destas categorias:
- label de campo
- título de seção
- descrição útil ao usuário
- helper text realmente necessário
- mensagem de erro
- mensagem de sucesso
- empty state
- CTA

---

### 4. Helper texts devem ser mínimos e úteis
Não adicionar helper text por impulso.

Só usar helper text quando ele:
- evita erro real de uso
- explica restrição importante
- melhora a conversão ou compreensão

Evitar helper texts decorativos, redundantes ou que pareçam comentário de documentação.

Exemplo incorreto:
- "Aparece no menu lateral"
- "Esse dado será usado pela IA"
- "O sistema salva isso para uso futuro"

Exemplo correto:
- "Envie uma imagem quadrada para melhor visualização."
- "Formatos aceitos: PNG, JPG, SVG ou WEBP."

---

### 5. Não inventar microcopy
Não inventar:
- slogans
- descrições
- observações
- textos de apoio
- empty states
- mensagens de ajuda

a menos que isso tenha sido pedido ou seja claramente necessário para completar a interface.

Se houver dúvida, prefira:
- interface mais limpa
- menos texto
- texto mais direto

---

### 6. Princípio de UX: menos texto, mais precisão
Ao construir UI:
- prefira título curto
- label claro
- descrição apenas se indispensável
- nada de comentários disfarçados de microcopy

---

### 7. Em caso de dúvida, não renderizar
Se não estiver claro se uma frase é:
- instrução técnica
ou
- texto para o usuário

assuma que é instrução técnica e NÃO mostre na UI.

---

### 8. Check obrigatório antes de finalizar qualquer tela
Antes de concluir uma implementação visual, revisar cada texto renderizado e perguntar:

- esse texto foi realmente pedido?
- esse texto ajuda o usuário final?
- esse texto parece comentário de dev?
- esse texto parece documentação vazando para a interface?
- esse texto está poluindo a tela?

Se parecer comentário, documentação ou observação interna, remover.

---

### 9. Regra específica para uploads, integrações e configurações
Em campos de upload, integração, IA, agenda, onboarding e configurações:
- não transformar observações arquiteturais em UI
- não expor detalhes técnicos sem necessidade
- não adicionar explicações sobre sistema interno
- não explicar implementação ao usuário final

Exemplo:
Se a instrução for:
"O logo deve aparecer no menu lateral"

Isso significa comportamento do sistema.
Não significa que a interface deve mostrar a frase:
"Aparece no menu lateral"

---

### 10. Prioridade final
Sempre priorize:
1. clareza visual
2. limpeza da interface
3. utilidade real do texto
4. consistência com produto premium
5. zero vazamento de comentários internos
