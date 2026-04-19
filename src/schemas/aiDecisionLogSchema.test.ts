import { describe, it, expect } from 'vitest';
import {
  aiDecisionLogSchema,
  aiHealthMetricsSchema,
  aiOutcomeSchema,
} from './aiDecisionLogSchema';

describe('aiOutcomeSchema', () => {
  it('aceita os 5 outcomes válidos', () => {
    const valid = ['replied', 'tool_call', 'escalated', 'error', 'no_response'];
    for (const v of valid) expect(aiOutcomeSchema.parse(v)).toBe(v);
  });

  it('rejeita outcome inválido', () => {
    expect(() => aiOutcomeSchema.parse('unknown')).toThrow();
  });
});

describe('aiDecisionLogSchema', () => {
  const base = {
    id: '11111111-1111-4111-8111-111111111111',
    tenant_id: '22222222-2222-4222-8222-222222222222',
    conversation_id: null,
    message_id: null,
    system_prompt_snapshot: null,
    user_message: null,
    conversation_history: null,
    model: 'claude-opus-4-6',
    response_text: null,
    tool_calls: null,
    reasoning: null,
    tokens_input: 0,
    tokens_output: 0,
    cost_usd: 0,
    latency_ms: null,
    outcome: 'replied',
    error_message: null,
    created_at: '2026-04-19T00:00:00Z',
  };

  it('parse válido com campos mínimos', () => {
    const parsed = aiDecisionLogSchema.parse(base);
    expect(parsed.model).toBe('claude-opus-4-6');
    expect(parsed.tokens_input).toBe(0);
  });

  it('parse com tool_calls', () => {
    const parsed = aiDecisionLogSchema.parse({
      ...base,
      tool_calls: [
        {
          name: 'create_appointment',
          arguments: { date: '2026-05-01' },
          result: { ok: true },
        },
      ],
    });
    expect(parsed.tool_calls?.[0].name).toBe('create_appointment');
  });

  it('rejeita tenant_id não-uuid', () => {
    expect(() => aiDecisionLogSchema.parse({ ...base, tenant_id: 'not-a-uuid' })).toThrow();
  });

  it('rejeita tokens_input negativo', () => {
    expect(() => aiDecisionLogSchema.parse({ ...base, tokens_input: -1 })).toThrow();
  });
});

describe('aiHealthMetricsSchema', () => {
  it('parse de saída válida da RPC', () => {
    const parsed = aiHealthMetricsSchema.parse({
      period_days: 30,
      since: '2026-03-20T00:00:00Z',
      total_messages: 142,
      total_cost_usd: 1.2345,
      avg_latency_ms: 850.5,
      p95_latency_ms: 2100,
      escalation_count: 3,
      error_count: 1,
      replied_count: 130,
      tool_call_count: 8,
      appointments_created_by_ai: 5,
      cost_by_day: [{ day: '2026-04-18', cost: 0.15, messages: 20 }],
      tools_usage: [{ name: 'create_appointment', uses: 5 }],
    });
    expect(parsed.total_messages).toBe(142);
    expect(parsed.cost_by_day).toHaveLength(1);
    expect(parsed.tools_usage[0].name).toBe('create_appointment');
  });

  it('aceita arrays vazios', () => {
    const parsed = aiHealthMetricsSchema.parse({
      period_days: 1,
      since: '2026-04-18T00:00:00Z',
      total_messages: 0,
      total_cost_usd: 0,
      avg_latency_ms: 0,
      p95_latency_ms: 0,
      escalation_count: 0,
      error_count: 0,
      replied_count: 0,
      tool_call_count: 0,
      appointments_created_by_ai: 0,
      cost_by_day: [],
      tools_usage: [],
    });
    expect(parsed.cost_by_day).toEqual([]);
  });
});
