import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildSystemPrompt } from '../../../src/lib/ai/promptBuilder.ts'; // Note: This won't work in Deno, need to copy or adjust

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return new Response(JSON.stringify({ error: 'tenantId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch all required data
    const [profileRes, aiRes, bookingRes, servicesRes, barbersRes] = await Promise.all([
      supabase.from('tenant_business_profile').select('*').eq('tenant_id', tenantId).single(),
      supabase.from('tenant_ai_config').select('*').eq('tenant_id', tenantId).single(),
      supabase.from('tenant_booking_rules').select('*').eq('tenant_id', tenantId).single(),
      supabase.from('services').select('*').eq('tenant_id', tenantId).eq('is_active', true),
      supabase.from('tenant_members').select('*').eq('tenant_id', tenantId).eq('is_active', true),
    ]);

    if (profileRes.error || aiRes.error || bookingRes.error) {
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const context = {
      profile: profileRes.data,
      ai: aiRes.data,
      booking: bookingRes.data,
      services: servicesRes.data || [],
      barbers: barbersRes.data || [],
    };

    // Since we can't import from src in Deno, we'll inline a simplified version
    const prompt = buildPromptInline(context);

    return new Response(JSON.stringify({
      systemPrompt: prompt,
      lastUpdated: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error building prompt:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Inline simplified prompt builder for Deno
function buildPromptInline(ctx: any): string {
  return `
# IDENTIDADE
Você é ${ctx.ai.assistant_name || 'Assistente'}, assistente virtual da ${ctx.profile.trade_name}.

# SOBRE A BARBEARIA
${ctx.profile.description || 'Descrição não informada'}

# SERVIÇOS OFERECIDOS
${ctx.services.map((s: any) => `- ${s.name}: R$ ${s.price} (${s.duration_minutes} min)`).join('\n')}

# PERSONALIDADE
- Tom de voz: ${ctx.ai.tone_of_voice || 'profissional'}

# SEUS PODERES
${ctx.ai.can_auto_schedule ? '✅ Você PODE criar agendamentos diretamente.' : '❌ Você NÃO pode criar agendamentos sem confirmação humana.'}

# SAÍDA
Responda sempre de forma natural. Use tools quando necessário.
  `.trim();
}