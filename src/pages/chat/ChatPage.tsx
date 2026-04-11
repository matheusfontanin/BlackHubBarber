import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, MessageSquare, Send, Phone, Mail, AtSign,
  Loader2, X, Bot, User, Crown, Scissors, Clock,
  Hash, Star, AlertTriangle, ChevronRight, ChevronLeft, Brain,
  Tag, Eye, Filter, Wifi, WifiOff,
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/useTenant';
import {
  chatService,
  Conversation,
  Message,
  CustomerMemory,
  ConversationStatus,
  ConversationChannel,
  MessageRole,
} from '@/services/chatService';

/* ─────────────────────────────────────────────────────── */
/* Constants                                               */
/* ─────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string; dot: string }> = {
  active:      { label: 'Ativa',        color: 'text-emerald-400', dot: 'bg-emerald-400' },
  open:        { label: 'Aberta',       color: 'text-blue-400',    dot: 'bg-blue-400' },
  ai_handling: { label: 'IA Atendendo', color: 'text-gold',        dot: 'bg-gold' },
  closed:      { label: 'Encerrada',    color: 'text-faint',       dot: 'bg-faint' },
  escalated:   { label: 'Escalada',     color: 'text-orange-400',  dot: 'bg-orange-400' },
};

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  client:    { label: 'Cliente',   icon: User,  color: 'text-blue-400' },
  user:      { label: 'Cliente',   icon: User,  color: 'text-blue-400' },
  ai:        { label: 'IA',        icon: Bot,   color: 'text-gold' },
  assistant: { label: 'IA',        icon: Bot,   color: 'text-gold' },
  owner:     { label: 'Barbeiro',  icon: Crown, color: 'text-emerald-400' },
  system:    { label: 'Sistema',   icon: Hash,  color: 'text-faint' },
};

const CHANNEL_ICON: Record<ConversationChannel, { icon: string; color: string }> = {
  whatsapp:  { icon: '💬', color: 'text-emerald-400' },
  instagram: { icon: '📸', color: 'text-pink-400' },
};

/* ─────────────────────────────────────────────────────── */
/* Component                                               */
/* ─────────────────────────────────────────────────────── */

export default function ChatPage() {
  const { tenantId, loading: tenantLoading } = useTenant();

  // ── State ──
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<CustomerMemory[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<ConversationChannel | ''>('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  // Mobile navigation: list → thread → profile (as overlay)
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ── Fetch conversations ── */
  const fetchConversations = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await chatService.getConversations(tenantId, {
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        search: searchTerm || undefined,
      });
      setConversations(data);
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [tenantId, statusFilter, channelFilter, searchTerm]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  /* ── Fetch messages when conversation selected ── */
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const data = await chatService.getMessages(convId);
      setMessages(data);
      // Mark as read
      await chatService.markAsRead(convId);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  /* ── Fetch memories for selected client ── */
  const fetchMemories = useCallback(async (clientId: string) => {
    if (!tenantId) return;
    try {
      const data = await chatService.getCustomerMemories(clientId, tenantId);
      setMemories(data);
    } catch (err) {
      console.error('Erro ao buscar memórias:', err);
    }
  }, [tenantId]);

  /* ── Select conversation ── */
  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
    if (conv.client_id) fetchMemories(conv.client_id);
  };

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Realtime subscriptions ── */
  useEffect(() => {
    if (!tenantId) return;

    const convChannel = chatService.subscribeToConversations(tenantId, () => {
      fetchConversations();
    });

    setIsConnected(true);

    return () => {
      convChannel.unsubscribe();
    };
  }, [tenantId, fetchConversations]);

  useEffect(() => {
    if (!selectedConv) return;

    const msgChannel = chatService.subscribeToMessages(selectedConv.id, (payload: any) => {
      const newMsg = payload.new as Message;
      setMessages(prev => [...prev, newMsg]);
      chatService.markAsRead(selectedConv.id);
    });

    return () => {
      msgChannel.unsubscribe();
    };
  }, [selectedConv]);

  /* ── Send message ── */
  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConv || !tenantId) return;
    setIsSending(true);
    try {
      const msg = await chatService.sendOwnerMessage(selectedConv.id, tenantId, messageInput.trim());
      setMessages(prev => [...prev, msg]);
      setMessageInput('');
      inputRef.current?.focus();
      fetchConversations(); // refresh sidebar order
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Date grouping helper ── */
  const formatDateHeader = (dateStr: string): string => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Hoje';
    if (isYesterday(d)) return 'Ontem';
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  /* ── Group messages by date ── */
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
  const prefs = client?.preferences;

  if (tenantLoading) return null;

  /* ── Profile body (shared between desktop inline panel and mobile overlay) ── */
  const profileBody = client && (
    <>
      {/* Profile header */}
      <div className="px-5 py-6 border-b border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400 mx-auto mb-3">
          {client.name?.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-base font-heading font-bold text-primary italic">{client.name}</h3>
        <div className="flex justify-center gap-3 mt-2">
          {client.phone && (
            <span className="flex items-center gap-1 text-[10px] text-muted font-mono">
              <Phone size={10} className="text-faint" /> {client.phone}
            </span>
          )}
        </div>
        <div className="flex justify-center gap-2 mt-2">
          {client.email && (
            <span className="flex items-center gap-1 text-[10px] text-faint font-mono">
              <Mail size={9} /> {client.email}
            </span>
          )}
          {client.instagram_handle && (
            <span className="flex items-center gap-1 text-[10px] text-faint font-mono">
              <AtSign size={9} /> @{client.instagram_handle}
            </span>
          )}
        </div>

        {client.tags && client.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {client.tags.map(tag => (
              <span key={tag} className="text-[9px] font-bold bg-gold/10 border border-gold/20 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[10px] font-bold uppercase tracking-wider text-faint mb-3 flex items-center gap-1.5">
          <Star size={10} /> Resumo
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-base font-mono font-bold text-primary">{client.total_visits ?? 0}</p>
            <p className="text-[8px] text-faint uppercase tracking-wider font-bold">Visitas</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-base font-mono font-bold text-gold">
              R$ {Number(client.total_spent ?? 0).toFixed(0)}
            </p>
            <p className="text-[8px] text-faint uppercase tracking-wider font-bold">Gasto</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-base font-mono font-bold text-emerald-400">{client.loyalty_points ?? 0}</p>
            <p className="text-[8px] text-faint uppercase tracking-wider font-bold">Pontos</p>
          </div>
        </div>
        {client.last_visit_at && (
          <p className="text-[10px] text-faint mt-2 flex items-center gap-1">
            <Clock size={9} /> Última visita: {format(parseISO(client.last_visit_at), "d 'de' MMM", { locale: ptBR })}
          </p>
        )}
      </div>

      {/* Preferences */}
      {prefs && Object.keys(prefs).length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-faint mb-3 flex items-center gap-1.5">
            <Scissors size={10} /> Preferências
          </p>
          <div className="space-y-2">
            {prefs.corte_preferido && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">💇</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Corte</p>
                  <p className="text-xs text-primary">{prefs.corte_preferido}</p>
                </div>
              </div>
            )}
            {prefs.barba && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">🧔</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Barba</p>
                  <p className="text-xs text-primary">{prefs.barba}</p>
                </div>
              </div>
            )}
            {prefs.barbeiro_favorito && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">⭐</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Barbeiro Favorito</p>
                  <p className="text-xs text-primary">{prefs.barbeiro_favorito}</p>
                </div>
              </div>
            )}
            {prefs.alergias && prefs.alergias.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-orange-400">⚠️</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Alergias</p>
                  <p className="text-xs text-orange-300">{prefs.alergias.join(', ')}</p>
                </div>
              </div>
            )}
            {prefs.produtos && prefs.produtos.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">🧴</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Produtos</p>
                  <p className="text-xs text-primary">{prefs.produtos.join(', ')}</p>
                </div>
              </div>
            )}
            {prefs.observacoes && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">📝</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Observações</p>
                  <p className="text-xs text-muted">{prefs.observacoes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Memories */}
      {memories.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-faint mb-3 flex items-center gap-1.5">
            <Brain size={10} /> Memórias da IA
          </p>
          <div className="space-y-2">
            {memories.slice(0, 8).map(mem => {
              const typeConfig: Record<string, { icon: string; color: string }> = {
                preference: { icon: '✂️', color: 'border-gold/20 bg-gold/5' },
                behavior:   { icon: '📊', color: 'border-blue-500/20 bg-blue-950/30' },
                note:       { icon: '📝', color: 'border-border bg-surface' },
                summary:    { icon: '📋', color: 'border-emerald-500/20 bg-emerald-950/30' },
              };
              const cfg = typeConfig[mem.memory_type] ?? typeConfig.note;

              return (
                <div
                  key={mem.id}
                  className={cn('rounded-lg border px-3 py-2', cfg.color)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-primary leading-snug">{mem.content}</p>
                      <p className="text-[8px] text-faint font-mono mt-1">
                        {format(parseISO(mem.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden">

      {/* ════════════════════════════════════════════════
          COLUMN 1 — Conversations List
          Mobile: hidden when a conversation is selected
      ════════════════════════════════════════════════ */}
      <div className={cn(
        "w-full lg:w-[340px] lg:shrink-0 bg-sidebar lg:border-r border-border flex flex-col",
        selectedConv && "hidden lg:flex",
      )}>
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
              onChange={e => setSearchTerm(e.target.value)}
              className="input-dark pl-9 py-2.5 text-xs"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ConversationStatus | '')}
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
              onChange={e => setChannelFilter(e.target.value as ConversationChannel | '')}
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
          {loadingConvs ? (
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
                    onClick={() => handleSelectConv(conv)}
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

      {/* ════════════════════════════════════════════════
          COLUMN 2 — Messages Thread
          Mobile: shown only when conversation selected
      ════════════════════════════════════════════════ */}
      <div className={cn(
        "flex-1 flex-col bg-appbg min-w-0",
        selectedConv ? "flex" : "hidden lg:flex",
      )}>
        {!selectedConv ? (
          /* Empty state (desktop only) */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-gold/5 border border-gold/15 flex items-center justify-center mb-6">
              <MessageSquare size={36} className="text-gold/30" />
            </div>
            <h2 className="text-xl font-heading font-bold text-primary italic mb-2">Conversas IA</h2>
            <p className="text-sm text-muted max-w-sm">
              Selecione uma conversa à esquerda para acompanhar o atendimento da IA com seus clientes e barbeiros.
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-sidebar border-b border-border px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Mobile back button */}
                <button
                  onClick={() => setSelectedConv(null)}
                  aria-label="Voltar"
                  className="lg:hidden p-2 -ml-2 rounded-lg text-muted hover:text-primary"
                >
                  <ChevronLeft size={20} />
                </button>
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

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    // Desktop: toggle inline panel; Mobile: open overlay
                    if (window.matchMedia('(max-width: 1023px)').matches) {
                      setMobileProfileOpen(true);
                    } else {
                      setShowProfile(p => !p);
                    }
                  }}
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
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
              {loadingMsgs ? (
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
                              </div>

                              {/* Bubble */}
                              <div className={bubbleClass}>
                                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                              </div>

                              {/* Timestamp */}
                              <span className="text-[9px] font-mono text-faint mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {format(parseISO(msg.created_at), 'HH:mm')}
                              </span>
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

            {/* Message input */}
            <div className="border-t border-border bg-sidebar px-4 lg:px-6 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem como barbeiro..."
                  rows={1}
                  className="flex-1 input-dark resize-none py-3 text-sm min-h-[44px] max-h-[120px]"
                  style={{ height: 'auto', overflow: 'hidden' }}
                  onInput={e => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || isSending}
                  className={cn(
                    'p-3 rounded-xl transition-all shrink-0',
                    messageInput.trim()
                      ? 'bg-gold text-sidebar shadow-[0_2px_12px_rgba(201,168,76,0.4)] hover:bg-gold-light'
                      : 'bg-surface text-faint cursor-not-allowed',
                  )}
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="text-[9px] text-faint mt-2 flex items-center gap-1">
                <Crown size={8} /> Mensagem enviada como dono da barbearia
              </p>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          COLUMN 3 — Client Profile Panel (desktop inline)
      ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showProfile && selectedConv && client && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="hidden lg:block shrink-0 bg-sidebar border-l border-border overflow-hidden"
          >
            <div className="w-[320px] h-full overflow-y-auto">
              {profileBody}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          Mobile Profile Overlay
      ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileProfileOpen && selectedConv && client && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileProfileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 right-0 w-[88%] max-w-sm bg-sidebar border-l border-border z-[95] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar sticky top-0 z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">Perfil do Cliente</span>
                <button
                  onClick={() => setMobileProfileOpen(false)}
                  aria-label="Fechar"
                  className="p-1.5 rounded-lg text-muted hover:text-primary"
                >
                  <X size={18} />
                </button>
              </div>
              {profileBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
