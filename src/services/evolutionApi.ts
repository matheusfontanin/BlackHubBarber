const EVOLUTION_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  apikey: EVOLUTION_KEY,
};

export interface QRCodeResponse {
  base64: string;
  code: string;
}

export interface ConnectionState {
  instance: { state: 'open' | 'connecting' | 'close' };
}

export function buildInstanceName(phone: string): string {
  // Usa somente dígitos do telefone como nome da instância
  return `barberflow_${phone.replace(/\D/g, '')}`;
}

export async function createInstance(instanceName: string): Promise<void> {
  const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Ignora erro de instância já existente
    if (!err?.response?.message?.includes('already exists')) {
      throw new Error(err?.response?.message || 'Erro ao criar instância');
    }
  }
}

export async function getQRCode(instanceName: string): Promise<QRCodeResponse | null> {
  const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.base64) return null;
  return { base64: data.base64, code: data.code ?? '' };
}

export async function getConnectionState(instanceName: string): Promise<'open' | 'connecting' | 'close'> {
  const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) return 'close';
  const data: ConnectionState = await res.json();
  return data?.instance?.state ?? 'close';
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers,
  });
}
