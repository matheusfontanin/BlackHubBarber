import { useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
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
  placeholder = 'Digite uma mensagem...',
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
    <div className="border-t border-line bg-white px-4 lg:px-6 py-4 shrink-0">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textAreaRef}
          value={messageInput}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 input resize-none py-3 text-sm min-h-[44px] max-h-[120px]"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const el = e.target as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={onSend}
          disabled={!messageInput.trim() || isSending}
          className={cn(
            'p-3 rounded-xl transition-colors shrink-0',
            messageInput.trim()
              ? 'bg-[#BE9B64] text-white hover:bg-[#9C7B47]'
              : 'bg-[#F3F3F1] text-ink-faint cursor-not-allowed',
          )}
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
