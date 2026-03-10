import { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, ChatThinkingBubble } from './ChatMessage';
import { ChatSessionList } from './ChatSessionList';
import { CoachGate } from './CoachGate';
import { cn } from '@/lib/utils';
import type { CoachChatMessage, CoachChatSession } from '@/hooks/useCoach';

interface ChatPanelProps {
  history: CoachChatMessage[];
  sessions: CoachChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onSend: (args: { message: string; session_id: string }) => Promise<CoachChatMessage>;
  isSending: boolean;
  isCreatingSession: boolean;
  isChatSessionsLoading: boolean;
  error: string | null;
  chatPerDayLimit: number; // 0 = no access, -1 = unlimited
  chatDailyUsed: number;
}

export function ChatPanel({
  history,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onSend,
  isSending,
  isCreatingSession,
  isChatSessionsLoading,
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
    if (!msg || isSending || atLimit || !activeSessionId) return;
    setInput('');
    await onSend({ message: msg, session_id: activeSessionId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 border rounded-lg overflow-hidden bg-white">
      {/* Sessions sidebar */}
      <div className="w-[200px] shrink-0 border-r border-warm-200 bg-warm-50 flex flex-col">
        <ChatSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onNewChat={onNewChat}
          onDeleteSession={onDeleteSession}
          isLoading={isChatSessionsLoading}
          isCreating={isCreatingSession}
        />
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-warm-200 flex items-center justify-between flex-shrink-0">
          <p className="text-sm font-medium text-warm-900 truncate">
            {activeSessionId
              ? (sessions.find(s => s.session_id === activeSessionId)?.title ?? 'Chat with Coach')
              : 'Chat with Coach'}
          </p>
          {remaining !== null && (
            <span className={cn('text-xs shrink-0 ml-2', remaining <= 2 ? 'text-amber-500 font-medium' : 'text-muted-foreground')}>
              {remaining} msg{remaining !== 1 ? 's' : ''} left today
            </span>
          )}
        </div>

        {/* Messages — takes all remaining height, scrolls internally */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
        >
          {!activeSessionId ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Select a chat or start a new one.</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Ask anything about your shop.</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-70">
                Coach knows your products, costs, and sales.
              </p>
            </div>
          ) : null}
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
        <div className="px-4 py-3 border-t border-warm-200 flex-shrink-0">
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
                placeholder={activeSessionId ? 'Ask Coach anything about your shop…' : 'Start a new chat first…'}
                className="resize-none min-h-[40px] max-h-[120px] text-sm"
                rows={1}
                disabled={isSending || !activeSessionId}
              />
              <Button
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isSending || !activeSessionId}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
