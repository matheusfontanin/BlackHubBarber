import * as z from 'zod';

// Barbershop Info Step
export const barbershopSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  ownerName: z.string().min(2, 'Nome do dono deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
  address: z.string().min(5, 'Endereço muito curto'),
  city: z.string().min(2, 'Cidade inválida'),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  instagram: z.string().optional(),
});

export type BarbershopFormData = z.infer<typeof barbershopSchema>;

// Services Step
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

// Business Hours Step
export interface DayHours {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
}

// WhatsApp Step
export interface WhatsAppStepData {
  whatsappInstanceName?: string;
}

// Calendar Step
export interface CalendarStepData {
  googleCalendarConnected?: boolean;
}

// Union type for onNext data based on step
export type StepData = 
  | BarbershopFormData
  | Service[]
  | DayHours[]
  | WhatsAppStepData
  | CalendarStepData
  | undefined;
