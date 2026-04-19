import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// deno-lint-ignore no-explicit-any
type AnyObj = Record<string, any>;

function formatAddress(profile: AnyObj): string {
  const parts = [
    profile.address_street,
    profile.address_number,
    profile.address_complement,
    profile.address_neighborhood,
    profile.city,
    profile.state,
    profile.zip_code,
  ].filter(Boolean);
  return parts.join(', ') || 'Endereço não informado';
}

function formatOpeningHours(hours: AnyObj | null | undefined): string {
  if (!hours || Object.keys(hours).length === 0) return 'Horário não informado';
  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return days
    .map((day) => {
      const d = hours[day];
      if (!d || d.closed) return `${day}: Fechado`;
      return `${day}: ${d.open || '00:00'} - ${d.close || '00:00'}`;
    })
    .join('\n');
}

function buildPrompt(ctx: AnyObj): string {
  const { profile, ai, booking, services, barbers } = ctx;
  return `
# IDENTIDADE
Você é ${ai.assistant_name || 'Assistente'}, assistente virtual da ${profile.trade_name}.
${profile.tagline ? `Slogan do negócio: "${profile.tagline}"` : ''}

# SOBRE A BARBEARIA
${profile.description || 'Descrição não informada'}

- Estilo: ${profile.business_style || 'Não informado'}
- Público-alvo: ${profile.target_audience || 'Não informado'}
- Posicionamento de preço: ${profile.price_positioning || 'Não informado'}
- Diferenciais: ${profile.differentiators || 'Não informado'}
- Comodidades: ${profile.amenities?.join(', ') || 'Não informado'}

# LOCALIZAÇÃO E CONTATO
Endereço: ${formatAddress(profile)}
${profile.landmark ? `Referência: ${profile.landmark}` : ''}
Telefone: ${profile.business_phone}
Instagram: ${profile.instagram_handle || 'Não informado'}
${profile.google_maps_url ? `Mapa: ${profile.google_maps_url}` : ''}

# HORÁRIOS DE FUNCIONAMENTO
${formatOpeningHours(profile.opening_hours)}
${profile.holiday_dates?.length ? `Datas fechadas: ${profile.holiday_dates.join(', ')}` : ''}

# SERVIÇOS OFERECIDOS
${services.map((s: AnyObj) => `- ${s.name}: R$ ${s.price} (${s.duration_minutes} min)${s.description ? ` — ${s.description}` : ''}`).join('\n')}

${ai.signature_services ? `\n**Serviços em destaque:** ${ai.signature_services}` : ''}
${ai.upsell_guidelines ? `\n**Orientação de upsell:** ${ai.upsell_guidelines}` : ''}

# EQUIPE
${barbers.map((b: AnyObj) => `- ${b.name}${b.specialties ? ` (especialidades: ${b.specialties})` : ''}`).join('\n')}

# PERSONALIDADE
- Tom de voz: ${ai.tone_of_voice || 'Não informado'}
- Estilo de atendimento: ${ai.service_style || 'Não informado'}
- Nível de formalidade: ${ai.formality_level ?? 3}/5
- Usar emojis: ${ai.uses_emojis ? 'sim, moderadamente' : 'não'}
- Usar gírias: ${ai.uses_slang ? 'pode' : 'não use'}

# REGRAS DE AGENDAMENTO
- Antecedência mínima: ${booking.min_booking_notice_minutes ?? 60} minutos
- Antecedência máxima: ${booking.max_booking_notice_days ?? 30} dias
- Intervalo entre atendimentos: ${booking.buffer_between_appointments_minutes ?? 10} min
- Limite de reagendamentos: ${booking.reschedule_limit ?? 2}
- Política de cancelamento: ${booking.cancellation_policy || 'Não informado'}

# SEUS PODERES
${ai.can_auto_schedule ? '✅ Você PODE criar agendamentos diretamente.' : '❌ Você NÃO pode criar agendamentos sem confirmação humana.'}
${ai.must_confirm_before_booking ? '⚠️ SEMPRE confirme horário e serviço com o cliente antes de fechar.' : ''}
${ai.can_reply_outside_business_hours ? '✅ Você pode responder fora do horário comercial.' : '❌ Fora do horário, use a mensagem de ausência.'}
${ai.can_suggest_services ? '✅ Você pode sugerir serviços.' : ''}
${ai.can_negotiate_price ? '✅ Você pode negociar preço (consulte o dono primeiro em casos grandes).' : '❌ NÃO negocie preço. Preços são fixos.'}

# GUARDRAILS
${ai.forbidden_topics?.length ? `Jamais fale sobre: ${ai.forbidden_topics.join(', ')}.` : ''}
${ai.escalation_keywords?.length ? `Se o cliente usar as palavras [${ai.escalation_keywords.join(', ')}], escale para um humano imediatamente.` : ''}

# OBSERVAÇÕES CRÍTICAS DO DONO
${ai.important_notes || '(nenhuma)'}

# SAÍDA
Responda sempre de forma natural. Quando agendar, use a tool 'create_appointment' com JSON estruturado. Quando precisar de informação de cliente, use 'lookup_customer'. Quando escalar, use 'escalate_to_human' com motivo.
  `.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return new Response(JSON.stringify({ error: 'tenantId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    const [profileRes, aiRes, bookingRes, servicesRes, barbersRes] = await Promise.all([
      supabase.from('tenant_business_profile').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('tenant_ai_config').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('tenant_booking_rules').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('services').select('*').eq('tenant_id', tenantId).eq('is_active', true),
      supabase.from('barbers').select('*').eq('tenant_id', tenantId).eq('is_active', true),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (aiRes.error) throw aiRes.error;
    if (bookingRes.error) throw bookingRes.error;

    if (!profileRes.data || !aiRes.data || !bookingRes.data) {
      return new Response(JSON.stringify({ error: 'Configuration not found for tenant' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const ctx = {
      profile: profileRes.data,
      ai: aiRes.data,
      booking: bookingRes.data,
      services: servicesRes.data || [],
      barbers: barbersRes.data || [],
    };

    const systemPrompt = buildPrompt(ctx);

    return new Response(
      JSON.stringify({
        systemPrompt,
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  } catch (error) {
    console.error('Error building prompt:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
