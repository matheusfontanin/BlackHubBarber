/**
 * Dev Seed Service — BlackHub Barber
 *
 * Injects a realistic set of test data into the current tenant so that
 * the UI has something to show for evaluation. Safe to call multiple times —
 * it uses name/phone-based checks before inserting.
 *
 * Covers:
 *  - barbers (3)
 *  - services (5) — only if missing
 *  - clients (6)
 *  - appointments (past + today + upcoming, across all barbers)
 *  - conversations + messages (3 threads)
 *  - customer_memories (a few per client)
 */

import { supabase } from '@/lib/supabase/client';
import { addDays, subDays, setHours, setMinutes, addMinutes } from 'date-fns';

export interface SeedReport {
  barbers:       number;
  services:      number;
  clients:       number;
  appointments:  number;
  conversations: number;
  messages:      number;
  memories:      number;
}

const BARBER_SEED = [
  { name: 'Rafael Santos', role: 'Barbeiro Sênior', phone: '(11) 98877-6600', specialties: 'Degradê, barba tradicional', is_active: true },
  { name: 'Bruno Costa',   role: 'Barbeiro',        phone: '(11) 98877-6611', specialties: 'Corte social, navalhado', is_active: true },
  { name: 'Carlos Silva',  role: 'Aprendiz',        phone: '(11) 98877-6622', specialties: 'Corte infantil, hidratação', is_active: true },
] as const;

const SERVICE_SEED = [
  { name: 'Corte Masculino',    price: 40, duration_minutes: 30, description: 'Corte com máquina e tesoura.' },
  { name: 'Corte + Barba',      price: 70, duration_minutes: 60, description: 'Combo completo para cabelo e barba.' },
  { name: 'Barba Desenhada',    price: 35, duration_minutes: 30, description: 'Modelagem e acabamento na navalha.' },
  { name: 'Corte Infantil',     price: 30, duration_minutes: 30, description: 'Corte acolhedor para crianças.' },
  { name: 'Hidratação Capilar', price: 50, duration_minutes: 45, description: 'Tratamento profundo para o cabelo.' },
] as const;

const CLIENT_SEED = [
  {
    name: 'João Silva',      phone: '(11) 99999-1111', email: 'joao.silva@test.com',
    notes: 'Cliente fiel, prefere corte degradê.',
    preferences: { corte_preferido: 'Degradê médio', barbeiro_favorito: 'Rafael Santos', observacoes: 'Gosta de conversar sobre futebol.' },
    tags: ['VIP', 'Fiel'], total_visits: 18, total_spent: 1120, loyalty_points: 180,
  },
  {
    name: 'Pedro Almeida',   phone: '(11) 99999-2222', email: 'pedro.almeida@test.com',
    notes: 'Alergia a loções com álcool.',
    preferences: { corte_preferido: 'Social', barba: 'Bem aparada', alergias: ['álcool em gel'], observacoes: 'Evitar produtos com fragrância.' },
    tags: ['Atenção'], total_visits: 9, total_spent: 540, loyalty_points: 90,
  },
  {
    name: 'Marcos Oliveira', phone: '(11) 99999-3333', email: 'marcos.oliveira@test.com',
    notes: 'Sempre vem nas sextas à tarde.',
    preferences: { corte_preferido: 'Corte + Barba', barbeiro_favorito: 'Bruno Costa', produtos: ['Pomada modeladora'] },
    tags: ['Recorrente'], total_visits: 22, total_spent: 1540, loyalty_points: 220,
  },
  {
    name: 'Lucas Ferreira',  phone: '(11) 99999-4444', email: 'lucas.ferreira@test.com',
    notes: 'Cliente VIP — sempre agenda com antecedência.',
    preferences: { corte_preferido: 'Navalhado', barbeiro_favorito: 'Rafael Santos' },
    tags: ['VIP'], total_visits: 30, total_spent: 2400, loyalty_points: 300,
  },
  {
    name: 'Diego Mendes',    phone: '(11) 99999-5555', email: 'diego.mendes@test.com',
    notes: 'Aniversário próximo — enviar promoção.',
    preferences: { corte_preferido: 'Curto', observacoes: 'Estudante, prefere horários pela manhã.' },
    tags: ['Aniversariante'], total_visits: 5, total_spent: 200, loyalty_points: 50,
  },
  {
    name: 'André Costa',     phone: '(11) 99999-6666', email: 'andre.costa@test.com',
    notes: 'Novo cliente, veio pelo Instagram.',
    preferences: {},
    tags: ['Novo'], total_visits: 1, total_spent: 40, loyalty_points: 10,
  },
] as const;

type BarberRow = { id: string; name: string };
type ServiceRow = { id: string; name: string; price: number; duration_minutes: number };
type ClientRow = { id: string; name: string; phone: string };

/** Recognize Postgres errors we can safely skip (missing table / RLS block). */
function isSoftError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  // 42P01 = undefined_table, 42501 = insufficient_privilege (RLS)
  return code === '42P01' || code === '42501';
}

/**
 * Upsert barbers by (tenant_id, name). Returns the resulting list.
 * If the `barbers` table doesn't exist or RLS blocks access, returns [].
 */
async function ensureBarbers(tenantId: string): Promise<BarberRow[]> {
  const { data: existing, error: readErr } = await supabase
    .from('barbers')
    .select('id, name')
    .eq('tenant_id', tenantId);
  if (readErr) {
    if (isSoftError(readErr)) {
      console.warn('[seed] barbers table unavailable, skipping:', readErr);
      return [];
    }
    throw readErr;
  }
  const byName = new Map<string, BarberRow>((existing ?? []).map(b => [b.name, b]));
  const missing = BARBER_SEED.filter(b => !byName.has(b.name));
  if (missing.length > 0) {
    const { data: inserted, error } = await supabase
      .from('barbers')
      .insert(missing.map(b => ({ ...b, tenant_id: tenantId })))
      .select('id, name');
    if (error) {
      if (isSoftError(error)) {
        console.warn('[seed] could not insert barbers, skipping:', error);
        return Array.from(byName.values());
      }
      throw error;
    }
    for (const row of inserted ?? []) byName.set(row.name, row);
  }
  return BARBER_SEED.map(b => byName.get(b.name)!).filter(Boolean);
}

/** Ensure the seed services exist. Returns the resulting list. */
async function ensureServices(tenantId: string): Promise<ServiceRow[]> {
  const { data: existing, error: readErr } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('tenant_id', tenantId);
  if (readErr) throw readErr;
  const byName = new Map<string, ServiceRow>((existing ?? []).map(s => [s.name, s]));
  const missing = SERVICE_SEED.filter(s => !byName.has(s.name));
  if (missing.length > 0) {
    const { data: inserted, error } = await supabase
      .from('services')
      .insert(missing.map(s => ({ ...s, tenant_id: tenantId, is_active: true })))
      .select('id, name, price, duration_minutes');
    if (error) throw error;
    for (const row of inserted ?? []) byName.set(row.name, row);
  }
  return SERVICE_SEED.map(s => byName.get(s.name)!).filter(Boolean);
}

/** Ensure seed clients exist (by phone). Returns the resulting list. */
async function ensureClients(tenantId: string): Promise<ClientRow[]> {
  const { data: existing, error: readErr } = await supabase
    .from('clients')
    .select('id, name, phone')
    .eq('tenant_id', tenantId);
  if (readErr) throw readErr;
  const byPhone = new Map<string, ClientRow>((existing ?? []).map(c => [c.phone, c]));
  const missing = CLIENT_SEED.filter(c => !byPhone.has(c.phone));
  if (missing.length > 0) {
    const payload = missing.map(c => ({
      tenant_id: tenantId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      preferences: c.preferences,
      tags: c.tags,
      total_visits: c.total_visits,
      total_spent: c.total_spent,
      loyalty_points: c.loyalty_points,
      source: 'manual',
    }));
    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(payload)
      .select('id, name, phone');
    if (error) throw error;
    for (const row of inserted ?? []) byPhone.set(row.phone, row);
  }
  return CLIENT_SEED.map(c => byPhone.get(c.phone)!).filter(Boolean);
}

/** Build a datetime at (day, h:m). */
function at(base: Date, h: number, m = 0): Date {
  return setMinutes(setHours(base, h), m);
}

/**
 * Seed appointments spread across past and future days, rotating through
 * barbers and clients. Each call inserts a fresh batch (no dedupe).
 */
async function seedAppointments(
  tenantId: string,
  barbers: BarberRow[],
  services: ServiceRow[],
  clients: ClientRow[],
): Promise<number> {
  if (services.length === 0 || clients.length === 0) return 0;

  const today = new Date();
  // Tuples: [daysOffset, hour, minute, clientIdx, serviceIdx, barberIdx, status]
  const spec: Array<[number, number, number, number, number, number, string]> = [
    // ── Past history (concluded / canceled / no_show) ──
    [-14,  9,  0, 0, 0, 0, 'completed'],
    [-10, 15, 30, 1, 1, 1, 'completed'],
    [-8,  11,  0, 2, 0, 2, 'completed'],
    [-6,  14,  0, 3, 1, 0, 'completed'],
    [-5,  10,  0, 4, 3, 2, 'completed'],
    [-4,  16,  0, 5, 0, 1, 'no_show'],
    [-3,   9, 30, 0, 2, 0, 'completed'],
    [-2,  13,  0, 1, 0, 1, 'canceled'],
    [-1,  17,  0, 2, 4, 2, 'completed'],

    // ── Today ──
    [ 0,   9,  0, 3, 0, 0, 'completed'],
    [ 0,  10, 30, 4, 1, 0, 'in_progress'],
    [ 0,  14,  0, 0, 2, 1, 'confirmed'],
    [ 0,  15, 30, 5, 3, 2, 'scheduled'],
    [ 0,  17,  0, 1, 1, 1, 'scheduled'],

    // ── Upcoming days ──
    [ 1,   9, 30, 2, 0, 0, 'confirmed'],
    [ 1,  11,  0, 3, 1, 1, 'scheduled'],
    [ 1,  16,  0, 4, 4, 2, 'scheduled'],
    [ 2,  10,  0, 5, 0, 0, 'scheduled'],
    [ 2,  14, 30, 0, 1, 1, 'confirmed'],
    [ 3,   9,  0, 1, 2, 2, 'scheduled'],
    [ 3,  15,  0, 2, 0, 0, 'scheduled'],
    [ 4,  11,  0, 3, 1, 1, 'confirmed'],
    [ 5,  10, 30, 4, 3, 0, 'scheduled'],
    [ 7,  14,  0, 5, 0, 2, 'scheduled'],
    [10,  16,  0, 0, 1, 0, 'scheduled'],
  ];

  const rows = spec.map(([offset, h, m, ci, si, bi, status]) => {
    const baseDay = offset < 0 ? subDays(today, -offset) : addDays(today, offset);
    const start = at(baseDay, h, m);
    const svc = services[si % services.length];
    const end = addMinutes(start, svc.duration_minutes);
    const row: Record<string, unknown> = {
      tenant_id: tenantId,
      client_id: clients[ci % clients.length].id,
      service_id: svc.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status,
      price: svc.price,
      source: 'manual',
    };
    if (barbers.length > 0) {
      row.barber_id = barbers[bi % barbers.length].id;
    }
    return row;
  });

  const { error, count } = await supabase
    .from('appointments')
    .insert(rows, { count: 'exact' });
  if (error) throw error;
  return count ?? rows.length;
}

interface ConvSpec {
  clientIdx: number;
  channel: 'whatsapp' | 'instagram';
  status: 'active' | 'closed' | 'escalated';
  hoursAgoStart: number;
  messages: Array<{ role: 'client' | 'ai' | 'owner'; content: string; minutesOffset: number }>;
}

const CONVERSATION_SEED: ConvSpec[] = [
  {
    clientIdx: 0, channel: 'whatsapp', status: 'active', hoursAgoStart: 2,
    messages: [
      { role: 'client', content: 'Oi! Tem horário amanhã à tarde pro Rafael?', minutesOffset: 0 },
      { role: 'ai',     content: 'Olá, João! Claro 😊 O Rafael tem horário amanhã às 14:00 ou 15:30. Qual fica melhor pra você?', minutesOffset: 1 },
      { role: 'client', content: '15:30 perfeito. Corte + barba igual da última vez.', minutesOffset: 3 },
      { role: 'ai',     content: 'Fechado! Agendei pra você: amanhã às 15:30, Corte + Barba com o Rafael. Te mando um lembrete na manhã do dia. 💈', minutesOffset: 4 },
      { role: 'client', content: 'Valeu!', minutesOffset: 5 },
      { role: 'ai',     content: 'Até amanhã, João! 👋', minutesOffset: 5 },
    ],
  },
  {
    clientIdx: 1, channel: 'whatsapp', status: 'escalated', hoursAgoStart: 5,
    messages: [
      { role: 'client', content: 'Oi, vocês atendem no sábado de manhã?', minutesOffset: 0 },
      { role: 'ai',     content: 'Oi Pedro! Sim, abrimos sábado das 09:00 às 14:00. Posso já agendar pra você?', minutesOffset: 1 },
      { role: 'client', content: 'Eu uso um produto específico por causa de alergia, vocês têm?', minutesOffset: 4 },
      { role: 'ai',     content: 'Deixa eu confirmar com o pessoal da barbearia e já te retorno, tá?', minutesOffset: 5 },
      { role: 'owner',  content: 'Oi Pedro, aqui é o dono. Sim, temos a linha hipoalergênica. Pode trazer tranquilo!', minutesOffset: 20 },
      { role: 'client', content: 'Show, obrigado! Agenda pra sábado 10:00 então.', minutesOffset: 25 },
      { role: 'owner',  content: 'Agendado! Até sábado, Pedro.', minutesOffset: 26 },
    ],
  },
  {
    clientIdx: 2, channel: 'instagram', status: 'closed', hoursAgoStart: 26,
    messages: [
      { role: 'client', content: 'Fala! Quanto tá o combo corte + barba?', minutesOffset: 0 },
      { role: 'ai',     content: 'E aí Marcos! Combo Corte + Barba sai R$ 70. Duração média de 60 minutos. Quer que eu veja um horário?', minutesOffset: 1 },
      { role: 'client', content: 'Pode ser sexta 16h', minutesOffset: 8 },
      { role: 'ai',     content: 'Perfeito! Agendei sexta às 16:00 com o Bruno. Se precisar remarcar, é só me avisar 👍', minutesOffset: 9 },
      { role: 'client', content: 'Fechou', minutesOffset: 10 },
    ],
  },
  {
    clientIdx: 5, channel: 'whatsapp', status: 'active', hoursAgoStart: 0.5,
    messages: [
      { role: 'client', content: 'Oi, vi vocês no Instagram. É a primeira vez que vou. Pode agendar pra mim?', minutesOffset: 0 },
      { role: 'ai',     content: 'Bem-vindo, André! 🎉 Que legal ter você com a gente. Pra qual serviço você gostaria de agendar? Temos Corte Masculino, Corte + Barba, Barba Desenhada e outros.', minutesOffset: 1 },
      { role: 'client', content: 'Corte masculino mesmo', minutesOffset: 2 },
      { role: 'ai',     content: 'Perfeito! Tenho horários hoje às 17:00, amanhã às 10:30 ou 14:00. Qual prefere?', minutesOffset: 3 },
    ],
  },
];

async function seedConversations(
  tenantId: string,
  clients: ClientRow[],
): Promise<{ conversations: number; messages: number }> {
  if (clients.length === 0) return { conversations: 0, messages: 0 };
  const now = new Date();

  let convCount = 0;
  let msgCount = 0;

  for (const spec of CONVERSATION_SEED) {
    const client = clients[spec.clientIdx % clients.length];
    if (!client) continue;
    const startedAt = new Date(now.getTime() - spec.hoursAgoStart * 60 * 60 * 1000);
    const lastMsg = spec.messages[spec.messages.length - 1];
    const lastAt = new Date(startedAt.getTime() + lastMsg.minutesOffset * 60 * 1000);

    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        client_id: client.id,
        channel: spec.channel,
        status: spec.status,
        last_message_at: lastAt.toISOString(),
        created_at: startedAt.toISOString(),
      })
      .select('id')
      .single();
    if (convErr) throw convErr;
    convCount++;

    const msgRows = spec.messages.map(m => ({
      tenant_id: tenantId,
      conversation_id: conv.id,
      role: m.role,
      content: m.content,
      is_read: m.role !== 'client',
      created_at: new Date(startedAt.getTime() + m.minutesOffset * 60 * 1000).toISOString(),
      metadata: {},
    }));
    const { error: msgErr } = await supabase.from('messages').insert(msgRows);
    if (msgErr) throw msgErr;
    msgCount += msgRows.length;
  }

  return { conversations: convCount, messages: msgCount };
}

async function seedMemories(
  tenantId: string,
  clients: ClientRow[],
): Promise<number> {
  if (clients.length === 0) return 0;
  const memories = [
    { ci: 0, type: 'preference', content: 'Prefere corte degradê médio com máquina no 2.', source: 'ai' },
    { ci: 0, type: 'behavior',   content: 'Costuma vir a cada 3 semanas, sempre no fim da tarde.', source: 'ai' },
    { ci: 0, type: 'note',       content: 'Torce pro Corinthians — sempre puxa conversa sobre futebol.', source: 'manual' },
    { ci: 1, type: 'preference', content: 'Alergia a loções com álcool e produtos perfumados.', source: 'ai' },
    { ci: 1, type: 'summary',    content: 'Cliente cuidadoso com a pele, prefere produtos hipoalergênicos.', source: 'ai' },
    { ci: 2, type: 'preference', content: 'Gosta do combo Corte + Barba com o Bruno.', source: 'ai' },
    { ci: 2, type: 'behavior',   content: 'Agenda sempre nas sextas à tarde.', source: 'ai' },
    { ci: 3, type: 'note',       content: 'Cliente VIP — prioridade em datas cheias.', source: 'manual' },
    { ci: 4, type: 'behavior',   content: 'Aniversário se aproximando — oferecer brinde.', source: 'ai' },
  ];
  const rows = memories
    .map(m => {
      const client = clients[m.ci];
      if (!client) return null;
      return {
        tenant_id: tenantId,
        client_id: client.id,
        memory_type: m.type,
        content: m.content,
        source: m.source,
        relevance_score: 0.8,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return 0;
  const { error } = await supabase.from('customer_memories').insert(rows);
  if (error) {
    // Table may not exist / RLS may block — log but don't fail the whole seed
    console.warn('[seed] could not seed customer_memories:', error);
    return 0;
  }
  return rows.length;
}

/** Tag an unknown thrown value with a step label so the UI can surface where it broke. */
function tagError(step: string, err: unknown): Error {
  // Supabase errors are plain objects: { message, details, hint, code }
  if (err instanceof Error) {
    const e = new Error(`[${step}] ${err.message}`);
    (e as Error & { cause?: unknown }).cause = err;
    return e;
  }
  if (err && typeof err === 'object') {
    const pgErr = err as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [pgErr.message, pgErr.details, pgErr.hint, pgErr.code ? `(${pgErr.code})` : null]
      .filter(Boolean)
      .join(' — ');
    const e = new Error(`[${step}] ${parts || JSON.stringify(err)}`);
    (e as Error & { cause?: unknown }).cause = err;
    return e;
  }
  return new Error(`[${step}] ${String(err)}`);
}

/**
 * Top-level seed entry point. Idempotent for barbers / services / clients
 * (checked by natural key). Appointments / conversations / messages are
 * always appended — re-running will create duplicates, which is fine in dev.
 */
export async function seedDevTestData(tenantId: string): Promise<SeedReport> {
  if (!tenantId) throw new Error('seedDevTestData: tenantId required');

  let barbers: BarberRow[] = [];
  let services: ServiceRow[] = [];
  let clients: ClientRow[] = [];
  let appointments = 0;
  let conversations = 0;
  let messages = 0;
  let memories = 0;

  try { barbers  = await ensureBarbers(tenantId);  } catch (e) { throw tagError('ensureBarbers', e); }
  try { services = await ensureServices(tenantId); } catch (e) { throw tagError('ensureServices', e); }
  try { clients  = await ensureClients(tenantId);  } catch (e) { throw tagError('ensureClients', e); }

  try {
    appointments = await seedAppointments(tenantId, barbers, services, clients);
  } catch (e) { throw tagError('seedAppointments', e); }

  try {
    const res = await seedConversations(tenantId, clients);
    conversations = res.conversations;
    messages = res.messages;
  } catch (e) { throw tagError('seedConversations', e); }

  try { memories = await seedMemories(tenantId, clients); } catch (e) { throw tagError('seedMemories', e); }

  return {
    barbers: barbers.length,
    services: services.length,
    clients: clients.length,
    appointments,
    conversations,
    messages,
    memories,
  };
}
