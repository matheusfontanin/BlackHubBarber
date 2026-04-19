import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './promptBuilder';
import type { TenantBusinessProfile, TenantAIConfig, TenantBookingRules, Service, Barber } from '@/types/settings';

function makeProfile(overrides: Partial<TenantBusinessProfile> = {}): TenantBusinessProfile {
  return {
    tenant_id: 't1',
    trade_name: 'Barber Lab',
    business_phone: '+55 11 99999-0000',
    ...overrides,
  } as TenantBusinessProfile;
}

function makeAi(overrides: Partial<TenantAIConfig> = {}): TenantAIConfig {
  return {
    tenant_id: 't1',
    assistant_name: 'Luna',
    ...overrides,
  } as TenantAIConfig;
}

function makeBooking(overrides: Partial<TenantBookingRules> = {}): TenantBookingRules {
  return {
    tenant_id: 't1',
    min_booking_notice_minutes: 60,
    max_booking_notice_days: 30,
    buffer_between_appointments_minutes: 10,
    reschedule_limit: 2,
    ...overrides,
  } as TenantBookingRules;
}

const emptyServices: Service[] = [];
const emptyBarbers: Barber[] = [];

describe('buildSystemPrompt', () => {
  it('inclui nome do assistente e nome fantasia', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile({ trade_name: 'Navalha Real' }),
      ai: makeAi({ assistant_name: 'Max' }),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('Max');
    expect(prompt).toContain('Navalha Real');
  });

  it('cai em valores padrão quando campos opcionais estão vazios', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi({ assistant_name: undefined }),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('Assistente');
    expect(prompt).toContain('Descrição não informada');
    expect(prompt).toContain('Endereço não informado');
  });

  it('formata endereço unindo partes preenchidas', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile({
        address_street: 'Rua A',
        address_number: '100',
        address_neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      }),
      ai: makeAi(),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('Rua A, 100, Centro, São Paulo, SP');
  });

  it('formata horário de funcionamento por dia', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile({
        opening_hours: {
          seg: { open: '09:00', close: '20:00', closed: false },
          dom: { closed: true },
        },
      }),
      ai: makeAi(),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('seg: 09:00 - 20:00');
    expect(prompt).toContain('dom: Fechado');
  });

  it('lista serviços com preço e duração', () => {
    const services: Service[] = [
      { tenant_id: 't1', name: 'Corte', duration_minutes: 30, price: 50, description: null, is_active: true, sort_order: 0 },
      { tenant_id: 't1', name: 'Barba', duration_minutes: 20, price: 35, description: 'Toalha quente', is_active: true, sort_order: 1 },
    ];

    const prompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi(),
      booking: makeBooking(),
      services,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('Corte: R$ 50 (30 min)');
    expect(prompt).toContain('Barba: R$ 35 (20 min) — Toalha quente');
  });

  it('lista equipe quando há barbeiros', () => {
    const barbers: Barber[] = [
      { tenant_id: 't1', name: 'João', role: 'barber', phone: null, specialties: 'degradê', notes: null, google_calendar_id: null, is_active: true },
      { tenant_id: 't1', name: 'Pedro', role: 'barber', phone: null, specialties: null, notes: null, google_calendar_id: null, is_active: true },
    ];

    const prompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi(),
      booking: makeBooking(),
      services: emptyServices,
      barbers,
    });

    expect(prompt).toContain('- João (especialidades: degradê)');
    expect(prompt).toContain('- Pedro');
  });

  it('respeita os poderes configurados (pode vs não pode)', () => {
    const canPrompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi({ can_auto_schedule: true, can_negotiate_price: true }),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });
    const cannotPrompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi({ can_auto_schedule: false, can_negotiate_price: false }),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(canPrompt).toContain('✅ Você PODE criar agendamentos diretamente.');
    expect(canPrompt).toContain('✅ Você pode negociar preço');
    expect(cannotPrompt).toContain('❌ Você NÃO pode criar agendamentos sem confirmação humana.');
    expect(cannotPrompt).toContain('❌ NÃO negocie preço.');
  });

  it('inclui tópicos proibidos e palavras de escalação quando definidos', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi({
        forbidden_topics: ['política', 'religião'],
        escalation_keywords: ['gerente', 'reclamação'],
      }),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('Jamais fale sobre: política, religião.');
    expect(prompt).toContain('Se o cliente usar as palavras [gerente, reclamação]');
  });

  it('usa os valores das regras de agendamento', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi(),
      booking: makeBooking({
        min_booking_notice_minutes: 120,
        max_booking_notice_days: 45,
        buffer_between_appointments_minutes: 20,
        reschedule_limit: 3,
      }),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('Antecedência mínima: 120 minutos');
    expect(prompt).toContain('Antecedência máxima: 45 dias');
    expect(prompt).toContain('Intervalo entre atendimentos: 20 min');
    expect(prompt).toContain('Limite de reagendamentos: 3');
  });

  it('inclui blocos de signature_services e upsell quando informados', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi({
        signature_services: 'Corte executivo + lavagem premium',
        upsell_guidelines: 'Ofereça barba se o cliente pediu só corte',
      }),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('Serviços em destaque:');
    expect(prompt).toContain('Corte executivo + lavagem premium');
    expect(prompt).toContain('Orientação de upsell:');
    expect(prompt).toContain('Ofereça barba');
  });

  it('não exige todas as chaves para gerar o prompt', () => {
    const prompt = buildSystemPrompt({
      profile: makeProfile(),
      ai: makeAi(),
      booking: makeBooking(),
      services: emptyServices,
      barbers: emptyBarbers,
    });

    expect(prompt).toContain('# IDENTIDADE');
    expect(prompt).toContain('# SEUS PODERES');
    expect(prompt).toContain('# SAÍDA');
  });
});
