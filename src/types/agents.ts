/**
 * Contratos universais de agentes — BlackHub Barber
 *
 * Conforme seção 12 do Prompt Master Final.
 * Todos os agentes (N8N, Edge Functions ou backend futuro) devem
 * respeitar estes contratos de entrada e saída.
 */

// ─── Input padrao ────────────────────────────────────────────

export type ActorType = 'customer' | 'owner';

export type AgentInput = {
  tenantId: string;
  conversationId: string;
  actorType: ActorType;
  message: string;
  context?: Record<string, unknown>;
};

// ─── Output padrao ───────────────────────────────────────────

export type AgentOutput = {
  intent: string;
  confidence: number;
  action?: string;
  payload?: Record<string, unknown>;
  response?: string;
};

// ─── Interface de agente ─────────────────────────────────────

export interface Agent {
  name: string;
  execute(input: AgentInput): Promise<AgentOutput>;
}

// ─── Nomes dos agentes ───────────────────────────────────────

export const AGENT_NAMES = {
  CUSTOMER_ASSISTANT: 'CustomerAssistant',
  CUSTOMER_RAG: 'CustomerRAG',
  BARBER_ASSISTANT: 'BarberAssistant',
  BARBER_RAG: 'BarberRAG',
  SCHEDULE_MANAGER: 'ScheduleManager',
  PROMPT_UPDATER: 'PromptUpdater',
  MEMORY_BUILDER: 'MemoryBuilder',
  CONTEXT_ORCHESTRATOR: 'ContextOrchestrator',
} as const;

export type AgentName = (typeof AGENT_NAMES)[keyof typeof AGENT_NAMES];

// ─── Intencoes conhecidas ────────────────────────────────────

export const INTENTS = {
  // Cliente
  ASK_PRICE: 'ask_price',
  ASK_LOCATION: 'ask_location',
  ASK_HOURS: 'ask_hours',
  ASK_SERVICES: 'ask_services',
  ASK_BARBERS: 'ask_barbers',
  CREATE_APPOINTMENT: 'create_appointment',
  RESCHEDULE_APPOINTMENT: 'reschedule_appointment',
  CANCEL_APPOINTMENT: 'cancel_appointment',
  GENERAL_QUESTION: 'general_question',
  GREETING: 'greeting',

  // Dono
  UPDATE_RULE: 'update_rule',
  UPDATE_HOURS: 'update_hours',
  UPDATE_SERVICE: 'update_service',
  UPDATE_BARBER: 'update_barber',
  VIEW_AGENDA: 'view_agenda',
  TEACH_AI: 'teach_ai',

  // Sistema
  UNKNOWN: 'unknown',
} as const;

export type Intent = (typeof INTENTS)[keyof typeof INTENTS];

// ─── Actions (para tool calling) ─────────────────────────────

export const ACTIONS = {
  SCHEDULE_CREATE: 'schedule.create',
  SCHEDULE_RESCHEDULE: 'schedule.reschedule',
  SCHEDULE_CANCEL: 'schedule.cancel',
  SCHEDULE_CHECK_AVAILABILITY: 'schedule.check_availability',
  RULES_UPDATE: 'rules.update',
  RULES_VERSION: 'rules.version',
  KNOWLEDGE_SAVE: 'knowledge.save',
  MEMORY_SAVE: 'memory.save',
  MESSAGE_SEND: 'message.send',
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

// ─── Log de agente ───────────────────────────────────────────

export type AgentLogEntry = {
  tenantId: string;
  agentName: AgentName;
  actorType: ActorType | 'system';
  conversationId?: string;
  input: AgentInput;
  output?: AgentOutput;
  intent?: string;
  action?: string;
  confidence?: number;
  latencyMs?: number;
  error?: string;
  correlationId?: string;
};
