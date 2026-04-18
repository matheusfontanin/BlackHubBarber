import type { ElementType } from 'react';
import { Bot, Crown, Hash, User } from 'lucide-react';
import { ConversationStatus, ConversationChannel } from '@/services/chatService';

export const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string; dot: string }> = {
  active:      { label: 'Ativa',        color: 'text-emerald-400', dot: 'bg-emerald-400' },
  open:        { label: 'Aberta',       color: 'text-blue-400',    dot: 'bg-blue-400' },
  ai_handling: { label: 'IA Atendendo', color: 'text-gold',        dot: 'bg-gold' },
  closed:      { label: 'Encerrada',    color: 'text-faint',       dot: 'bg-faint' },
  escalated:   { label: 'Escalada',     color: 'text-orange-400',  dot: 'bg-orange-400' },
};

export const ROLE_CONFIG: Record<string, { label: string; icon: ElementType; color: string }> = {
  client:    { label: 'Cliente',   icon: User,  color: 'text-blue-400' },
  user:      { label: 'Cliente',   icon: User,  color: 'text-blue-400' },
  ai:        { label: 'IA',        icon: Bot,   color: 'text-gold' },
  assistant: { label: 'IA',        icon: Bot,   color: 'text-gold' },
  owner:     { label: 'Barbeiro',  icon: Crown, color: 'text-emerald-400' },
  system:    { label: 'Sistema',   icon: Hash,  color: 'text-faint' },
};

export const CHANNEL_ICON: Record<ConversationChannel, { icon: string; color: string }> = {
  whatsapp:  { icon: '💬', color: 'text-emerald-400' },
  instagram: { icon: '📸', color: 'text-pink-400' },
};