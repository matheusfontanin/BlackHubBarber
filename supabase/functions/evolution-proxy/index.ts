/**
 * Edge Function: evolution-proxy
 *
 * Proxy seguro para a Evolution API.
 * A API key fica no servidor (secret do Supabase), nunca exposta no frontend.
 *
 * Endpoints suportados (passados via query param ?action=...):
 *   - create-instance  → POST /instance/create
 *   - get-qrcode       → GET  /instance/connect/:instanceName
 *   - connection-state → GET  /instance/connectionState/:instanceName
 *   - delete-instance  → DELETE /instance/delete/:instanceName
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Valida JWT do usuário via Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const requestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = url.searchParams.get('action') ?? requestBody.action;
    const instanceName = url.searchParams.get('instanceName') ?? requestBody.instanceName;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action param' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evoHeaders = {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_KEY,
    };

    let evoRes: Response;

    if (action === 'create-instance') {
      if (!instanceName) return badRequest(corsHeaders);
      evoRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: evoHeaders,
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });
    } else if (action === 'get-qrcode') {
      if (!instanceName) return badRequest(corsHeaders);
      evoRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: evoHeaders,
      });
    } else if (action === 'connection-state') {
      if (!instanceName) return badRequest(corsHeaders);
      evoRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: evoHeaders,
      });
    } else if (action === 'delete-instance') {
      if (!instanceName) return badRequest(corsHeaders);
      evoRes = await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: evoHeaders,
      });
    } else if (action === 'send-message') {
      const { tenant_id, conversation_id, message_id, to, text } = requestBody as Record<string, string>;

      if (!tenant_id || !conversation_id || !message_id || !to || !text) {
        return new Response(JSON.stringify({ error: 'Missing required payload fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: member, error: memberError } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      if (memberError || !member) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('whatsapp_instance_id')
        .eq('id', tenant_id)
        .single();

      if (tenantError || !tenant?.whatsapp_instance_id) {
        return new Response(JSON.stringify({ error: 'Tenant whatsapp instance not configured' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${tenant.whatsapp_instance_id}`, {
        method: 'POST',
        headers: evoHeaders,
        body: JSON.stringify({
          number: to,
          text,
        }),
      });

      const evoData = await evoRes.json().catch(() => ({}));
      const updatePayload = {
        delivery_status: evoRes.ok ? 'sent' : 'failed',
        raw_payload: evoData,
      };

      await supabase
        .from('messages')
        .update(updatePayload)
        .eq('id', message_id);

      if (!evoRes.ok) {
        return new Response(JSON.stringify({ ok: false, error: evoData?.error || 'Evolution send failed', data: evoData }), {
          status: evoRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true, data: evoData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await evoRes.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: evoRes.ok ? 200 : evoRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function badRequest(headers: Record<string, string>) {
  return new Response(JSON.stringify({ error: 'Missing instanceName param' }), {
    status: 400,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
