import React, { useRef } from 'react';
import { Send, Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageComposerProps {
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  placeholder?: string;
}

export function MessageComposer({
  messageInput,
  onMessageChange,
  onSend,
  isSending,
  inputRef,
  placeholder = "Digite uma mensagem como barbeiro...",
}: MessageComposerProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = inputRef ?? internalRef;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-sidebar px-4 lg:px-6 py-4">
      <div className="flex items-end gap-3">
        <textarea
          ref={textAreaRef}
          value={messageInput}
          onChange={e => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
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
          onClick={onSend}
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
  );
}