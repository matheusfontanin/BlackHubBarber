import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Bot, MessageSquare, ChevronLeft, Eye, Sparkles, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, Message } from '@/services/chatService';
import { ROLE_CONFIG, CHANNEL_ICON } from '../constants';
import { getConversationDisplayName } from '../utils';
import { AIReasoningPanel } from './AIReasoningPanel';

interface MessageThreadProps {
  selectedConv: Conversation | null;
  messages: Message[];
  loading: boolean;
  onBack?: () => void;
  onToggleProfile?: () => void;
  onToggleAI?: (enabled: boolean) => void;
  showProfile?: boolean;
}

export function MessageThread({
  selectedConv,
  messages,
  loading,
  onBack,
  onToggleProfile,
  onToggleAI,
  showProfile,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reasoningMessageId, setReasoningMessageId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDateHeader = (dateStr: string): string => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Hoje';
    if (isYesterday(d)) return 'Ontem';
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = format(parseISO(msg.created_at), 'yyyy-MM-dd');
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) last.msgs.push(msg);
    else groupedMessages.push({ date: dateKey, msgs: [msg] });
  });

  const client = selectedConv?.clients;
  const displayName = selectedConv ? getConversationDisplayName(selectedConv) : '';
  const contactPhone = selectedConv?.external_contact_phone ?? client?.phone ?? '';

  if (!selectedConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-app">
        <div className="w-16 h-16 rounded-2xl bg-white border border-line flex items-center justify-center mb-5">
          <MessageSquare size={28} className="text-ink-soft" />
        </div>
        <h2 className="text-lg font-bold text-ink mb-1.5">Selecione uma conversa</h2>
        <p className="text-sm text-ink-soft max-w-sm">
          Escolha um atendimento à esquerda para acompanhar em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-app min-w-0 h-full">
      <div className="bg-white border-b border-line px-4 lg:px-6 py-3 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="lg:hidden btn-icon -ml-1"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-gold-soft text-gold-dark flex items-center justify-center text-sm font-semibold shrink-0">
            {displayName.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
              <span className="text-[12px]">{CHANNEL_ICON[selectedConv.channel].icon}</span>
            </div>
            <p className="text-[12px] text-ink-soft truncate">{contactPhone || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleAI && (
            <button
              type="button"
              onClick={() => onToggleAI(!selectedConv.ai_enabled)}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-semibold border transition-colors',
                selectedConv.ai_enabled
                  ? 'bg-[#E8F6F0] text-[#11895C] border-[#11895C]/20 hover:bg-[#DCF0E6]'
                  : 'bg-[#FFF4DE] text-[#B67A18] border-[#B67A18]/20 hover:bg-[#FCEBC6]',
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  selectedConv.ai_enabled ? 'bg-[#11895C]' : 'bg-[#B67A18]',
                )}
              />
              {selectedConv.ai_enabled ? 'IA ativa' : 'IA pausada'}
            </button>
          )}
          {onToggleProfile && (
            <button
              onClick={onToggleProfile}
              aria-label="Perfil do cliente"
              className={cn(
                'btn-icon',
                showProfile && 'bg-gold-soft text-gold-dark hover:bg-gold-soft',
              )}
            >
              <Eye size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#BE9B64]" size={22} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot size={28} className="text-ink-faint mb-3" />
            <p className="text-sm text-ink-soft">Nenhuma mensagem nesta conversa.</p>
          </div>
        ) : (
          <div className="space-y-1 max-w-3xl mx-auto">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center my-5">
                  <span className="bg-white border border-line text-ink-faint text-[11px] font-semibold px-3 py-1 rounded-full">
                    {formatDateHeader(group.msgs[0].created_at)}
                  </span>
                </div>

                {group.msgs.map((msg) => {
                  const roleConf = ROLE_CONFIG[msg.role] ?? ROLE_CONFIG.client;
                  const isRight = msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'owner';
                  const isSystem = msg.role === 'system';
                  const isAI = msg.role === 'ai' || msg.role === 'assistant';
                  const toolCalls = Array.isArray((msg.metadata as { tool_calls?: unknown[] } | undefined)?.tool_calls)
                    ? ((msg.metadata as { tool_calls?: unknown[] }).tool_calls as unknown[])
                    : null;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="chat-bubble-system text-center">{msg.content}</div>
                      </div>
                    );
                  }

                  const bubbleClass = isRight
                    ? msg.role === 'owner'
                      ? 'chat-bubble-owner'
                      : 'chat-bubble-ai'
                    : 'chat-bubble-client';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn('flex mb-2', isRight ? 'justify-end' : 'justify-start')}
                    >
                      <div className={cn('group flex flex-col', isRight && 'items-end')}>
                        <div className={cn('flex items-center gap-1.5 mb-1', isRight && 'flex-row-reverse')}>
                          <roleConf.icon size={11} className={roleConf.color} />
                          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', roleConf.color)}>
                            {roleConf.label}
                          </span>
                          {toolCalls && toolCalls.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold-dark bg-gold-soft rounded-full px-2 py-0.5">
                              <Wrench size={9} />
                              {toolCalls.length === 1 ? 'ferramenta' : `${toolCalls.length} ferramentas`}
                            </span>
                          )}
                        </div>

                        <div className={bubbleClass}>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                        </div>

                        <div className={cn('flex items-center gap-1.5 mt-1', isRight && 'flex-row-reverse')}>
                          <span className="text-[10px] text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity">
                            {format(parseISO(msg.created_at), 'HH:mm')}
                          </span>
                          {isAI && (
                            <button
                              type="button"
                              onClick={() => setReasoningMessageId(msg.id)}
                              aria-label="Ver raciocínio da IA"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gold-dark hover:bg-gold-soft"
                            >
                              <Sparkles size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <AIReasoningPanel
        messageId={reasoningMessageId}
        onClose={() => setReasoningMessageId(null)}
      />
    </div>
  );
}
