# BLACKHUB — PATCH FINAL (PÓS FUNDAÇÃO + REFACTOR + CONFIG + N8N READY)

## CONTEXTO
Este patch deve ser executado APÓS:
- 00-PLANO-GERAL
- 01-fundacao-tecnica
- 02-refatoracao-componentes
- 03-configuracoes-unificadas
- 04-preparacao-n8n-evolution

Portanto:
- NÃO refatorar base novamente
- NÃO recriar settings
- NÃO recriar estrutura do chat
- NÃO reinventar integrações

Este patch implementa SOMENTE o Pilar Comercial (WhatsApp + IA + N8N + Chat)

---

# OBJETIVO FINAL

Sistema funcionando com:

CLIENTE:
- manda mensagem no WhatsApp
- conversa aparece no Chat
- IA responde
- pode agendar, remarcar, cancelar
- pode fornecer dados → vira cliente

DONO:
- vê conversa no Chat
- responde manualmente
- pausa/ativa IA por conversa
- pausa/ativa IA global
- altera regras via WhatsApp

SISTEMA:
- N8N processa tudo
- OpenAI responde
- Supabase salva tudo
- Google Calendar espelha

---

# REGRAS CRÍTICAS

- IA = OpenAI GPT-4o Mini
- Fonte principal = Supabase
- Calendar = espelho
- WhatsApp = Evolution API
- Fluxos = dentro da pasta /n8n
- NÃO mexer fora do necessário

---

# ALTERAÇÕES NO BANCO (APENAS EXTENSÃO)

## conversations (ADICIONAR)
- external_contact_phone (string)
- external_contact_name (string nullable)
- ai_enabled (boolean default true)

## messages (ADICIONAR)
- direction ('inbound' | 'outbound')
- delivery_status (string)
- raw_payload (json)

## tenant_chat_settings (CRIAR)
- tenant_id
- ai_globally_enabled (boolean)

---

# CHAT (ALTERAR)

## Sidebar
- mostrar telefone se não houver nome
- mostrar preview já existente
- mostrar badge IA ativa/pausada

## Dentro da conversa
ADICIONAR:
- botão: Pausar IA / Ativar IA
- botão global: Pausar IA geral
- indicador: IA ativa/inativa

## Lógica
- se ai_enabled = false → NÃO chamar N8N
- se global false → NÃO chamar N8N

---

# ENVIO MANUAL DO DONO

Alterar sendOwnerMessage:
- além de salvar → enviar via Evolution API
- usar endpoint send-message

---

# PASTA N8N (CRIAR)

/n8n/01-comercial/workflows
/n8n/01-comercial/subworkflows

---

# WORKFLOWS (CRIAR JSON)

## inbound
- recebe webhook Evolution
- salva mensagem
- cria conversa se não existir
- verifica AI global
- verifica AI conversa
- chama router

## router
decide:
- info
- booking
- reschedule
- cancel
- owner

## booking-flow
- identifica serviço
- identifica barbeiro
- consulta disponibilidade
- sugere horários
- confirma
- cria appointment
- cria evento no Google

## reschedule-flow
- identifica agendamento
- sugere novos horários
- atualiza banco
- atualiza calendar

## cancel-flow
- cancela
- remove do calendar

## owner-flow
- interpreta comando
- atualiza settings

## memory-flow
- salva preferências do cliente

---

# SUBWORKFLOWS

- resolveTenant
- resolveActor
- findOrCreateConversation
- persistMessage
- findOrCreateClient
- updateClient
- getContext
- getBarbers
- getServices
- getAvailability
- createAppointment
- updateAppointment
- syncCalendarCreate
- syncCalendarUpdate
- syncCalendarCancel
- sendWhatsapp
- logAgent

---

# REGRAS DE NEGÓCIO

## Agendamento
- sempre confirmar antes
- sempre usar barbeiro
- respeitar regras do tenant

## Remarcação
- se 1 agendamento → assume
- se vários → perguntar

## Sugestão
- mesmo barbeiro
- + outro barbeiro próximo

## Cliente
- criar quando tiver nome
- atualizar sempre que necessário

---

# CONFIGURAÇÕES

IA deve usar:
- descrição da barbearia
- público alvo
- diferenciais
- regras de horário

NÃO inventar nada.

---

# CRITÉRIOS DE SUCESSO

- mensagem do WhatsApp aparece no Chat
- IA responde
- dono consegue pausar IA
- dono consegue responder manual
- cliente é criado automaticamente
- agendamento funciona
- Google Calendar sincroniza
- tudo dentro de /n8n

---

# INSTRUÇÃO FINAL

Foque apenas no fluxo comercial.

Implemente:
WhatsApp → N8N → IA → Supabase → Chat → Google Calendar

Sem refatorar o resto do sistema.
