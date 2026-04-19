import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AI_LOG_SHARED_SECRET = Deno.env.get('AI_LOG_SHARED_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ai-log-secret',
};

// deno-lint-ignore no-explicit-any
type AnyObj = Record<string, any>;

function json(body: AnyObj, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(init.headers || {}) },
  });
}

const VALID_OUTCOMES = new Set(['replied', 'tool_call', 'escalated', 'error', 'no_response']);

function validatePayload(p: AnyObj): string | null {
  if (!p.tenant_id || typeof p.tenant_id !== 'string') return 'tenant_id is required';
  if (!p.model || typeof p.model !== 'string') return 'model is required';
  if (p.outcome && !VALID_OUTCOMES.has(p.outcome)) {
    return `outcome must be one of ${[...VALID_OUTCOMES].join(', ')}`;
  }
  return null;
}

function isAuthorized(req: Request): boolean {
  // Dois caminhos: service-role Bearer (uso interno N8N) ou shared secret header.
  const auth = req.headers.get('Authorization') ?? '';
  if (auth.startsWith('Bearer ') && auth.slice(7).trim() === SUPABASE_SERVICE_KEY) return true;

  const secret = req.headers.get('x-ai-log-secret');
  if (AI_LOG_SHARED_SECRET && secret && secret === AI_LOG_SHARED_SECRET) return true;

  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  if (!isAuthorized(req)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as AnyObj;
    const validationError = validatePayload(payload);
    if (validationError) return json({ error: validationError }, { status: 400 });

    const row = {
      tenant_id: payload.tenant_id,
      conversation_id: payload.conversation_id ?? null,
      message_id: payload.message_id ?? null,
      system_prompt_snapshot: payload.system_prompt_snapshot ?? null,
      user_message: payload.user_message ?? null,
      conversation_history: payload.conversation_history ?? null,
      model: payload.model,
      response_text: payload.response_text ?? null,
      tool_calls: payload.tool_calls ?? null,
      reasoning: payload.reasoning ?? null,
      tokens_input: typeof payload.tokens_input === 'number' ? payload.tokens_input : 0,
      tokens_output: typeof payload.tokens_output === 'number' ? payload.tokens_output : 0,
      cost_usd: typeof payload.cost_usd === 'number' ? payload.cost_usd : 0,
      latency_ms: typeof payload.latency_ms === 'number' ? payload.latency_ms : null,
      outcome: payload.outcome ?? 'replied',
      error_message: payload.error_message ?? null,
    };

    const { data, error } = await supabase
      .from('ai_decision_logs')
      .insert(row)
      .select('id')
      .single();

    if (error) {
      console.error('ai_decision_logs insert failed', error);
      return json({ error: 'failed to insert log', detail: error.message }, { status: 500 });
    }

    return json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error in ai-log:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
});
