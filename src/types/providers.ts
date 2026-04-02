/**
 * Interfaces de abstração de integrações — BlackHub Barber
 *
 * Conforme seção 15.7 do Prompt Master Final.
 * Nunca acoplar domínio diretamente a APIs externas.
 * Trocar provider não deve quebrar regra de negócio.
 */

// ─── Calendar Provider ───────────────────────────────────────

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  metadata?: Record<string, unknown>;
};

export type CalendarAvailability = {
  date: string;         // YYYY-MM-DD
  slots: TimeSlot[];
};

export type TimeSlot = {
  start: string;        // HH:mm
  end: string;          // HH:mm
  available: boolean;
};

export interface CalendarProvider {
  name: string;
  createEvent(tenantId: string, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;
  updateEvent(tenantId: string, eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(tenantId: string, eventId: string): Promise<void>;
  getAvailability(tenantId: string, barberId: string, date: string): Promise<CalendarAvailability>;
  listEvents(tenantId: string, from: Date, to: Date): Promise<CalendarEvent[]>;
}

// ─── Messaging Provider ──────────────────────────────────────

export type IncomingMessage = {
  id: string;
  from: string;         // phone number or handle
  content: string;
  timestamp: Date;
  channel: 'whatsapp' | 'instagram';
  metadata?: Record<string, unknown>;
};

export type OutgoingMessage = {
  to: string;
  content: string;
  channel: 'whatsapp' | 'instagram';
  metadata?: Record<string, unknown>;
};

export type MessageDeliveryStatus = {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
};

export interface MessagingProvider {
  name: string;
  sendMessage(tenantId: string, message: OutgoingMessage): Promise<MessageDeliveryStatus>;
  getConnectionStatus(tenantId: string): Promise<'connected' | 'disconnected' | 'connecting'>;
}

// ─── AI Provider ─────────────────────────────────────────────

export type AiCompletionRequest = {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
};

export type AiCompletionResponse = {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  latencyMs: number;
};

export interface AiProvider {
  name: string;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}

// ─── Repositories ────────────────────────────────────────────

export interface CustomerRepository {
  findByPhone(tenantId: string, phone: string): Promise<Customer | null>;
  findById(tenantId: string, id: string): Promise<Customer | null>;
  create(tenantId: string, data: CreateCustomerData): Promise<Customer>;
  update(tenantId: string, id: string, data: Partial<CreateCustomerData>): Promise<Customer>;
  getHistory(tenantId: string, clientId: string): Promise<CustomerHistory>;
}

export interface AppointmentRepository {
  create(tenantId: string, data: CreateAppointmentData): Promise<Appointment>;
  update(tenantId: string, id: string, data: Partial<CreateAppointmentData>): Promise<Appointment>;
  cancel(tenantId: string, id: string, reason?: string): Promise<void>;
  findConflicts(tenantId: string, barberId: string, startTime: Date, endTime: Date): Promise<Appointment[]>;
  listByDate(tenantId: string, date: string): Promise<Appointment[]>;
  listByClient(tenantId: string, clientId: string): Promise<Appointment[]>;
}

// ─── Domain types usados pelas interfaces ────────────────────

export type Customer = {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  preferences?: Record<string, unknown>;
  lastVisitAt?: Date;
  totalVisits: number;
  totalSpent: number;
  source: 'whatsapp' | 'instagram' | 'manual' | 'website';
  createdAt: Date;
};

export type CreateCustomerData = {
  name: string;
  phone: string;
  email?: string;
  source?: Customer['source'];
  preferences?: Record<string, unknown>;
  notes?: string;
};

export type CustomerHistory = {
  appointments: Appointment[];
  totalVisits: number;
  totalSpent: number;
  lastVisit?: Date;
  preferredBarber?: string;
  preferredService?: string;
  memories: CustomerMemory[];
};

export type CustomerMemory = {
  id: string;
  type: 'preference' | 'behavior' | 'note' | 'summary';
  content: string;
  relevanceScore: number;
  createdAt: Date;
};

export type Appointment = {
  id: string;
  tenantId: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'canceled';
  price: number;
  notes?: string;
  source: 'ai' | 'manual' | 'website';
  externalEventId?: string;
  createdAt: Date;
};

export type CreateAppointmentData = {
  clientId: string;
  barberId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  price: number;
  notes?: string;
  source?: Appointment['source'];
};
