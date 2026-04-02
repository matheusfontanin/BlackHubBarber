
# BLACKHUB BARBER — PATCH DE EVOLUÇÃO DO SISTEMA
## Documento de execução para o VS Code / Claude Code

> Objetivo: atualizar a plataforma atual para que a área de **Configurações** e o **Onboarding** fiquem alinhados com a visão do BlackHub Barber como sistema comercial SaaS com IA, agenda, equipe, integrações e regras dinâmicas.

---

# 1. CONTEXTO GERAL DO PROJETO

O projeto atual já possui uma base funcional em React + TypeScript + Supabase, com:

- autenticação;
- onboarding inicial;
- painel administrativo;
- agenda;
- clientes;
- serviços;
- estrutura inicial multi-tenant;
- páginas de configurações em estágio inicial.

Porém, a página de **Configurações** ainda está em um nível muito básico e administrativo.  
Hoje ela funciona mais como um formulário simples de dados da empresa.

A evolução desejada é transformar **Configurações** em uma área central que funcione como:

1. fonte de verdade do negócio;
2. fonte de verdade da IA;
3. centro de regras operacionais da barbearia;
4. painel de integrações;
5. base que abastece o agente IA nas respostas;
6. extensão natural do onboarding.

---

# 2. OBJETIVO DO PATCH

Este patch deve atualizar o sistema para que:

- a área de **Configurações** deixe de ser apenas um CRUD simples;
- passe a organizar informações por domínio;
- fique preparada para alimentar a IA com contexto útil;
- reflita melhor o modelo de negócio da barbearia;
- esteja conectada com onboarding, equipe, agenda e integrações;
- seja escalável para a evolução futura da BlackHub.

Além disso:

- o onboarding deve evoluir para coletar melhor as informações iniciais;
- essas informações devem ser salvas de forma estruturada;
- a IA deve poder consultar essas informações depois.

---

# 3. RESULTADO ESPERADO

Ao final deste patch, o sistema deve ter:

## 3.1. Página de Configurações reorganizada
Com as seguintes abas/seções:

- Barbearia
- Equipe
- Agenda
- IA
- Integrações

## 3.2. Onboarding expandido
O onboarding deve coletar não só os dados básicos, mas também:
- informações estratégicas do negócio;
- preferências operacionais;
- contexto da IA;
- dados de equipe, quando aplicável.

## 3.3. Estrutura de dados preparada para o futuro
Mesmo que nem tudo seja usado imediatamente na IA, os dados já devem ficar salvos de forma correta para reaproveitamento posterior.

---

# 4. DIRETRIZES GERAIS DE IMPLEMENTAÇÃO

## 4.1. Não quebrar o que já funciona
Preservar:
- autenticação;
- tenant atual;
- rotas existentes;
- páginas de clientes, serviços e agenda;
- comportamento atual do onboarding, expandindo-o sem regressão.

## 4.2. Evitar refatoração desnecessária
Não reconstruir o projeto inteiro.
Focar em:
- ampliar domínio;
- melhorar modelagem;
- organizar melhor a tela de configuração;
- tornar o onboarding mais útil.

## 4.3. Multi-tenant obrigatório
Toda configuração deve estar ligada ao `tenant_id`.

## 4.4. Estruturação antes de automação pesada
Ainda não implementar todo o sistema multiagente.
Primeiro estruturar os dados e a UI correta para alimentar isso depois.

---

# 5. ESCOPO DESTE PATCH

Este patch deve incluir:

1. evolução da página de configurações;
2. criação ou ampliação de tipos e contratos;
3. criação de serviços de dados para configurações;
4. ajuste do onboarding;
5. persistência estruturada no Supabase;
6. base para futura integração com IA.

Não é objetivo deste patch:
- implementar o agente IA completo;
- implementar toda a lógica N8N;
- criar backend separado agora;
- criar dashboards analíticos completos;
- implementar financeiro completo.

---

# 6. NOVA ESTRUTURA FUNCIONAL DE CONFIGURAÇÕES

A página de configurações deve ser reorganizada nas seguintes áreas.

---

## 6.1. ABA: BARBEARIA

### Objetivo
Centralizar os dados institucionais e operacionais básicos da empresa.

### Campos obrigatórios
- nome da barbearia;
- nome do dono;
- telefone principal;
- email principal;
- endereço completo;
- cidade;
- estado;
- instagram.

### Campos recomendados
- descrição curta da barbearia;
- estilo da barbearia;
- público-alvo;
- diferenciais do negócio.

### Finalidade desses dados
Essas informações devem servir para:
- exibição no painel;
- consistência cadastral;
- uso futuro pela IA;
- respostas contextuais aos clientes;
- base para onboarding e integrações.

### Comportamento da tela
- carregar dados do tenant atual;
- permitir edição;
- salvar alterações;
- apresentar feedback visual de sucesso/erro.

---

## 6.2. ABA: EQUIPE

### Objetivo
Preparar o sistema para agenda por barbeiro e regras por profissional.

### Campos por barbeiro
- nome;
- cargo ou função;
- ativo/inativo;
- telefone opcional;
- especialidades;
- observações;
- avatar ou foto futura (opcional, deixar preparado).

### Estrutura funcional desejada
A tela deve permitir:
- listar barbeiros;
- criar barbeiro;
- editar barbeiro;
- inativar barbeiro.

### Observação importante
Mesmo que a agenda ainda não esteja 100% ligada a barbeiros, o sistema deve ficar preparado para isso.

### Resultado esperado
A equipe deixa de ser uma aba vazia ou superficial e passa a representar a futura operação real da agenda.

---

## 6.3. ABA: AGENDA

### Objetivo
Centralizar regras operacionais de agendamento.

### Campos desejados
- antecedência mínima para agendamento;
- antecedência máxima;
- intervalo entre atendimentos;
- permitir agendamento automático pela IA: sim/não;
- exigir confirmação antes de criar agendamento: sim/não;
- política de cancelamento;
- limite de reagendamento;
- mensagem padrão de confirmação;
- mensagem padrão de cancelamento.

### Importância
Essas configurações não são apenas administrativas.  
Elas servirão de base para:
- fluxo da agenda;
- comportamento da IA;
- validação futura do ScheduleManager;
- regras do negócio.

### Comportamento
- carregar regras salvas;
- exibir formulário limpo;
- persistir como estrutura organizada;
- permitir evolução futura sem quebrar compatibilidade.

---

## 6.4. ABA: IA

### Objetivo
Transformar configurações em fonte de contexto para o agente IA.

### Campos principais
- nome do assistente;
- tom de voz;
- estilo de atendimento;
- descrição da barbearia para a IA;
- diferenciais;
- observações importantes para atendimento;
- instruções comerciais importantes;
- a IA pode agendar automaticamente?: sim/não;
- a IA deve sempre confirmar horários antes de fechar?: sim/não;
- a IA pode responder fora do horário?: sim/não;
- mensagem de saudação padrão;
- mensagem de ausência / fora do horário.

### Valores sugeridos
#### Tom de voz
- profissional
- descontraído
- premium

#### Estilo de atendimento
- direto
- consultivo
- acolhedor

### Finalidade
Esses dados devem alimentar a futura construção dinâmica do contexto da IA.

### Importante
Não salvar um “prompt gigante final”.
Salvar somente os campos estruturados que depois serão usados na composição de contexto.

---

## 6.5. ABA: INTEGRAÇÕES

### Objetivo
Exibir e gerenciar conexões operacionais da barbearia.

### Blocos principais
- WhatsApp / Evolution API
- Google Calendar
- N8N / webhook

### Campos sugeridos

#### WhatsApp
- status da conexão;
- nome da instância;
- número conectado;
- identificador da instância;
- botão ou placeholder para reconectar (se aplicável depois).

#### Google Calendar
- conectado: sim/não;
- email ou calendário conectado;
- sincronização ativa: sim/não;
- observação de integração transitória.

#### N8N
- webhook cadastrado;
- status de envio;
- última sincronização futura (placeholder se não houver);
- chave ou URL mascarada quando fizer sentido.

### Comportamento
Nesta fase, pode ser parcialmente informativa, desde que a modelagem fique correta.

---

# 7. MUDANÇAS NO ONBOARDING

O onboarding atual deve continuar existindo, mas precisa ser expandido.

## 7.1. Filosofia nova do onboarding
O onboarding não deve ser apenas:
- cadastro da barbearia.

Ele deve passar a ser:
- a criação inicial da configuração operacional do tenant;
- a base que futuramente abastece a IA;
- a primeira carga de dados do negócio.

---

## 7.2. Estrutura recomendada do novo onboarding

### Etapa 1 — Dados da barbearia
Coletar:
- nome da barbearia;
- nome do dono;
- telefone;
- email;
- endereço;
- cidade;
- estado;
- instagram.

### Etapa 2 — Serviços
Manter a etapa atual e preservar:
- nome do serviço;
- preço;
- duração.

### Etapa 3 — Horários de funcionamento
Manter a etapa atual e salvar corretamente para uso posterior.

### Etapa 4 — Equipe
Nova etapa.

Permitir:
- cadastrar barbeiros principais;
- opcionalmente pular se o usuário ainda não quiser preencher;
- se possível, pelo menos um cadastro simples com nome.

### Etapa 5 — WhatsApp
Manter e melhorar a captura da instância.

### Etapa 6 — Agenda
Expandir a etapa que hoje fala de calendário para incluir:
- conexão do Google Calendar;
- regras básicas de agendamento.

### Etapa 7 — IA
Nova etapa importante.

Coletar:
- nome do assistente;
- tom de voz;
- estilo de atendimento;
- descrição da barbearia;
- público-alvo;
- diferenciais;
- observações importantes.

### Etapa 8 — Finalização
Resumo e confirmação final.

---

# 8. MODELAGEM DE DADOS RECOMENDADA

O sistema atual já tem `tenants`, `tenant_members`, `services` e afins.
Este patch deve ampliar a modelagem com foco em configurações.

A implementação pode usar tabelas novas ou ampliar a estrutura atual, mas deve seguir a lógica abaixo.

---

## 8.1. TABELA / ESTRUTURA: tenant_settings

### Finalidade
Guardar configurações gerais do tenant.

### Campos sugeridos
- id
- tenant_id
- owner_name
- business_phone
- business_email
- address
- city
- state
- instagram_handle
- description
- business_style
- target_audience
- differentiators
- updated_at

### Observação
Se parte disso já estiver em `tenants`, evitar duplicação desnecessária.  
O ideal é:
- manter dados principais institucionais em `tenants`;
- criar `tenant_settings` para configurações complementares.

---

## 8.2. TABELA / ESTRUTURA: tenant_ai_settings

### Finalidade
Salvar as configurações da IA por tenant.

### Campos sugeridos
- id
- tenant_id
- assistant_name
- tone_of_voice
- service_style
- business_summary
- customer_profile
- differentiators
- important_notes
- can_auto_schedule
- must_confirm_before_booking
- can_reply_outside_business_hours
- greeting_message
- out_of_hours_message
- updated_at

### Importante
Essa tabela não é o prompt final.  
Ela é uma base estruturada para montar o contexto da IA depois.

---

## 8.3. TABELA / ESTRUTURA: tenant_booking_settings

### Finalidade
Salvar regras da agenda.

### Campos sugeridos
- id
- tenant_id
- min_booking_notice_minutes
- max_booking_notice_days
- buffer_between_appointments_minutes
- allow_ai_booking
- require_manual_confirmation
- cancellation_policy
- reschedule_limit
- confirmation_message_template
- cancellation_message_template
- updated_at

---

## 8.4. TABELA / ESTRUTURA: barbers

### Finalidade
Representar profissionais da equipe.

### Campos sugeridos
- id
- tenant_id
- name
- role
- phone
- specialties
- notes
- is_active
- created_at
- updated_at

### Observação
Se depois houver agenda individual, essa tabela será fundamental.

---

## 8.5. TABELA / ESTRUTURA: tenant_integrations

### Finalidade
Salvar o estado das integrações do tenant.

### Campos sugeridos
- id
- tenant_id
- whatsapp_instance_name
- whatsapp_instance_id
- whatsapp_status
- whatsapp_phone
- google_calendar_connected
- google_calendar_email
- n8n_webhook_url
- integration_notes
- updated_at

---

# 9. DIRETRIZ DE PERSISTÊNCIA

## 9.1. Não salvar tudo em blob genérico sem estrutura
Evitar:
- um único JSON gigante jogado em uma tabela sem organização clara, se isso prejudicar manutenção.

## 9.2. Também evitar excesso de fragmentação
Não criar 20 tabelas se 4 ou 5 resolvem.

## 9.3. Melhor equilíbrio
Manter:
- dados institucionais em `tenants`;
- regras específicas em tabelas complementares organizadas por domínio.

---

# 10. MUDANÇAS DE FRONT-END

---

## 10.1. Nova estrutura da página de configurações

Criar ou refatorar a página de configurações para ter:

### Sidebar interna
- Barbearia
- Equipe
- Agenda
- IA
- Integrações

### Área principal
- card/formulário por seção
- botão salvar por aba ou salvar geral
- UX consistente com o design atual

### Requisitos visuais
- manter identidade da plataforma atual;
- usar o mesmo padrão de componentes, espaçamento e tipografia;
- evitar aparência genérica;
- preservar a sensação premium do produto.

---

## 10.2. Organização de componentes

Criar componentes separados por aba, por exemplo:

- `BarbershopSettingsSection`
- `TeamSettingsSection`
- `BookingSettingsSection`
- `AiSettingsSection`
- `IntegrationsSettingsSection`

Esses nomes podem ser adaptados, mas a separação deve existir.

---

## 10.3. Organização de tipos

Criar tipos claros, por exemplo:

- `TenantSettings`
- `TenantAISettings`
- `TenantBookingSettings`
- `TenantIntegrationSettings`
- `Barber`

---

## 10.4. Organização de services

Parar de concentrar tudo em um CRUD genérico quando a responsabilidade ficar confusa.

Criar algo como:

- `settingsService.ts`
- `teamService.ts`
- `integrationService.ts`

Se julgar melhor, pode manter parte do CRUD atual, mas o ideal é caminhar para serviços mais semânticos.

---

# 11. TAREFAS ESPECÍFICAS PARA IMPLEMENTAÇÃO

Abaixo está a lista objetiva do que deve ser feito.

---

## 11.1. Configurações — estrutura e UI
- localizar a página atual de configurações;
- refatorar layout para suportar as novas abas;
- implementar navegação interna entre seções;
- criar formulários específicos para cada área;
- carregar dados do tenant atual;
- salvar dados com feedback visual.

---

## 11.2. Tipos e contratos
- criar tipos para configurações;
- criar tipos para equipe;
- criar tipos para integrações;
- criar tipos para regras de IA;
- garantir consistência com TypeScript.

---

## 11.3. Camada de dados
- criar serviços específicos para leitura/escrita das novas configurações;
- usar `tenant_id` em todas as operações;
- garantir tratamento de erro;
- garantir tipagem;
- evitar duplicação.

---

## 11.4. Onboarding
- ampliar o fluxo atual;
- adicionar etapa de equipe;
- adicionar etapa de IA;
- expandir etapa de agenda;
- persistir os novos dados;
- continuar redirecionando corretamente ao final.

---

## 11.5. Integração entre onboarding e configurações
Tudo que for preenchido no onboarding deve aparecer depois em configurações.

Tudo que for alterado em configurações deve atualizar o estado real do tenant.

---

# 12. COMPORTAMENTO DA IA NO FUTURO — DEIXAR PREPARADO

Este patch não precisa implementar o agente IA completo, mas deve deixar pronto o seguinte:

## A IA deverá conseguir consultar:
- dados da barbearia;
- horários;
- serviços;
- equipe;
- regras de agenda;
- tom de voz;
- observações de negócio;
- mensagens padrão;
- políticas de atendimento.

## Isso significa que:
- os dados precisam estar estruturados;
- os nomes precisam ser claros;
- não deve haver ambiguidade entre “dados institucionais” e “regras da IA”.

---

# 13. ORDEM RECOMENDADA DE EXECUÇÃO

Executar nesta ordem:

## Etapa A — modelagem
1. revisar estrutura atual;
2. criar tipos;
3. ajustar tabelas/queries;
4. preparar persistência.

## Etapa B — settings
1. refatorar tela de configurações;
2. criar seções novas;
3. ligar ao banco;
4. validar edição e persistência.

## Etapa C — onboarding
1. ampliar fluxo;
2. adicionar novas etapas;
3. salvar novos campos;
4. validar continuidade.

## Etapa D — integração entre páginas
1. garantir que onboarding populará configurações;
2. garantir que configurações reflitam dados salvos;
3. garantir que tenant atual carregue tudo corretamente.

---

# 14. CRITÉRIOS DE ACEITAÇÃO

O patch será considerado correto se:

- a página de configurações estiver dividida em seções coerentes com o produto;
- os dados da barbearia forem mais completos;
- houver uma aba real de IA;
- houver uma aba real de Agenda;
- houver uma aba real de Equipe;
- integrações estiverem representadas corretamente;
- onboarding tiver sido expandido;
- os dados salvos puderem ser usados futuramente pela IA;
- tudo continuar multi-tenant;
- a UX continuar consistente com a estética do sistema atual.

---

# 15. RESTRIÇÕES IMPORTANTES

## Não fazer agora
- não implementar o agente IA completo;
- não criar prompts gigantes hardcoded;
- não mover tudo para backend separado agora;
- não quebrar o fluxo atual;
- não reinventar a arquitetura inteira neste patch.

## Fazer agora
- estruturar corretamente;
- preparar o sistema para a próxima fase;
- melhorar a consistência do domínio;
- deixar o produto mais próximo da visão original da BlackHub.

---

# 16. SAÍDA ESPERADA DO VS CODE / CLAUDE CODE

Ao executar este patch, você deve:

1. analisar a estrutura atual do projeto;
2. identificar os arquivos que precisam ser alterados;
3. aplicar as mudanças com o menor retrabalho possível;
4. manter consistência visual e arquitetural;
5. atualizar ou criar os tipos necessários;
6. ampliar o onboarding e configurações;
7. deixar o código limpo, modular e legível;
8. documentar em `/docs/ai-collab/proxima-sessao.md`:
   - o que foi feito;
   - o que ficou pendente;
   - riscos encontrados;
   - próximo passo recomendado.

Se houver dúvida relevante de modelagem, registrar em `/docs/ai-collab/duvidas.md`.
Se houver sugestão importante de evolução, registrar em `/docs/ai-collab/sugestoes.md`.

---

# 17. INSTRUÇÃO FINAL PARA EXECUÇÃO

Implemente este patch como uma evolução real do BlackHub Barber, preservando o que já existe e aproximando o sistema da visão definida para a plataforma.

Priorize:
- clareza;
- persistência bem estruturada;
- UX consistente;
- preparação para IA;
- multi-tenant;
- evolução sustentável.

Não trate a área de configurações como um formulário simples.

Trate-a como o núcleo de configuração do negócio e do futuro agente IA.
