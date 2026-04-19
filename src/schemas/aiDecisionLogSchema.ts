import { z } from 'zod';

export const aiOutcomeSchema = z.enum([
  'replied',
  'tool_call',
  'escalated',
  'error',
  'no_response',
]);
export type AIOutcome = z.infer<typeof aiOutcomeSchema>;

export const aiToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()).optional(),
  result: z.unknown().optional(),
});
export type AIToolCall = z.infer<typeof aiToolCallSchema>;

export const aiDecisionLogSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable(),
  message_id: z.string().uuid().nullable(),

  system_prompt_snapshot: z.string().nullable(),
  user_message: z.string().nullable(),
  conversation_history: z.unknown().nullable(),

  model: z.string(),
  response_text: z.string().nullable(),
  tool_calls: z.array(aiToolCallSchema).nullable(),
  reasoning: z.string().nullable(),

  tokens_input: z.number().int().nonnegative(),
  tokens_output: z.number().int().nonnegative(),
  cost_usd: z.number().nonnegative().nullable(),
  latency_ms: z.number().int().nonnegative().nullable(),

  outcome: aiOutcomeSchema.nullable(),
  error_message: z.string().nullable(),

  created_at: z.string(),
});
export type AIDecisionLog = z.infer<typeof aiDecisionLogSchema>;

export const aiHealthMetricsSchema = z.object({
  period_days: z.number().int(),
  since: z.string(),
  total_messages: z.number().int().nonnegative(),
  total_cost_usd: z.number().nonnegative(),
  avg_latency_ms: z.number().nonnegative(),
  p95_latency_ms: z.number().nonnegative(),
  escalation_count: z.number().int().nonnegative(),
  error_count: z.number().int().nonnegative(),
  replied_count: z.number().int().nonnegative(),
  tool_call_count: z.number().int().nonnegative(),
  appointments_created_by_ai: z.number().int().nonnegative(),
  cost_by_day: z.array(
    z.object({
      day: z.string(),
      cost: z.number().nonnegative(),
      messages: z.number().int().nonnegative(),
    }),
  ),
  tools_usage: z.array(
    z.object({
      name: z.string(),
      uses: z.number().int().nonnegative(),
    }),
  ),
});
export type AIHealthMetrics = z.infer<typeof aiHealthMetricsSchema>;
