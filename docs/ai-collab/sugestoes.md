# Sugestoes

## [2026-04-01 00:00] Sugestao 001
**Relacionado a:** modulo de agendamento
**Tipo:** arquitetura
**Sugestao:** Criar uma camada abstrata de calendario (CalendarProvider) para nao acoplar a aplicacao ao Google Agenda
**Beneficio:** Facilita migracao futura para agenda propria (Nivel 3)
**Prioridade:** alta
**Status:** implementado — interface criada em src/types/providers.ts

## [2026-04-01 00:00] Sugestao 002
**Relacionado a:** workflows N8N
**Tipo:** qualidade
**Sugestao:** Dividir workflows N8N em subworkflows menores e reutilizaveis (tenant resolver, actor resolver, response builder) conforme secao 15.4 do master
**Beneficio:** Reduz complexidade, facilita testes e manutencao
**Prioridade:** media
**Status:** pendente

## [2026-04-01 00:00] Sugestao 003
**Relacionado a:** prompt engine
**Tipo:** arquitetura
**Sugestao:** Implementar montagem dinamica de prompts a partir de regras_dinamicas + dados do tenant, em vez de prompts hardcoded nos workflows N8N
**Beneficio:** Donos podem alterar regras via WhatsApp sem precisar editar workflows
**Prioridade:** alta
**Status:** pendente — tabela regras_dinamicas criada na migration 00003
