# Fluxos

**Fluxo 1 — Entrada**
Webhook → resolve tenant → resolve actor → salvar mensagem

**Fluxo 2 — Informação**
CustomerAssistant → RAG → resposta

**Fluxo 3 — Agendamento**
CustomerAssistant → ScheduleManager → valida → cria → responde

**Fluxo 4 — Dono**
BarberAssistant → PromptUpdater → salvar regra
