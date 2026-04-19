import type { Conversation } from '@/services/chatService';

export function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '').replace(/^55/, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function getConversationDisplayName(conv: Conversation): string {
  return (
    conv.clients?.name
    ?? conv.external_contact_name
    ?? formatPhone(conv.external_contact_phone)
    ?? formatPhone(conv.clients?.phone)
    ?? 'Desconhecido'
  );
}

export function getConversationInitial(conv: Conversation): string {
  const name = getConversationDisplayName(conv);
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : '?';
}
