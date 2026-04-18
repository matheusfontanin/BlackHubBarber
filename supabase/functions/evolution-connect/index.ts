import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { tenantId, phoneNumber } = await req.json();

    if (!tenantId || !phoneNumber) {
      return new Response(JSON.stringify({ error: 'tenantId and phoneNumber required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate tenant access
    const { data: member } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', req.headers.get('Authorization')?.replace('Bearer ', ''))
      .single();

    if (!member) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Create Evolution API instance
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
      throw new Error('Failed to create Evolution instance');
    }

    const evolutionData = await evolutionResponse.json();
    const instanceId = evolutionData.instance.instanceName;

    // Store instance info in tenant_business_profile
    await supabase
      .from('tenant_business_profile')
      .upsert({
        tenant_id: tenantId,
        whatsapp_number: phoneNumber,
        // Add instance_id field if needed
      });

    return new Response(JSON.stringify({
      qrCode: evolutionData.qrcode,
      instanceId,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in evolution-connect:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});