import { useState, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/useTenant';
import { Conversation, ConversationStatus, ConversationChannel } from '@/services/chatService';
import { useConversations } from './hooks/useConversations';
import { useMessages } from './hooks/useMessages';
import { useSendMessage } from './hooks/useSendMessage';
import { useCustomerMemories } from './hooks/useCustomerMemories';
import { useToggleConversationAI } from './hooks/useToggleConversationAI';
import { useAIGlobalSwitch } from '@/hooks/queries/useAIGlobalSwitch';
import { ConversationList } from './components/ConversationList';
import { MessageThread } from './components/MessageThread';
import { MessageComposer } from './components/MessageComposer';
import { CustomerProfilePanel } from './components/CustomerProfilePanel';

export default function ChatPage() {
  const { tenantId, loading: tenantLoading } = useTenant();

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<ConversationChannel | ''>('');
  const [messageInput, setMessageInput] = useState('');
  const [showProfile, setShowProfile] = useState(true);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { conversations, loading: loadingConvs, isConnected, refetch: refetchConversations } = useConversations();
  const { messages, loading: loadingMsgs } = useMessages(selectedConv);
  const { sendMessage, isSending } = useSendMessage(selectedConv, () => {
    setMessageInput('');
    inputRef.current?.focus();
    refetchConversations();
  });
  const { memories } = useCustomerMemories(selectedConv?.client_id || null);
  const { aiEnabled, loading: globalLoading, toggleAIGlobal } = useAIGlobalSwitch(tenantId);
  const toggleConversationAI = useToggleConversationAI(tenantId);

  const handleSelectConv = (conv: Conversation) => setSelectedConv(conv);

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    await sendMessage(messageInput.trim());
  };

  const handleToggleProfile = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setMobileProfileOpen(true);
    } else {
      setShowProfile((p) => !p);
    }
  };

  const handleToggleConversationAI = async (enabled: boolean) => {
    if (!selectedConv) return;
    await toggleConversationAI(selectedConv.id, enabled);
    setSelectedConv({ ...selectedConv, ai_enabled: enabled });
    refetchConversations();
  };

  const handleToggleGlobalAI = async () => {
    if (typeof aiEnabled === 'undefined') return;
    const nextState = !aiEnabled;
    const confirmed = window.confirm(
      `Tem certeza? Isso ${nextState ? 'ativará' : 'pausará'} a IA em todas as conversas.`,
    );
    if (!confirmed) return;
    await toggleAIGlobal(nextState);
  };

  if (tenantLoading) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen overflow-hidden bg-app">
      <div className="hidden lg:flex items-center justify-between gap-3 bg-white border-b border-line px-6 py-4 w-full shrink-0">
        <div>
          <p className="page-eyebrow">Atendimento</p>
          <h1 className="text-xl font-bold text-ink tracking-tight">Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          {globalLoading ? (
            <Loader2 size={18} className="animate-spin text-[#BE9B64]" />
          ) : (
            <button
              type="button"
              onClick={handleToggleGlobalAI}
              disabled={typeof aiEnabled === 'undefined'}
              className={cn(
                'inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold border transition-colors',
                aiEnabled
                  ? 'bg-[#E8F6F0] text-[#11895C] border-[#11895C]/20 hover:bg-[#DCF0E6]'
                  : 'bg-[#FFF4DE] text-[#B67A18] border-[#B67A18]/20 hover:bg-[#FCEBC6]',
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', aiEnabled ? 'bg-[#11895C]' : 'bg-[#B67A18]')} />
              {aiEnabled ? 'IA global ativa' : 'IA global pausada'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
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

        <div
          className={cn(
            'flex-1 flex-col bg-app min-w-0',
            selectedConv ? 'flex' : 'hidden lg:flex',
          )}
        >
          <MessageThread
            selectedConv={selectedConv}
            messages={messages}
            loading={loadingMsgs}
            onBack={() => setSelectedConv(null)}
            onToggleProfile={handleToggleProfile}
            onToggleAI={handleToggleConversationAI}
            showProfile={showProfile}
          />

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

        {selectedConv && showProfile && (
          <div className="hidden lg:block">
            <CustomerProfilePanel customer={selectedConv.clients} memories={memories} />
          </div>
        )}

        {mobileProfileOpen && selectedConv && (
          <div className="fixed inset-0 z-50 lg:hidden bg-[#12100D]/40 backdrop-blur-sm flex items-end">
            <div className="w-full bg-white rounded-t-[20px] max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <h3 className="text-base font-bold text-ink">Perfil do cliente</h3>
                <button
                  onClick={() => setMobileProfileOpen(false)}
                  aria-label="Fechar"
                  className="btn-icon"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto">
                <CustomerProfilePanel customer={selectedConv.clients} memories={memories} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
