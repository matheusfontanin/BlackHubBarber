/**
 * Edge Function: google-calendar-oauth
 *
 * Gerencia o fluxo OAuth2 do Google Calendar server-side.
 * Client secrets nunca ficam no bundle do frontend.
 *
 * Endpoints:
 *   ?action=auth-url   → retorna a URL de autorização do Google
 *   ?action=callback   → troca o code pelo token e salva no tenant
 *   ?action=revoke     → revoga o token e desconecta o Calendar
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000';

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar-oauth?action=callback`;
const SCOPES = 'https://www.googleapis.com/auth/calendar';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'auth-url') {
      // Precisa de JWT para identificar o tenant
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const token = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) return unauthorized(corsHeaders);

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return unauthorized(corsHeaders);

      const { data: member } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!member?.tenant_id) return json({ error: 'Tenant não encontrado' }, 404, corsHeaders);

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        state: member.tenant_id, // passamos o tenant_id como state para recuperar no callback
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      return json({ url: authUrl }, 200, corsHeaders);
    }

    if (action === 'callback') {
      // Google redireciona aqui com ?code=...&state=tenant_id
      const code = url.searchParams.get('code');
      const tenantId = url.searchParams.get('state');

      if (!code || !tenantId) {
        return Response.redirect(`${APP_URL}/onboarding?calendar_error=1`);
      }

      // Troca o code pelo token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return Response.redirect(`${APP_URL}/onboarding?calendar_error=1`);
      }

      // Busca o ID do calendário primário
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList/primary', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const calData = await calRes.json();

      // Salva tokens no tenant (criptografados pelo Supabase RLS/vault idealmente)
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await supabase
        .from('tenants')
        .update({
          google_calendar_id: calData.id ?? 'primary',
          google_calendar_connected: true,
          google_refresh_token: tokenData.refresh_token,
        })
        .eq('id', tenantId);

      return Response.redirect(`${APP_URL}/onboarding?calendar_success=1`);
    }

    if (action === 'revoke') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const token = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) return unauthorized(corsHeaders);

      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return unauthorized(corsHeaders);

      const { data: member } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (member?.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('google_refresh_token')
          .eq('id', member.tenant_id)
          .single();

        if (tenant?.google_refresh_token) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${tenant.google_refresh_token}`, { method: 'POST' });
        }

        await supabase
          .from('tenants')
          .update({ google_calendar_connected: false, google_refresh_token: null, google_calendar_id: null })
          .eq('id', member.tenant_id);
      }

      return json({ success: true }, 200, corsHeaders);
    }

    return json({ error: 'Unknown action' }, 400, corsHeaders);
  } catch (err) {
    return json({ error: String(err) }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function unauthorized(headers: Record<string, string>) {
  return json({ error: 'Unauthorized' }, 401, headers);
}
