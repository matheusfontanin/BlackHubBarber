import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, MessageSquare, Search, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, ConversationStatus, ConversationChannel } from '@/services/chatService';
import { STATUS_CONFIG, CHANNEL_ICON } from '../constants';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedConv: Conversation | null;
  onSelectConv: (conv: Conversation) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: ConversationStatus | '';
  onStatusFilterChange: (status: ConversationStatus | '') => void;
  channelFilter: ConversationChannel | '';
  onChannelFilterChange: (channel: ConversationChannel | '') => void;
  isConnected: boolean;
}

export function ConversationList({
  conversations,
  loading,
  selectedConv,
  onSelectConv,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  channelFilter,
  onChannelFilterChange,
  isConnected,
}: ConversationListProps) {
  return (
    <div className="w-full lg:w-[340px] lg:shrink-0 bg-sidebar lg:border-r border-border flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
              <MessageSquare size={14} className="text-gold" />
            </div>
            <h1 className="font-heading font-bold text-lg text-primary italic">Chat</h1>
          </div>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                <Wifi size={10} /> ao vivo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
                <WifiOff size={10} /> offline
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={14} />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="input-dark pl-9 py-2.5 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value as ConversationStatus | '')}
            className="text-[10px] font-bold uppercase tracking-wider bg-surface border border-border rounded-lg px-2.5 py-1.5 text-muted focus:border-gold/40 outline-none transition-colors"
          >
            <option value="">Todos</option>
            <option value="active">Ativas</option>
            <option value="ai_handling">IA Atendendo</option>
            <option value="closed">Encerradas</option>
            <option value="escalated">Escaladas</option>
          </select>

          {/* Channel filter */}
          <select
            value={channelFilter}
            onChange={e => onChannelFilterChange(e.target.value as ConversationChannel | '')}
            className="text-[10px] font-bold uppercase tracking-wider bg-surface border border-border rounded-lg px-2.5 py-1.5 text-muted focus:border-gold/40 outline-none transition-colors"
          >
            <option value="">Canais</option>
            <option value="whatsapp">💬 WhatsApp</option>
            <option value="instagram">📸 Instagram</option>
          </select>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-gold" size={24} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-gold/50" />
            </div>
            <p className="text-sm font-semibold text-muted">Nenhuma conversa</p>
            <p className="text-xs text-faint mt-1">As conversas com clientes aparecerão aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map(conv => {
              const isSelected = selectedConv?.id === conv.id;
              const statusConf = STATUS_CONFIG[conv.status];
              const channelConf = CHANNEL_ICON[conv.channel];
              const hasUnread = (conv.unread_count ?? 0) > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConv(conv)}
                  className={cn(
                    'w-full text-left px-5 py-3.5 transition-all hover:bg-white/[0.03]',
                    isSelected && 'bg-gold/[0.06] border-l-2 border-l-gold',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold',
                        'bg-blue-950/60 border border-blue-500/20 text-blue-400',
                      )}>
                        {conv.clients?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      {/* Status dot */}
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar',
                        statusConf.dot,
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-semibold text-primary truncate">
                            {conv.clients?.name ?? 'Desconhecido'}
                          </span>
                          <span className="text-[10px]">{channelConf.icon}</span>
                        </div>
                        <span className="text-[9px] font-mono text-faint shrink-0">
                          {format(parseISO(conv.last_message_at), 'HH:mm')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-muted truncate flex-1">
                          {conv.last_message_preview || 'Sem mensagens'}
                        </p>
                        {hasUnread && (
                          <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-gold text-sidebar text-[9px] font-bold flex items-center justify-center px-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>

                      <span className={cn('text-[9px] font-bold uppercase tracking-wider mt-1 inline-block', statusConf.color)}>
                        {statusConf.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}