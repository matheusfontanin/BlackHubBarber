import type { ElementType } from 'react';
import { Bot, Crown, Hash, User } from 'lucide-react';
import { ConversationStatus, ConversationChannel } from '@/services/chatService';

export const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string; dot: string; pill: string }> = {
  active:      { label: 'Ativa',        color: 'text-[#11895C]', dot: 'bg-[#11895C]', pill: 'bg-[#E8F6F0] text-[#11895C]' },
  open:        { label: 'Aberta',       color: 'text-[#2E6FE8]', dot: 'bg-[#2E6FE8]', pill: 'bg-[#EAF1FF] text-[#2E6FE8]' },
  ai_handling: { label: 'IA atendendo', color: 'text-[#9C7B47]', dot: 'bg-[#BE9B64]', pill: 'bg-[#E9DEC9] text-[#9C7B47]' },
  closed:      { label: 'Encerrada',    color: 'text-[#A39F9D]', dot: 'bg-[#A39F9D]', pill: 'bg-[#F3F3F1] text-[#645F5C]' },
  escalated:   { label: 'Escalada',     color: 'text-[#D84A4A]', dot: 'bg-[#D84A4A]', pill: 'bg-[#FDECEC] text-[#D84A4A]' },
};

export const ROLE_CONFIG: Record<string, { label: string; icon: ElementType; color: string }> = {
  client:    { label: 'Cliente',   icon: User,  color: 'text-[#645F5C]' },
  user:      { label: 'Cliente',   icon: User,  color: 'text-[#645F5C]' },
  ai:        { label: 'IA',        icon: Bot,   color: 'text-[#9C7B47]' },
  assistant: { label: 'IA',        icon: Bot,   color: 'text-[#9C7B47]' },
  owner:     { label: 'Barbeiro',  icon: Crown, color: 'text-[#2E6FE8]' },
  system:    { label: 'Sistema',   icon: Hash,  color: 'text-[#A39F9D]' },
};

export const CHANNEL_ICON: Record<ConversationChannel, { icon: string; color: string }> = {
  whatsapp:  { icon: '💬', color: 'text-[#11895C]' },
  instagram: { icon: '📸', color: 'text-[#D84A4A]' },
};
