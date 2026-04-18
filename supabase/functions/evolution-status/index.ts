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
    const { tenantId } = await req.json();

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenantId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get instance name from profile
    const { data: profile } = await supabase
      .from('tenant_business_profile')
      .select('whatsapp_number')
      .eq('tenant_id', tenantId)
      .single();

    if (!profile?.whatsapp_number) {
      return new Response(JSON.stringify({ status: 'disconnected' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const instanceName = `barber-${tenantId}`;

    // Check Evolution API status
    const statusResponse = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
      headers: {
        'apikey': EVOLUTION_KEY,
      },
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({ status: 'error' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const statusData = await statusResponse.json();
    const status = statusData.instance?.state === 'open' ? 'connected' : 'disconnected';

    return new Response(JSON.stringify({
      status,
      lastSeen: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in evolution-status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});