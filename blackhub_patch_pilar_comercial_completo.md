
# BLACKHUB BARBER — PATCH COMPLETO DO PILAR COMERCIAL
## Documento de execução para o VS Code / Claude Code
## Foco: Sistema comercial completo + fluxos N8N exportáveis/importáveis manualmente

> Objetivo: atualizar o sistema atual para completar o **Pilar Comercial** do BlackHub Barber, com atendimento via WhatsApp, regras de negócio, agenda por barbeiro, IA configurável, fluxo do dono, remarcação, cancelamento e estrutura operacional no N8N.

---

# 1. OBJETIVO GERAL DESTE PATCH

Este patch deve transformar o sistema atual de:

- painel administrativo com agenda, clientes, serviços e configurações

em:

- plataforma comercial operacional com IA,
- agenda por barbeiro,
- atendimento via WhatsApp,
- regras dinâmicas,
- configurações executáveis,
- fluxos N8N organizados em pasta própria,
- persistência de conversa,
- pronta para importar os workflows manualmente no N8N.

---

# 2. DECISÕES DE PRODUTO JÁ VALIDADAS

Estas decisões já estão definidas e DEVEM ser tratadas como regra do projeto.

## 2.1. IA pode agendar sozinha
A IA pode criar agendamentos sem intervenção humana do dono.

## 2.2. Mas a IA sempre confirma com o cliente
Antes de gravar o agendamento, a IA deve sempre confirmar o horário, serviço e barbeiro com o cliente.

## 2.3. Agenda por barbeiro é obrigatória
Cada agendamento deve estar vinculado a um barbeiro.

## 2.4. Cada barbeiro terá um Google Calendar próprio
O dono poderá cadastrar um barbeiro no sistema e informar o `google_calendar_id` dele.

Exemplo:
`101227fbff0dd66d17de795a87a69dac02119393f7691d8d22293492b5f04816@group.calendar.google.com`

## 2.5. O dono pode alterar regras via WhatsApp
Além do painel, o dono deve poder mandar mensagens para o sistema e alterar comportamento/regras do negócio.

## 2.6. O cliente pode remarcar via WhatsApp
O sistema comercial já deve contemplar remarcação nesta fase.

## 2.7. Fora do horário deve responder automaticamente
O cliente deve receber uma mensagem padrão fora do horário, conforme configurações da IA/agenda.

## 2.8. Dashboard com dados reais pode ficar para a próxima fase
Não é prioridade agora implementar a parte analítica completa do dashboard.

---

# 3. PRIORIDADE ABSOLUTA DESTE PATCH

A prioridade máxima deste patch é:

1. fechar o domínio comercial;
2. conectar configurações com regras reais;
3. implementar agenda por barbeiro;
4. estruturar os fluxos no N8N;
5. preparar tudo para atendimento real via WhatsApp;
6. manter a UI atual como apoio operacional do dono.

**O coração agora é o Pilar Comercial, não o dashboard.**

---

# 4. RESULTADO ESPERADO AO FINAL

Ao final deste patch, o sistema deve estar preparado para operar assim:

## Cliente:
- manda mensagem no WhatsApp;
- recebe resposta;
- tira dúvidas;
- agenda;
- remarca;
- cancela;
- recebe resposta fora do horário quando aplicável.

## Dono:
- configura o negócio no painel;
- cadastra barbeiros com agenda própria;
- configura o comportamento da IA;
- altera regras pelo painel ou por WhatsApp;
- acompanha operação no sistema.

## Sistema:
- persiste mensagens;
- persiste conversas;
- aplica regras;
- registra logs;
- organiza fluxos no N8N;
- mantém separação por tenant.

---

# 5. DIRETRIZES GERAIS DE IMPLEMENTAÇÃO

## 5.1. Não reescrever o projeto inteiro
A base atual deve ser aproveitada.

## 5.2. Não transformar a UI em prioridade maior que o fluxo comercial
A UI já está suficiente para esta fase. O foco agora é a operação comercial.

## 5.3. Multi-tenant obrigatório
Tudo deve estar ligado ao `tenant_id`.

## 5.4. O frontend não deve concentrar a lógica comercial
A lógica do comercial deve migrar para:
- regras persistidas;
- fluxos do N8N;
- serviços de apoio;
- estruturas formais de dados.

## 5.5. Os fluxos do N8N devem ser gerados dentro da pasta `/n8n`
Você deve criar os arquivos de workflow e subworkflow dentro do projeto, organizados em pasta própria, para que eu possa importar manualmente depois no N8N.

---

# 6. ESTRUTURA DE PASTAS QUE DEVE EXISTIR APÓS O PATCH

Criar ou ajustar para ficar parecido com isto:

```txt
/docs
  /01-comercial
    README.md
    ACTIVE_SCOPE.md
    FLOWS.md
    AGENTS.md
    DATA_MODEL.md
    N8N_GUIDE.md
    ROADMAP.md
    TASKS.md

/n8n
  /01-comercial
    /workflows
    /subworkflows
    /docs

/src
  /modules
    /comercial
      /appointments
      /barbers
      /clients
      /conversations
      /rules
      /settings
      /integrations
      /agents
```

A estrutura pode ser adaptada ao projeto atual, mas a separação lógica deve existir.

---

# 7. DOMÍNIO COMERCIAL — ALTERAÇÕES OBRIGATÓRIAS

---

## 7.1. BARBEIROS

Criar a estrutura formal de barbeiros.

### Entidade obrigatória
```ts
type Barber = {
  id: string;
  tenant_id: string;
  name: string;
  role?: string;
  phone?: string;
  specialties?: string[] | string;
  notes?: string;
  google_calendar_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};
```

### Requisitos
- permitir CRUD no sistema;
- persistir `google_calendar_id`;
- manter vínculo com tenant;
- usar `is_active` em vez de exclusão destrutiva quando possível.

### Importância
Sem barbeiros, o Pilar Comercial não fecha porque a agenda precisa ser por profissional.

---

## 7.2. APPOINTMENTS / AGENDAMENTOS

A estrutura de appointments deve ser ampliada.

### Estrutura mínima esperada
```ts
type Appointment = {
  id: string;
  tenant_id: string;
  client_id: string;
  service_id: string;
  barber_id: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "cancelled" | "finished" | "no_show";
  source: "manual" | "ai" | "owner_whatsapp";
  notes?: string;
  created_at?: string;
  updated_at?: string;
};
```

### Alteração obrigatória
Adicionar `barber_id` ao modelo atual.

### Regras
- não permitir appointment sem barbeiro;
- status deve ser controlado;
- source deve existir para rastrear origem do agendamento.

---

## 7.3. DISPONIBILIDADE OPERACIONAL

Mesmo usando Google Calendar por barbeiro, o sistema precisa ter regras mínimas de disponibilidade.

### Opção mínima para esta fase
- usar os horários de funcionamento da barbearia;
- usar Google Calendar do barbeiro para checar ocupação;
- aplicar regras de buffer, antecedência e confirmação.

### Opcional para próxima fase
Criar tabela formal de disponibilidade semanal por barbeiro.

---

## 7.4. CLIENTES

A estrutura atual de clientes deve continuar, mas precisa ficar preparada para o comercial.

### Garantir que o cliente tenha:
- id;
- tenant_id;
- nome;
- telefone;
- email opcional;
- notas;
- histórico vinculado;
- conversa vinculada;
- memória vinculada.

---

## 7.5. CONVERSAS E MENSAGENS

Criar persistência formal de conversa.

### Tabela / estrutura: conversations
```ts
type Conversation = {
  id: string;
  tenant_id: string;
  client_id: string;
  channel: "whatsapp";
  status?: "open" | "closed";
  created_at?: string;
  updated_at?: string;
};
```

### Tabela / estrutura: messages
```ts
type Message = {
  id: string;
  conversation_id: string;
  tenant_id: string;
  client_id?: string;
  actor_type: "customer" | "owner" | "assistant" | "system";
  direction: "inbound" | "outbound";
  content: string;
  raw_payload?: unknown;
  created_at?: string;
};
```

### Finalidade
- guardar histórico real do atendimento;
- dar base para memória e logs;
- permitir auditoria.

---

## 7.6. MEMÓRIA DO CLIENTE

Criar estrutura de memória.

### Tabela / estrutura: customer_memories
```ts
type CustomerMemory = {
  id: string;
  tenant_id: string;
  client_id: string;
  summary: string;
  preference_type?: string;
  preference_value?: string;
  created_at?: string;
  updated_at?: string;
};
```

### Uso
- barbeiro preferido;
- serviço mais comum;
- observações relevantes;
- preferência de horário;
- padrões úteis.

### Regra
Não salvar lixo de conversa.  
Salvar apenas memória útil.

---

## 7.7. LOGS DOS AGENTES / FLUXOS

Criar estrutura de observabilidade mínima.

### Tabela / estrutura: agent_logs
```ts
type AgentLog = {
  id: string;
  tenant_id: string;
  conversation_id?: string;
  agent_name: string;
  input_summary?: string;
  output_summary?: string;
  intent?: string;
  action?: string;
  success?: boolean;
  error_message?: string;
  latency_ms?: number;
  created_at?: string;
};
```

### Finalidade
- debugging;
- auditoria;
- melhoria do fluxo;
- revisão futura do comportamento da IA.

---

# 8. CONFIGURAÇÕES — DEVEM VIRAR REGRAS EXECUTÁVEIS

A UI de configurações já está bem encaminhada. Agora ela precisa virar base operacional.

---

## 8.1. BARBEARIA

Persistir corretamente:
- nome da barbearia;
- nome do dono;
- telefone principal;
- email;
- endereço;
- cidade;
- estado;
- instagram;
- descrição;
- público-alvo;
- diferenciais.

Esses dados devem poder ser lidos pelos fluxos do N8N.

---

## 8.2. EQUIPE

A aba Equipe deve deixar de ser só visual.

### Deve permitir:
- listar barbeiros;
- criar barbeiro;
- editar barbeiro;
- ativar/inativar barbeiro;
- informar `google_calendar_id`.

### Resultado esperado
Agenda por barbeiro preparada operacionalmente.

---

## 8.3. AGENDA

As regras da aba Agenda devem ser persistidas como estrutura formal.

### Criar / usar:
`tenant_booking_settings`

### Estrutura sugerida
```ts
type TenantBookingSettings = {
  id: string;
  tenant_id: string;
  min_booking_notice_minutes: number;
  max_booking_notice_days: number;
  buffer_between_appointments_minutes: number;
  allow_ai_booking: boolean;
  require_manual_confirmation: boolean;
  cancellation_policy?: string;
  reschedule_limit?: number;
  confirmation_message_template?: string;
  cancellation_message_template?: string;
  out_of_hours_enabled?: boolean;
  updated_at?: string;
};
```

### Essas regras DEVEM ser usadas nos fluxos
Não basta só salvar.

---

## 8.4. IA

A aba IA já está no caminho certo. Ela deve virar base de contexto estruturado.

### Criar / usar:
`tenant_ai_settings`

### Estrutura sugerida
```ts
type TenantAISettings = {
  id: string;
  tenant_id: string;
  assistant_name: string;
  tone_of_voice: "profissional" | "descontraido" | "premium";
  service_style: "direto" | "consultivo" | "acolhedor";
  business_summary?: string;
  customer_profile?: string;
  differentiators?: string;
  important_notes?: string;
  can_auto_schedule: boolean;
  must_confirm_before_booking: boolean;
  can_reply_outside_business_hours: boolean;
  greeting_message?: string;
  out_of_hours_message?: string;
  updated_at?: string;
};
```

### Regra crítica
Não salvar prompt final gigante.  
Salvar apenas estrutura.

---

## 8.5. INTEGRAÇÕES

Criar / usar:
`tenant_integrations`

### Estrutura sugerida
```ts
type TenantIntegrations = {
  id: string;
  tenant_id: string;
  whatsapp_instance_name?: string;
  whatsapp_instance_id?: string;
  whatsapp_status?: string;
  whatsapp_phone?: string;
  google_calendar_connected?: boolean;
  google_calendar_email?: string;
  n8n_webhook_url?: string;
  updated_at?: string;
};
```

### Também considerar
- talvez o `google_calendar_id` do barbeiro não fique aqui, e sim na tabela `barbers`;
- esta tabela é do tenant, não do barbeiro.

---

# 9. ONBOARDING — EVOLUIR PARA BASE DO COMERCIAL

O onboarding não deve ser só cadastro inicial.

Ele deve se tornar:
- primeira carga de dados do negócio;
- base para IA;
- base para operação comercial.

---

## 9.1. Etapas esperadas

### Etapa 1 — Barbearia
- nome;
- dono;
- telefone;
- email;
- endereço;
- cidade;
- estado;
- instagram.

### Etapa 2 — Serviços
- nome;
- preço;
- duração.

### Etapa 3 — Horários
- horário de funcionamento.

### Etapa 4 — Equipe
- nome do barbeiro;
- `google_calendar_id`;
- especialidade opcional.

### Etapa 5 — WhatsApp
- instância ou nome de instância.

### Etapa 6 — Agenda
- antecedência mínima;
- buffer;
- confirmação.

### Etapa 7 — IA
- nome do assistente;
- tom de voz;
- estilo;
- descrição;
- diferenciais;
- observações;
- saudação;
- fora do horário.

### Etapa 8 — Finalização
- revisão;
- persistência final.

---

## 9.2. Resultado obrigatório
Tudo o que for preenchido no onboarding deve aparecer em Configurações depois.

---

# 10. ESTRATÉGIA DE EXECUÇÃO DO COMERCIAL

O sistema deve funcionar com a seguinte lógica:

## Entrada:
WhatsApp → Evolution API → N8N inbound webhook

## Orquestração:
N8N roteia o fluxo

## Fonte de verdade:
Supabase

## IA:
Agentes interpretam e geram estrutura

## Execução:
Fluxos criam, atualizam ou consultam dados

## Saída:
WhatsApp responde

---

# 11. FLUXOS OBRIGATÓRIOS NO N8N

Todos os fluxos abaixo devem ser criados em arquivos dentro da pasta:

```txt
/n8n/01-comercial/workflows
/n8n/01-comercial/subworkflows
```

Os arquivos devem ser gerados no projeto para que eu possa importar manualmente depois.

---

## 11.1. WORKFLOW PRINCIPAL — ENTRADA

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.webhook.inbound.json`

### Responsabilidade
Receber mensagens do WhatsApp.

### Entrada esperada
Payload da Evolution API / WhatsApp.

### Etapas
1. receber webhook;
2. normalizar payload;
3. identificar tenant;
4. identificar número do remetente;
5. salvar mensagem;
6. encaminhar ao router.

### Saída
Payload normalizado para `commercial.router`.

---

## 11.2. WORKFLOW — ROUTER

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.router.json`

### Responsabilidade
Roteamento central.

### Deve decidir
- se a mensagem é de cliente ou dono;
- se é informação, agendamento, remarcação, cancelamento ou atualização administrativa.

### Rotas mínimas
- cliente.info
- cliente.booking
- cliente.reschedule
- cliente.cancel
- owner.rule-update

---

## 11.3. WORKFLOW — CLIENTE / INFORMAÇÃO

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.customer.info-flow.json`

### Objetivo
Responder perguntas do cliente.

### Exemplos
- preço;
- horário;
- endereço;
- barbeiros;
- serviços.

### Passos
1. chamar CustomerAssistant;
2. buscar dados da barbearia;
3. buscar dados do cliente, se necessário;
4. montar resposta;
5. salvar saída;
6. enviar mensagem.

---

## 11.4. WORKFLOW — CLIENTE / AGENDAMENTO

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.customer.booking-flow.json`

### Objetivo
Criar agendamento real via atendimento.

### Regras obrigatórias
- respeitar `tenant_booking_settings`;
- respeitar horário da barbearia;
- respeitar disponibilidade do barbeiro;
- usar o `google_calendar_id` do barbeiro;
- confirmar com o cliente antes de gravar;
- criar appointment com `source = "ai"`.

### Passos
1. identificar intenção;
2. identificar serviço;
3. identificar barbeiro, se houver;
4. buscar disponibilidade;
5. sugerir opções;
6. coletar escolha;
7. confirmar com o cliente;
8. gravar appointment;
9. opcionalmente refletir no calendar;
10. enviar confirmação final;
11. salvar mensagens e log.

---

## 11.5. WORKFLOW — CLIENTE / REMARCAÇÃO

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.customer.reschedule-flow.json`

### Objetivo
Remarcar agendamento existente.

### Passos
1. localizar appointment do cliente;
2. validar se pode remarcar;
3. buscar novos horários;
4. confirmar nova escolha;
5. atualizar appointment;
6. atualizar calendar;
7. responder confirmação.

---

## 11.6. WORKFLOW — CLIENTE / CANCELAMENTO

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.customer.cancel-flow.json`

### Objetivo
Cancelar appointment.

### Passos
1. localizar appointment;
2. validar política;
3. atualizar status;
4. opcionalmente refletir no calendar;
5. responder ao cliente.

---

## 11.7. WORKFLOW — DONO / ATUALIZAÇÃO DE REGRAS

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.owner.rule-update-flow.json`

### Objetivo
Permitir ao dono alterar regras via WhatsApp.

### Exemplos
- “não atendemos sábado”
- “corte agora é 60”
- “João não atende mais terça”
- “a IA não pode mais agendar sozinha”

### Passos
1. interpretar mensagem;
2. transformar em JSON;
3. validar payload;
4. atualizar configuração correta;
5. registrar auditoria;
6. responder confirmação.

---

## 11.8. WORKFLOW — MEMÓRIA

### Arquivo sugerido
`/n8n/01-comercial/workflows/commercial.memory.builder.json`

### Objetivo
Consolidar memória útil do cliente.

### Passos
1. analisar conversa encerrada ou evento importante;
2. extrair dados úteis;
3. salvar em `customer_memories`.

---

# 12. SUBWORKFLOWS OBRIGATÓRIOS NO N8N

Criar subworkflows reutilizáveis.

---

## 12.1. `shared.resolve-tenant.json`
Responsável por:
- identificar `tenant_id` pela origem do número / instância / contexto.

## 12.2. `shared.resolve-actor.json`
Responsável por:
- identificar se o remetente é cliente ou dono.

## 12.3. `shared.persist-message.json`
Responsável por:
- salvar mensagens inbound/outbound.

## 12.4. `shared.get-client-or-create.json`
Responsável por:
- localizar cliente pelo telefone;
- criar cliente se necessário.

## 12.5. `shared.get-business-context.json`
Responsável por:
- ler dados da barbearia;
- ler IA settings;
- ler booking settings;
- ler integrações.

## 12.6. `shared.get-barber-availability.json`
Responsável por:
- receber `barber_id`, `service_id`, janela de datas;
- consultar Google Calendar do barbeiro;
- retornar horários disponíveis.

## 12.7. `shared.create-appointment.json`
Responsável por:
- validar e criar appointment.

## 12.8. `shared.update-appointment.json`
Responsável por:
- remarcar ou cancelar.

## 12.9. `shared.send-whatsapp-response.json`
Responsável por:
- enviar mensagem de resposta.

## 12.10. `shared.log-agent.json`
Responsável por:
- gravar logs do fluxo/agente.

---

# 13. AGENTES — CONTRATOS QUE DEVEM SER RESPEITADOS

Mesmo que a execução esteja no N8N, os agentes devem seguir contratos claros.

---

## 13.1. AgentInput
```ts
type AgentInput = {
  tenantId: string;
  conversationId?: string;
  actorType: "customer" | "owner";
  message: string;
  context?: Record<string, unknown>;
};
```

## 13.2. AgentOutput
```ts
type AgentOutput = {
  intent: string;
  confidence: number;
  action?: string;
  payload?: Record<string, unknown>;
  response?: string;
};
```

---

## 13.3. CustomerAssistant
### Faz
- entende intenção do cliente;
- extrai estrutura;
- gera resposta quando necessário.

### Não faz
- não atualiza regras do negócio;
- não executa side effect sem fluxo.

---

## 13.4. CustomerRAG
### Faz
- busca dados do cliente;
- histórico;
- preferências;
- memória.

---

## 13.5. BarberAssistant
### Faz
- interpreta mensagens do dono;
- gera payload estruturado.

---

## 13.6. BarberRAG
### Faz
- busca dados da barbearia;
- serviços;
- regras;
- horários;
- barbeiros.

---

## 13.7. ScheduleManager
### Faz
- validar agenda;
- buscar disponibilidade;
- criar, remarcar e cancelar.

---

## 13.8. PromptUpdater
### Faz
- atualizar regras e configurações.

---

## 13.9. MemoryBuilder
### Faz
- consolidar memória útil.

---

# 14. COMO A IA DEVE USAR O CONTEXTO

A IA não deve receber todo o banco cru.

Deve receber contexto mínimo e objetivo:

```txt
[identidade do sistema]
+ [dados da barbearia]
+ [configuração da IA]
+ [regras de agenda]
+ [dados úteis do cliente]
+ [dados de serviços]
+ [barbeiros disponíveis]
```

Evitar contexto excessivo para reduzir custo e erro.

---

# 15. COMPORTAMENTO FORA DO HORÁRIO

Se `can_reply_outside_business_hours` estiver ativo:
- responder com a mensagem padrão configurada.

Se estiver desativado:
- opcionalmente não responder automaticamente.

Para esta fase, o comportamento esperado é:
- responder com mensagem padrão.

---

# 16. MUDANÇAS NO FRONTEND

O frontend atual deve continuar existindo, mas com ajustes para refletir o comercial.

---

## 16.1. CONFIGURAÇÕES
Garantir persistência real de:
- Barbearia
- Equipe
- Agenda
- IA
- Integrações

## 16.2. EQUIPE
Adicionar:
- campo `google_calendar_id`
- status ativo/inativo
- edição real

## 16.3. AGENDA
Adicionar / refletir:
- barbeiro por appointment
- origem (`manual` ou `ai`)
- filtros futuros por barbeiro
- consistência com regra de negócio

## 16.4. CLIENTES
Preparar para exibir depois:
- histórico;
- memória;
- últimos agendamentos;
- origem da aquisição.

## 16.5. DASHBOARD
Pode continuar sem dados reais por enquanto.

---

# 17. CAMADA DE DADOS / SERVICES

Refatorar ou complementar o serviço atual para evitar um CRUD genérico excessivamente solto.

Criar algo próximo de:

- `barbersService.ts`
- `settingsService.ts`
- `bookingSettingsService.ts`
- `aiSettingsService.ts`
- `integrationSettingsService.ts`
- `conversationsService.ts`
- `messagesService.ts`
- `appointmentsService.ts`

Se for manter parte do `crudService.ts`, garantir que as novas regras fiquem organizadas por domínio.

---

# 18. DOCUMENTAÇÃO QUE O VS CODE DEVE CRIAR / ATUALIZAR

Atualizar ou criar:

```txt
/docs/01-comercial/README.md
/docs/01-comercial/ACTIVE_SCOPE.md
/docs/01-comercial/FLOWS.md
/docs/01-comercial/AGENTS.md
/docs/01-comercial/DATA_MODEL.md
/docs/01-comercial/N8N_GUIDE.md
/docs/01-comercial/ROADMAP.md
/docs/01-comercial/TASKS.md
```

Esses arquivos devem refletir apenas o Pilar Comercial.

---

# 19. INSTRUÇÃO EXPLÍCITA SOBRE A PASTA N8N

## O VS Code DEVE:
- criar os arquivos de workflow e subworkflow dentro da pasta `/n8n/01-comercial`;
- organizar os fluxos por nome;
- documentar cada fluxo;
- gerar os JSONs / estruturas de workflow de forma que eu possa importar manualmente depois.

## O VS Code NÃO DEVE:
- tentar executar N8N agora;
- depender de que o ambiente do N8N esteja online;
- deixar os fluxos apenas descritos em texto sem arquivo;
- espalhar os fluxos fora da pasta N8N.

---

# 20. ORDEM DE EXECUÇÃO OBRIGATÓRIA

## Etapa A — dados
1. ampliar modelagem;
2. adicionar barbers;
3. adicionar `barber_id` em appointments;
4. criar settings estruturadas;
5. criar conversations/messages/memories/logs.

## Etapa B — frontend operacional
1. fechar persistência de configurações;
2. fechar equipe com calendar id;
3. fechar agenda por barbeiro.

## Etapa C — N8N
1. criar workflows;
2. criar subworkflows;
3. documentar fluxos;
4. gerar arquivos na pasta N8N.

## Etapa D — integração lógica
1. conectar settings aos fluxos;
2. conectar barbeiros à agenda;
3. conectar cliente, conversa e resposta;
4. preparar envio/recebimento por WhatsApp.

---

# 21. CRITÉRIOS DE ACEITAÇÃO

Este patch estará correto quando:

- existir estrutura formal de barbeiros;
- appointments tiverem `barber_id`;
- configurações estiverem persistidas corretamente;
- regras de agenda estiverem estruturadas;
- IA estiver configurável por tenant;
- integrações estiverem estruturadas;
- onboarding estiver expandido;
- existirem workflows comerciais na pasta N8N;
- existirem subworkflows reutilizáveis;
- o dono puder alterar regras via mensagem;
- o cliente puder agendar, remarcar e cancelar;
- a resposta fora do horário estiver prevista;
- o sistema estiver pronto para import manual dos fluxos no N8N.

---

# 22. O QUE NÃO FAZER AGORA

Não é objetivo deste patch:
- finalizar analytics do dashboard;
- criar financeiro completo;
- reescrever todo o frontend;
- trocar toda a arquitetura por backend separado agora;
- criar um único prompt gigante para IA;
- deixar a lógica comercial toda no frontend.

---

# 23. SAÍDA ESPERADA DO VS CODE / CLAUDE CODE

Ao executar este patch, você deve:

1. analisar a estrutura atual do projeto;
2. identificar os arquivos a alterar;
3. aplicar as mudanças com mínimo retrabalho;
4. manter a UI consistente;
5. estruturar os novos tipos e serviços;
6. criar ou ajustar a persistência;
7. criar os fluxos na pasta `/n8n/01-comercial`;
8. deixar os arquivos prontos para import manual no N8N;
9. atualizar `/docs/01-comercial/*`;
10. registrar andamento em `/docs/ai-collab/proxima-sessao.md`.

Se houver dúvida crítica:
- registrar em `/docs/ai-collab/duvidas.md`

Se houver melhoria importante:
- registrar em `/docs/ai-collab/sugestoes.md`

---

# 24. INSTRUÇÃO FINAL DE EXECUÇÃO

Implemente este patch como a conclusão real do Pilar Comercial do BlackHub Barber.

Priorize:
- agenda por barbeiro;
- regras executáveis;
- atendimento automatizado;
- fluxos N8N;
- persistência de conversa;
- IA configurável;
- multi-tenant;
- organização dos workflows na pasta N8N.

O sistema não deve apenas parecer pronto no painel.
Ele deve ficar estruturalmente pronto para operar o atendimento comercial real.

# 25. COMANDO CURTO PARA COLAR JUNTO NO VS CODE

Use este documento como instrução principal desta tarefa.

Implemente todas as alterações do Pilar Comercial descritas aqui.
Crie os fluxos e subfluxos dentro da pasta `/n8n/01-comercial` em arquivos prontos para importação manual no N8N.
Priorize primeiro modelagem de dados, depois regras e persistência, depois fluxos N8N.
Mantenha o foco apenas no Pilar Comercial.
