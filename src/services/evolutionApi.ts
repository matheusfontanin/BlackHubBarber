/**
 * Cliente Evolution API (frontend)
 *
 * Todas as chamadas passam pela Supabase Edge Function "evolution-proxy".
 * A API key da Evolution nunca é exposta no bundle do cliente.
 */

import { supabase } from '@/lib/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ApiResponse {
  base64?: string;
  code?: string;
  error?: string;
  instance?: { state?: 'open' | 'connecting' | 'close' };
  [key: string]: unknown;
}

async function callProxy(action: string, instanceName?: string): Promise<ApiResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Usuário não autenticado');

  const params = new URLSearchParams({ action });
  if (instanceName) params.set('instanceName', instanceName);

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/evolution-proxy?${params}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await res.json().catch(() => ({}));
  return data;
}

export function buildInstanceName(phone: string): string {
  return `blackhub_${phone.replace(/\D/g, '')}`;
}

export async function createInstance(instanceName: string): Promise<void> {
  const data = await callProxy('create-instance', instanceName);
  if (data?.error && !data.error.includes('already exists')) {
    throw new Error(data.error);
  }
}

export async function getQRCode(instanceName: string): Promise<{ base64: string; code: string } | null> {
  const data = await callProxy('get-qrcode', instanceName);
  if (!data?.base64) return null;
  return { base64: data.base64, code: data.code ?? '' };
}

export async function getConnectionState(instanceName: string): Promise<'open' | 'connecting' | 'close'> {
  const data = await callProxy('connection-state', instanceName);
  return data?.instance?.state ?? 'close';
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await callProxy('delete-instance', instanceName);
}
