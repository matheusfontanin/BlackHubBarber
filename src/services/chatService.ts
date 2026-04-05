import { supabase } from '@/lib/supabase/client';
import type { ClientPreferences } from './crudService';

/* ─────────────────────────────────────────────────────── */
/* Types                                                   */
/* ─────────────────────────────────────────────────────── */

export type ConversationStatus = 'active' | 'open' | 'ai_handling' | 'closed' | 'escalated';
export type ConversationChannel = 'whatsapp' | 'instagram';
export type MessageRole = 'client' | 'user' | 'ai' | 'assistant' | 'owner' | 'system';

export interface Conversation {
  id: string;
  tenant_id: string;
  client_id: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  last_message_at: string;
  created_at: string;
  clients?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    instagram_handle?: string;
    preferences?: ClientPreferences;
    last_visit_at?: string;
    total_visits?: number;
    total_spent?: number;
    loyalty_points?: number;
    tags?: string[];
  };
  // computed on frontend
  last_message_preview?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  tenant_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface CustomerMemory {
  id: string;
  tenant_id: string;
  client_id: string;
  memory_type: 'preference' | 'behavior' | 'note' | 'summary';
  content: string;
  relevance_score?: number;
  source: string;
  created_at: string;
}

/* ─────────────────────────────────────────────────────── */
/* Service                                                 */
/* ─────────────────────────────────────────────────────── */

export const chatService = {

  /* ── Conversations ── */

  async getConversations(
    tenantId: string,
    filters?: {
      status?: ConversationStatus;
      channel?: ConversationChannel;
      search?: string;
    },
  ): Promise<Conversation[]> {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        clients(id, name, phone, email, instagram_handle, preferences, last_visit_at, total_visits, total_spent, loyalty_points, tags)
      `)
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    const { data, error } = await query;
    if (error) throw error;

    let conversations = (data ?? []) as Conversation[];

    // Client-side search filter
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      conversations = conversations.filter(c =>
        c.clients?.name?.toLowerCase().includes(term) ||
        c.clients?.phone?.includes(term)
      );
    }

    // Fetch last message preview + unread count in batch
    const ids = conversations.map(c => c.id);
    if (ids.length > 0) {
      // Last message per conversation
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, role')
        .in('conversation_id', ids)
        .order('created_at', { ascending: false });

      // Unread counts
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', ids)
        .eq('is_read', false)
        .in('role', ['client', 'user']);

      const lastMsgMap = new Map<string, string>();
      if (lastMessages) {
        for (const m of lastMessages) {
          if (!lastMsgMap.has(m.conversation_id)) {
            const prefix = m.role === 'ai' || m.role === 'assistant' ? '🤖 ' : '';
            lastMsgMap.set(m.conversation_id, prefix + m.content);
          }
        }
      }

      const unreadMap = new Map<string, number>();
      if (unreadData) {
        for (const u of unreadData) {
          unreadMap.set(u.conversation_id, (unreadMap.get(u.conversation_id) ?? 0) + 1);
        }
      }

      conversations = conversations.map(c => ({
        ...c,
        last_message_preview: lastMsgMap.get(c.id)?.slice(0, 80) ?? '',
        unread_count: unreadMap.get(c.id) ?? 0,
      }));
    }

    return conversations;
  },

  /* ── Messages ── */

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.before) {
      query = query.lt('created_at', options.before);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Message[];
  },

  /* ── Mark as read ── */

  async markAsRead(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .in('role', ['client', 'user']);
    if (error) throw error;
  },

  /* ── Send owner message ── */

  async sendOwnerMessage(
    conversationId: string,
    tenantId: string,
    content: string,
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        role: 'owner',
        content,
        is_read: true,
      })
      .select()
      .single();
    if (error) throw error;

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as Message;
  },

  /* ── Customer memories ── */

  async getCustomerMemories(clientId: string, tenantId: string): Promise<CustomerMemory[]> {
    const { data, error } = await supabase
      .from('customer_memories')
      .select('*')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as CustomerMemory[];
  },

  /* ── Unread total (for sidebar badge) ── */

  async getUnreadTotal(tenantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', false)
      .in('role', ['client', 'user']);
    if (error) throw error;
    return count ?? 0;
  },

  /* ── Realtime subscriptions ── */

  subscribeToConversations(tenantId: string, callback: (payload: unknown) => void) {
    return supabase
      .channel(`conversations:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        callback,
      )
      .subscribe();
  },

  subscribeToMessages(conversationId: string, callback: (payload: unknown) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback,
      )
      .subscribe();
  },
};
