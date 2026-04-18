# Contratos dos Tools — BlackHub Barber

Documentação técnica dos contratos de entrada/saída dos tools utilizados pelos agentes N8N.

## Estrutura Geral

Todos os tools seguem o padrão:
- **Input**: JSON estruturado com campos obrigatórios
- **Output**: JSON estruturado com campos padronizados
- **Error Handling**: Campo `error` presente em caso de falha

## 1. Tool: Buscar Cliente por Telefone

**Propósito**: Localizar cliente existente ou criar novo baseado no número de telefone.

**Input**:
```json
{
  "tenantId": "uuid",
  "phone": "string (formato internacional, ex: +5511999999999)",
  "createIfNotExists": "boolean (default: true)",
  "clientData": {
    "name": "string (opcional)",
    "source": "string (default: 'whatsapp')"
  }
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "name": "string",
    "phone": "string",
    "email": "string|null",
    "isNew": "boolean",
    "totalVisits": "number",
    "lastVisitAt": "timestamp|null",
    "preferences": "object"
  }
}
```

**Output (Erro)**:
```json
{
  "success": false,
  "error": "string",
  "code": "CLIENT_NOT_FOUND|INVALID_PHONE|DATABASE_ERROR"
}
```

## 2. Tool: Verificar Disponibilidade de Agenda

**Propósito**: Consultar slots disponíveis para agendamento.

**Input**:
```json
{
  "tenantId": "uuid",
  "serviceId": "uuid",
  "barberId": "uuid|null (null = qualquer barbeiro)",
  "date": "string (YYYY-MM-DD)",
  "durationMinutes": "number"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "availableSlots": [
    {
      "startTime": "string (HH:mm)",
      "endTime": "string (HH:mm)",
      "barberId": "uuid",
      "barberName": "string"
    }
  ]
}
```

**Output (Erro)**:
```json
{
  "success": false,
  "error": "string",
  "code": "NO_AVAILABILITY|SERVICE_NOT_FOUND|BARBER_NOT_FOUND"
}
```

## 3. Tool: Criar Agendamento

**Propósito**: Criar novo agendamento no sistema.

**Input**:
```json
{
  "tenantId": "uuid",
  "clientId": "uuid",
  "serviceId": "uuid",
  "barberId": "uuid",
  "startTime": "string (ISO 8601 timestamp)",
  "notes": "string (opcional)",
  "source": "string (default: 'ai')",
  "sendConfirmation": "boolean (default: true)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "clientName": "string",
    "serviceName": "string",
    "barberName": "string",
    "startTime": "timestamp",
    "endTime": "timestamp",
    "status": "string",
    "price": "number"
  }
}
```

**Output (Erro)**:
```json
{
  "success": false,
  "error": "string",
  "code": "SLOT_UNAVAILABLE|CLIENT_NOT_FOUND|SERVICE_NOT_FOUND|BARBER_NOT_FOUND"
}
```

## 4. Tool: Buscar Agendamentos do Cliente

**Propósito**: Listar agendamentos futuros e passados do cliente.

**Input**:
```json
{
  "tenantId": "uuid",
  "clientId": "uuid",
  "status": "string[] (opcional, default: ['scheduled', 'confirmed'])",
  "limit": "number (default: 10)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "appointments": [
    {
      "id": "uuid",
      "serviceName": "string",
      "barberName": "string",
      "startTime": "timestamp",
      "status": "string",
      "price": "number",
      "canCancel": "boolean",
      "canReschedule": "boolean"
    }
  ]
}
```

## 5. Tool: Cancelar Agendamento

**Propósito**: Cancelar agendamento existente.

**Input**:
```json
{
  "tenantId": "uuid",
  "appointmentId": "uuid",
  "reason": "string (opcional)",
  "notifyClient": "boolean (default: true)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "status": "canceled",
    "canceledAt": "timestamp"
  }
}
```

## 6. Tool: Reagendar Agendamento

**Propósito**: Alterar data/hora de agendamento existente.

**Input**:
```json
{
  "tenantId": "uuid",
  "appointmentId": "uuid",
  "newStartTime": "string (ISO 8601 timestamp)",
  "newBarberId": "uuid (opcional)",
  "notifyClient": "boolean (default: true)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "startTime": "timestamp",
    "endTime": "timestamp",
    "barberName": "string"
  }
}
```

## 7. Tool: Buscar Serviços Disponíveis

**Propósito**: Listar serviços ativos da barbearia.

**Input**:
```json
{
  "tenantId": "uuid"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "services": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "durationMinutes": "number",
      "price": "number"
    }
  ]
}
```

## 8. Tool: Buscar Barbeiros Disponíveis

**Propósito**: Listar barbeiros ativos da barbearia.

**Input**:
```json
{
  "tenantId": "uuid"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "barbers": [
    {
      "id": "uuid",
      "name": "string",
      "avatarUrl": "string|null",
      "specialties": "string[]"
    }
  ]
}
```

## 9. Tool: Enviar Mensagem WhatsApp

**Propósito**: Enviar mensagem através do WhatsApp.

**Input**:
```json
{
  "tenantId": "uuid",
  "phone": "string",
  "message": "string",
  "messageType": "string (default: 'text')",
  "mediaUrl": "string (opcional, para mensagens com mídia)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "messageId": "string",
  "timestamp": "timestamp"
}
```

## 10. Tool: Atualizar Status da Conversa

**Propósito**: Alterar status da conversa (ativo/fechado/escalado).

**Input**:
```json
{
  "tenantId": "uuid",
  "conversationId": "uuid",
  "status": "string ('active'|'closed'|'escalated')",
  "reason": "string (opcional)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "status": "string",
    "updatedAt": "timestamp"
  }
}
```

## 11. Tool: Registrar Log do Agente

**Propósito**: Registrar execução de agente para auditoria.

**Input**:
```json
{
  "tenantId": "uuid",
  "agentName": "string",
  "actorType": "string ('customer'|'owner'|'system')",
  "conversationId": "uuid (opcional)",
  "input": "object",
  "output": "object",
  "intent": "string (opcional)",
  "action": "string (opcional)",
  "confidence": "number (0-1)",
  "latencyMs": "number",
  "error": "string (opcional)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "logId": "uuid"
}
```

## 12. Tool: Buscar Memória do Cliente

**Propósito**: Recuperar informações contextuais sobre o cliente.

**Input**:
```json
{
  "tenantId": "uuid",
  "clientId": "uuid",
  "memoryType": "string (opcional)",
  "limit": "number (default: 5)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "memories": [
    {
      "id": "uuid",
      "type": "string",
      "content": "string",
      "relevanceScore": "number",
      "createdAt": "timestamp"
    }
  ]
}
```

## 13. Tool: Salvar Memória do Cliente

**Propósito**: Armazenar nova informação sobre o cliente.

**Input**:
```json
{
  "tenantId": "uuid",
  "clientId": "uuid",
  "memoryType": "string ('preference'|'behavior'|'note'|'summary')",
  "content": "string",
  "source": "string (default: 'ai')",
  "relevanceScore": "number (default: 1.0)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "memoryId": "uuid"
}
```

## 14. Tool: Buscar Regras Dinâmicas

**Propósito**: Recuperar regras ativas do negócio.

**Input**:
```json
{
  "tenantId": "uuid",
  "category": "string (opcional)",
  "ruleKey": "string (opcional)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "rules": [
    {
      "id": "uuid",
      "category": "string",
      "ruleKey": "string",
      "ruleValue": "object",
      "description": "string",
      "priority": "number"
    }
  ]
}
```

## 15. Tool: Executar Campanha

**Propósito**: Disparar campanha de mensagens.

**Input**:
```json
{
  "tenantId": "uuid",
  "campaignId": "uuid",
  "targetClients": "uuid[] (opcional, se não informado usa filtro da campanha)"
}
```

**Output (Sucesso)**:
```json
{
  "success": true,
  "campaignExecutionId": "uuid",
  "totalRecipients": "number"
}
```

---

## Padrões de Error Handling

Todos os tools retornam erros no formato:

```json
{
  "success": false,
  "error": "Mensagem descritiva do erro",
  "code": "CÓDIGO_ESPECÍFICO_DO_ERRO",
  "details": "object (opcional, informações adicionais)"
}
```

### Códigos de Erro Comuns

- `VALIDATION_ERROR`: Dados de entrada inválidos
- `NOT_FOUND`: Recurso não encontrado
- `UNAUTHORIZED`: Acesso negado
- `CONFLICT`: Conflito de estado (ex: slot já ocupado)
- `EXTERNAL_API_ERROR`: Erro em integração externa
- `DATABASE_ERROR`: Erro interno de banco
- `RATE_LIMITED`: Limite de requisições excedido

## Versionamento

- **v1.0**: Contratos iniciais para Etapa 04
- Próximas versões incluirão novos tools conforme expansão do sistema