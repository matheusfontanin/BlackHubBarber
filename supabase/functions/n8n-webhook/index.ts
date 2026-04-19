import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// deno-lint-ignore no-explicit-any
type AnyObj = Record<string, any>;

function json(body: AnyObj, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(init.headers || {}) },
  });
}

function mapRole(raw: string | undefined): 'client' | 'ai' | 'owner' {
  if (raw === 'ai') return 'ai';
  if (raw === 'owner') return 'owner';
  return 'client';
}

async function findOrCreateClient(tenantId: string, phone: string, name?: string | null): Promise<string | null> {
  const normalized = phone.replace(/[^\d+]/g, '');
  const { data: existing, error: selErr } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('phone', normalized)
    .maybeSingle();

  if (selErr) {
    console.error('clients select failed', selErr);
    return null;
  }
  if (existing) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from('clients')
    .insert({
      tenant_id: tenantId,
      name: name ?? 'Cliente WhatsApp',
      phone: normalized,
      source: 'whatsapp',
    })
    .select('id')
    .single();

  if (insErr) {
    console.error('clients insert failed', insErr);
    return null;
  }
  return created.id;
}

async function findOrCreateConversation(
  tenantId: string,
  clientId: string,
  channel: 'whatsapp' | 'instagram',
): Promise<string | null> {
  const { data: existing, error: selErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .eq('channel', channel)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selErr) {
    console.error('conversations select failed', selErr);
    return null;
  }
  if (existing) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from('conversations')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      channel,
      status: 'active',
    })
    .select('id')
    .single();

  if (insErr) {
    console.error('conversations insert failed', insErr);
    return null;
  }
  return created.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const payload = (await req.json()) as AnyObj;

    // Preferimos tenantId explícito; fallback: inferir do instance name barber-<uuid>
    const tenantId: string | undefined =
      payload.tenantId ?? (payload.instance ? String(payload.instance).replace(/^barber-/, '') : undefined);

    if (!tenantId) {
      return json({ error: 'tenantId or instance required' }, { status: 400 });
    }

    const { data: tenant } = await supabase.from('tenants').select('id').eq('id', tenantId).maybeSingle();
    if (!tenant) {
      return json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Forward assíncrono para o N8N (sem bloquear o insert)
    if (N8N_WEBHOOK_URL) {
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({
          ...payload,
          tenantId,
          forwardedAt: new Date().toISOString(),
        }),
      }).catch((err) => console.error('forward to n8n failed', err));
    }

    // Eventos que devem virar uma mensagem no banco
    const isMessageEvent =
      payload.event === 'messages.upsert' ||
      payload.event === 'message.new' ||
      payload.type === 'message';

    if (!isMessageEvent) {
      return json({ success: true, stored: false });
    }

    const msg: AnyObj = payload.message ?? payload.data?.message ?? payload.data ?? payload;
    const content: string = msg.content ?? msg.body ?? msg.caption ?? '';
    const phone: string | undefined = msg.from ?? msg.phone ?? msg.sender?.phone;
    const senderName: string | undefined = msg.senderName ?? msg.sender?.name;
    const role = mapRole(msg.role ?? (msg.fromMe ? 'ai' : 'client'));
    const channel: 'whatsapp' | 'instagram' = (payload.channel ?? 'whatsapp') === 'instagram' ? 'instagram' : 'whatsapp';

    if (!phone || !content) {
      return json({ error: 'phone and content required on message event' }, { status: 400 });
    }

    const clientId = await findOrCreateClient(tenantId, phone, senderName);
    if (!clientId) return json({ error: 'failed to resolve client' }, { status: 500 });

    const conversationId = await findOrCreateConversation(tenantId, clientId, channel);
    if (!conversationId) return json({ error: 'failed to resolve conversation' }, { status: 500 });

    const metadata: AnyObj = {
      source: 'n8n',
      external_id: msg.id ?? null,
      message_type: msg.type ?? 'text',
      delivery_status: msg.deliveryStatus ?? msg.status ?? 'delivered',
      model: msg.model ?? null,
      tokens_in: msg.tokens_in ?? null,
      tokens_out: msg.tokens_out ?? null,
      cost_usd: msg.cost_usd ?? null,
      tool_calls: msg.tool_calls ?? null,
      reasoning: msg.reasoning ?? null,
      raw: msg,
    };

    const { error: insErr } = await supabase.from('messages').insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      role,
      content,
      metadata,
    });

    if (insErr) {
      console.error('messages insert failed', insErr);
      return json({ error: 'failed to store message' }, { status: 500 });
    }

    return json({ success: true, stored: true, conversationId });
  } catch (error) {
    console.error('Error in n8n-webhook:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
});
