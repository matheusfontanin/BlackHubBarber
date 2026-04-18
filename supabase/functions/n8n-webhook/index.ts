import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const webhookData = await req.json();

    // Extract tenant from webhook data (assuming instance name contains tenant ID)
    const instanceName = webhookData.instance;
    const tenantId = instanceName?.replace('barber-', '');

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Invalid instance name' }), { status: 400 });
    }

    // Validate tenant exists
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
    }

    // Forward to N8N
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
      body: JSON.stringify({
        ...webhookData,
        tenantId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      console.error('N8N webhook failed:', await n8nResponse.text());
    }

    // Store message in database if it's a message event
    if (webhookData.event === 'messages.upsert') {
      const message = webhookData.data.message;

      await supabase
        .from('messages')
        .insert({
          tenant_id: tenantId,
          external_id: message.id,
          from_number: message.from,
          to_number: message.to,
          content: message.body || message.caption || '',
          message_type: message.type,
          timestamp: new Date(message.timestamp * 1000),
          is_from_me: message.fromMe,
          raw_data: message,
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in n8n-webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});