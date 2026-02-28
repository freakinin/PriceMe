import { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, ChatThinkingBubble } from './ChatMessage';
import { CoachGate } from './CoachGate';
import { cn } from '@/lib/utils';
import type { CoachChatMessage } from '@/hooks/useCoach';

interface ChatPanelProps {
  history: CoachChatMessage[];
  onSend: (args: { message: string; session_id: string }) => Promise<CoachChatMessage>;
  isSending: boolean;
  error: string | null;
  chatPerDayLimit: number; // 0 = no access, -1 = unlimited
  chatDailyUsed: number;
}

// Stable session ID for the current page session
const SESSION_ID = crypto.randomUUID();

export function ChatPanel({
  history,
  onSend,
  isSending,
  error,
  chatPerDayLimit,
  chatDailyUsed,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change or while sending
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [history, isSending]);

  if (chatPerDayLimit === 0) {
    return (
      <CoachGate
        feature="chat"
        message="Chat with Coach requires Starter plan or higher."
      />
    );
  }

  const remaining = chatPerDayLimit === -1 ? null : chatPerDayLimit - chatDailyUsed;
  const atLimit = remaining !== null && remaining <= 0;

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isSending || atLimit) return;
    setInput('');
    await onSend({ message: msg, session_id: SESSION_ID });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
        <p className="text-sm font-medium">Chat with Coach</p>
        {remaining !== null && (
          <span className={cn('text-xs', remaining <= 2 ? 'text-amber-500 font-medium' : 'text-muted-foreground')}>
            {remaining} msg{remaining !== 1 ? 's' : ''} left today
          </span>
        )}
      </div>

      {/* Messages — takes all remaining height, scrolls internally */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
      >
        {history.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Ask anything about your shop.</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">
              Coach knows your products, costs, and sales.
            </p>
          </div>
        )}
        {history.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isSending && <ChatThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="px-4 pb-1 text-xs text-red-500 flex-shrink-0">{error}</p>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t flex-shrink-0">
        {atLimit ? (
          <p className="text-xs text-amber-600 text-center py-2">
            Daily limit reached. Resets tomorrow.
          </p>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Coach anything about your shop…"
              className="resize-none min-h-[40px] max-h-[120px] text-sm"
              rows={1}
              disabled={isSending}
            />
            <Button
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
