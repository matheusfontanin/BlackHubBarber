import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/useTenant';
import { Conversation, ConversationStatus, ConversationChannel } from '@/services/chatService';
import { useConversations } from './hooks/useConversations';
import { useMessages } from './hooks/useMessages';
import { useSendMessage } from './hooks/useSendMessage';
import { useCustomerMemories } from './hooks/useCustomerMemories';
import { ConversationList } from './components/ConversationList';
import { MessageThread } from './components/MessageThread';
import { MessageComposer } from './components/MessageComposer';
import { CustomerProfilePanel } from './components/CustomerProfilePanel';

export default function ChatPage() {
  const { tenantId, loading: tenantLoading } = useTenant();

  // ── State ──
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<ConversationChannel | ''>('');
  const [messageInput, setMessageInput] = useState('');
  const [showProfile, setShowProfile] = useState(true);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Hooks ──
  const { conversations, loading: loadingConvs, isConnected, refetch: refetchConversations } = useConversations();
  const { messages, loading: loadingMsgs } = useMessages(selectedConv);
  const { sendMessage, isSending } = useSendMessage(selectedConv, (msg) => {
    setMessageInput('');
    inputRef.current?.focus();
    refetchConversations();
  });
  const { memories } = useCustomerMemories(selectedConv?.client_id || null);

  /* ── Select conversation ── */
  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
  };

  /* ── Send message ── */
  const handleSend = async () => {
    if (!messageInput.trim()) return;
    await sendMessage(messageInput.trim());
  };

  /* ── Profile toggle ── */
  const handleToggleProfile = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setMobileProfileOpen(true);
    } else {
      setShowProfile(p => !p);
    }
  };

  if (tenantLoading) return null;

  return (
    <div className='flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden'>
      {/* ════════════════════════════════════════════════
          COLUMN 1 — Conversations List
          Mobile: hidden when a conversation is selected
      ════════════════════════════════════════════════ */}
      <ConversationList
        conversations={conversations}
        loading={loadingConvs}
        selectedConv={selectedConv}
        onSelectConv={handleSelectConv}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        channelFilter={channelFilter}
        onChannelFilterChange={setChannelFilter}
        isConnected={isConnected}
      />

      {/* ════════════════════════════════════════════════
          COLUMN 2 — Messages Thread
          Mobile: shown only when conversation selected
      ════════════════════════════════════════════════ */}
      <div className={cn(
        'flex-1 flex-col bg-appbg min-w-0',
        selectedConv ? 'flex' : 'hidden lg:flex',
      )}>
        <MessageThread
          selectedConv={selectedConv}
          messages={messages}
          loading={loadingMsgs}
          onBack={() => setSelectedConv(null)}
          onToggleProfile={handleToggleProfile}
          showProfile={showProfile}
        />

        {/* Message input */}
        {selectedConv && (
          <MessageComposer
            messageInput={messageInput}
            onMessageChange={setMessageInput}
            onSend={handleSend}
            isSending={isSending}
            inputRef={inputRef}
          />
        )}
      </div>

      {/* ════════════════════════════════════════════════
          COLUMN 3 — Client Profile Panel (desktop inline)
      ════════════════════════════════════════════════ */}
      {selectedConv && showProfile && (
        <div className='hidden lg:block'>
          <CustomerProfilePanel
            customer={selectedConv.clients}
            memories={memories}
          />
        </div>
      )}

      {/* Mobile Profile Overlay */}
      {mobileProfileOpen && selectedConv && (
        <div className='fixed inset-0 z-50 lg:hidden bg-black/50 flex items-end'>
          <div className='w-full bg-sidebar rounded-t-2xl max-h-[80vh] overflow-hidden'>
            <div className='flex items-center justify-between p-4 border-b border-border'>
              <h3 className='font-semibold text-primary'>Perfil do Cliente</h3>
              <button
                onClick={() => setMobileProfileOpen(false)}
                className='p-2 rounded-lg text-muted hover:text-primary'
              >
                ✕
              </button>
            </div>
            <div className='overflow-y-auto max-h-[calc(80vh-80px)]'>
              <CustomerProfilePanel
                customer={selectedConv.clients}
                memories={memories}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}