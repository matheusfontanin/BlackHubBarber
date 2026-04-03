
# BLACKHUB BARBER — PATCH PILAR COMERCIAL (N8N FOCUS)

## OBJETIVO
Isolar e priorizar o Pilar Comercial para reduzir custo de contexto e acelerar implementação dos fluxos de atendimento via N8N.

---

# 1. ESTRUTURA DE PASTAS

Criar:

/docs/01-comercial
/n8n/01-comercial

Arquivos em /docs/01-comercial:

- README.md
- ACTIVE_SCOPE.md
- VISION.md
- ARCHITECTURE.md
- AGENTS.md
- FLOWS.md
- DATA_MODEL.md
- N8N_GUIDE.md
- ROADMAP.md
- TASKS.md

---

# 2. README.md

Função: definir que esta pasta é a fonte principal do Pilar Comercial.

Conteúdo:

- Este diretório contém TODA a lógica do Pilar Comercial
- Ignorar Operacional e Gestão por enquanto
- Ordem de leitura:
  1. ACTIVE_SCOPE.md
  2. FLOWS.md
  3. N8N_GUIDE.md
  4. AGENTS.md

---

# 3. ACTIVE_SCOPE.md

Conteúdo:

Foco atual:
- Fluxos de atendimento no N8N
- Entrada WhatsApp
- Roteamento
- Agendamento
- Atualização de regras

Ignorar:
- dashboard avançado
- financeiro
- UI não crítica

---

# 4. FLOWS.md

Definir claramente:

Fluxo 1 — Entrada
Webhook → resolve tenant → resolve actor → salvar mensagem

Fluxo 2 — Informação
CustomerAssistant → RAG → resposta

Fluxo 3 — Agendamento
CustomerAssistant → ScheduleManager → valida → cria → responde

Fluxo 4 — Dono
BarberAssistant → PromptUpdater → salvar regra

---

# 5. N8N_GUIDE.md

Definir padrão:

- workflows pequenos
- nomes:

commercial.webhook.inbound  
commercial.router  
commercial.customer.flow  
commercial.booking.flow  
commercial.owner.flow  

Subworkflows:

shared.resolve-tenant  
shared.resolve-actor  
shared.persist-message  
shared.send-response  

---

# 6. AGENTS.md

Definir:

CustomerAssistant → interpretar cliente  
CustomerRAG → buscar dados cliente  
BarberAssistant → interpretar dono  
BarberRAG → dados da barbearia  
ScheduleManager → agenda  
PromptUpdater → regras  

---

# 7. DATA_MODEL.md

Tabelas usadas:

- tenants
- tenant_members
- clients
- services
- appointments
- barbers
- tenant_ai_settings
- tenant_booking_settings
- tenant_integrations

---

# 8. ROADMAP.md

1. webhook
2. router
3. fluxo info
4. fluxo agendamento
5. fluxo dono

---

# 9. TASKS.md

Backlog simples:

- [ ] webhook inbound
- [ ] router
- [ ] fluxo info
- [ ] fluxo agendamento
- [ ] fluxo dono

---

# 10. INSTRUÇÃO PARA VS CODE

Sempre ler apenas:

/docs/01-comercial/ACTIVE_SCOPE.md  
/docs/01-comercial/FLOWS.md  
/docs/01-comercial/N8N_GUIDE.md  

Ignorar o resto salvo necessidade.

---

# RESULTADO ESPERADO

- VS Code focado apenas no comercial
- menos tokens
- fluxos claros
- execução rápida no N8N
