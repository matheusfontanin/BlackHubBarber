import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY')!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(init.headers || {}) },
  });
}

async function resolveUser(authHeader: string | null): Promise<{ id: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  // Usa o ANON key para criar um client com o JWT do usuário e validar o token
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id };
}

async function isTenantMember(userId: string, tenantId: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from('tenant_members')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) {
    console.error('tenant_members check failed', error);
    return false;
  }
  return !!data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const user = await resolveUser(req.headers.get('Authorization'));
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const { tenantId, phoneNumber } = await req.json();
    if (!tenantId || !phoneNumber) {
      return json({ error: 'tenantId and phoneNumber required' }, { status: 400 });
    }

    if (!(await isTenantMember(user.id, tenantId))) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const evolutionResponse = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        instanceName: `barber-${tenantId}`,
        token: `token-${tenantId}`,
        qrcode: true,
        webhook: `${SUPABASE_URL}/functions/v1/n8n-webhook`,
        webhook_by_events: false,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'CONNECTION_UPDATE'],
      }),
    });

    if (!evolutionResponse.ok) {
      const detail = await evolutionResponse.text();
      console.error('Evolution create failed', detail);
      return json({ error: 'Failed to create Evolution instance' }, { status: 502 });
    }

    const evolutionData = await evolutionResponse.json();
    const instanceId: string = evolutionData.instance?.instanceName ?? `barber-${tenantId}`;
    const qrCode: string | undefined = evolutionData.qrcode?.base64 ?? evolutionData.qrcode;

    await adminClient
      .from('tenant_business_profile')
      .upsert({ tenant_id: tenantId, whatsapp_number: phoneNumber, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id' });

    return json({ qrCode, instanceId });
  } catch (error) {
    console.error('Error in evolution-connect:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
});
