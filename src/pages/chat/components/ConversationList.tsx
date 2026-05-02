import { format, parseISO } from 'date-fns';
import { Loader2, MessageSquare, Search, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, ConversationStatus, ConversationChannel } from '@/services/chatService';
import { STATUS_CONFIG, CHANNEL_ICON } from '../constants';
import { getConversationDisplayName, getConversationInitial } from '../utils';

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
    <aside
      className={cn(
        'w-full lg:w-[340px] lg:shrink-0 bg-white border-r border-line flex flex-col',
        selectedConv && 'hidden lg:flex',
      )}
    >
      <div className="px-5 pt-5 pb-4 border-b border-line space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Conversas</p>
          {isConnected ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#11895C]">
              <Wifi size={10} /> Ao vivo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
              <WifiOff size={10} /> Offline
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={14} />
          <input
            type="text"
            placeholder="Buscar conversa"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input pl-9 h-10 text-[13px]"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ConversationStatus | '')}
            className="input h-9 text-[12px] flex-1"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="ai_handling">IA atendendo</option>
            <option value="closed">Encerradas</option>
            <option value="escalated">Escaladas</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => onChannelFilterChange(e.target.value as ConversationChannel | '')}
            className="input h-9 text-[12px] flex-1"
          >
            <option value="">Todos os canais</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#BE9B64]" size={22} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F6F4] flex items-center justify-center mb-3">
              <MessageSquare size={22} className="text-ink-soft" />
            </div>
            <p className="text-sm font-semibold text-ink">Nenhuma conversa</p>
            <p className="text-[12px] text-ink-soft mt-1">As conversas com clientes aparecerão aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EEEA]">
            {conversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const statusConf = STATUS_CONFIG[conv.status];
              const channelConf = CHANNEL_ICON[conv.channel];
              const hasUnread = (conv.unread_count ?? 0) > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConv(conv)}
                  className={cn(
                    'w-full text-left px-5 py-3.5 transition-colors hover:bg-[#FBFAF8]',
                    isSelected && 'bg-gold-soft/40',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gold-soft text-gold-dark flex items-center justify-center text-[13px] font-semibold">
                        {getConversationInitial(conv)}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                          statusConf.dot,
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink truncate">
                          {getConversationDisplayName(conv)}
                        </span>
                        <span className="text-[11px] text-ink-faint shrink-0">
                          {format(parseISO(conv.last_message_at), 'HH:mm')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[12px] text-ink-soft truncate flex-1">
                          {conv.last_message_preview || 'Sem mensagens'}
                        </p>
                        {hasUnread && (
                          <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#BE9B64] text-white text-[10px] font-semibold flex items-center justify-center px-1.5">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                            statusConf.pill,
                          )}
                        >
                          {statusConf.label}
                        </span>
                        <span className={cn('text-[11px]', channelConf.color)}>
                          {channelConf.icon}
                        </span>
                        {!conv.ai_enabled && (
                          <span className="text-[10px] font-semibold text-[#B67A18] bg-[#FFF4DE] px-2 py-0.5 rounded-full">
                            IA off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
