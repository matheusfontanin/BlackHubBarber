import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Bot, MessageSquare, ChevronLeft, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/services/chatService';
import { Message } from '@/services/chatService';
import { ROLE_CONFIG, STATUS_CONFIG, CHANNEL_ICON } from '../constants';
import { AIReasoningPanel } from './AIReasoningPanel';

interface MessageThreadProps {
  selectedConv: Conversation | null;
  messages: Message[];
  loading: boolean;
  onBack?: () => void;
  onToggleProfile?: () => void;
  showProfile?: boolean;
}

export function MessageThread({
  selectedConv,
  messages,
  loading,
  onBack,
  onToggleProfile,
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
  messages.forEach(msg => {
    const dateKey = format(parseISO(msg.created_at), 'yyyy-MM-dd');
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, msgs: [msg] });
    }
  });

  const client = selectedConv?.clients;

  if (!selectedConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-20 h-20 rounded-2xl bg-gold/5 border border-gold/15 flex items-center justify-center mb-6">
          <MessageSquare size={36} className="text-gold/30" />
        </div>
        <h2 className="text-xl font-heading font-bold text-primary italic mb-2">Conversas IA</h2>
        <p className="text-sm text-muted max-w-sm">
          Selecione uma conversa à esquerda para acompanhar o atendimento da IA com seus clientes e barbeiros.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex-col bg-appbg min-w-0">
      {/* Chat header */}
      <div className="bg-sidebar border-b border-border px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Mobile back button */}
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="lg:hidden p-2 -ml-2 rounded-lg text-muted hover:text-primary"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
            {client?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{client?.name}</p>
              <span className="text-[10px] shrink-0">{CHANNEL_ICON[selectedConv.channel].icon}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wider',
                STATUS_CONFIG[selectedConv.status].color,
              )}>
                {STATUS_CONFIG[selectedConv.status].label}
              </span>
              <p className="text-[10px] text-faint font-mono truncate">{client?.phone}</p>
            </div>
          </div>
        </div>

        {onToggleProfile && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleProfile}
              title="Perfil do cliente"
              className={cn(
                'p-2 rounded-lg transition-all',
                showProfile
                  ? 'bg-gold/10 text-gold border border-gold/25'
                  : 'text-muted hover:text-primary hover:bg-white/[0.04]',
              )}
            >
              <Eye size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-gold" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot size={32} className="text-gold/30 mb-3" />
            <p className="text-sm text-muted">Nenhuma mensagem nesta conversa.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMessages.map(group => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-4">
                  <span className="bg-surface2 text-faint text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-border">
                    {formatDateHeader(group.msgs[0].created_at)}
                  </span>
                </div>

                {/* Messages */}
                {group.msgs.map(msg => {
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
                        <div className="chat-bubble-system text-center">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  const bubbleClass = isRight
                    ? (msg.role === 'owner' ? 'chat-bubble-owner' : 'chat-bubble-ai')
                    : 'chat-bubble-client';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'flex mb-2',
                        isRight ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div className={cn('group', isRight && 'flex flex-col items-end')}>
                        {/* Role label */}
                        <div className={cn(
                          'flex items-center gap-1 mb-1',
                          isRight && 'flex-row-reverse',
                        )}>
                          <roleConf.icon size={10} className={roleConf.color} />
                          <span className={cn('text-[9px] font-bold uppercase tracking-wider', roleConf.color)}>
                            {roleConf.label}
                          </span>
                          {toolCalls && toolCalls.length > 0 && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/25 rounded-full px-1.5 py-0.5">
                              🔧 {toolCalls.length === 1 ? 'ferramenta' : `${toolCalls.length} ferramentas`}
                            </span>
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={bubbleClass}>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                        </div>

                        {/* Timestamp + AI reasoning trigger */}
                        <div className={cn('flex items-center gap-1.5 mt-1', isRight && 'flex-row-reverse')}>
                          <span className="text-[9px] font-mono text-faint opacity-0 group-hover:opacity-100 transition-opacity">
                            {format(parseISO(msg.created_at), 'HH:mm')}
                          </span>
                          {isAI && (
                            <button
                              type="button"
                              onClick={() => setReasoningMessageId(msg.id)}
                              title="Ver raciocínio da IA"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gold/70 hover:text-gold hover:bg-gold/10"
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