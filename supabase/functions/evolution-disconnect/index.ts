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

    const instanceName = `barber-${tenantId}`;

    // Logout from Evolution API
    const logoutResponse = await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_KEY,
      },
    });

    // Delete instance
    await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_KEY,
      },
    });

    // Clear WhatsApp number from profile
    await supabase
      .from('tenant_business_profile')
      .update({ whatsapp_number: null })
      .eq('tenant_id', tenantId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in evolution-disconnect:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});