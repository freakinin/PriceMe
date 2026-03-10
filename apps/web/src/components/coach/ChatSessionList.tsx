import { useState } from 'react';
import { PenLine, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CoachChatSession } from '@/hooks/useCoach';

interface ChatSessionListProps {
  sessions: CoachChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isLoading,
}: ChatSessionListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    setIsCreating(true);
    try {
      await onNewChat();
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await onDeleteSession(sessionId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b border-warm-200">
        <Button
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full bg-brand-700 hover:bg-brand-500 text-white text-sm font-medium h-8 gap-1.5 transition-colors"
          size="sm"
        >
          <PenLine className="w-3.5 h-3.5" />
          {isCreating ? 'Starting…' : 'New Chat'}
        </Button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-2 rounded-md space-y-1.5">
                <Skeleton className="h-3.5 w-3/4 bg-warm-200" />
                <Skeleton className="h-2.5 w-1/3 bg-warm-200" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
            <MessageSquare className="w-6 h-6 text-warm-300 mb-2" />
            <p className="text-xs text-warm-500">No chats yet</p>
          </div>
        ) : (
          <ul className="px-1.5 space-y-0.5">
            {sessions.map((session) => {
              const isActive = session.session_id === activeSessionId;
              const isHovered = hoveredId === session.session_id;
              const isDeleting = deletingId === session.session_id;

              return (
                <li key={session.session_id}>
                  <button
                    onClick={() => onSelectSession(session.session_id)}
                    onMouseEnter={() => setHoveredId(session.session_id)}
                    onMouseLeave={() => setHoveredId(null)}
                    disabled={isDeleting}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-md transition-all duration-150 group',
                      'border-l-2',
                      isActive
                        ? 'bg-brand-100 border-brand-700'
                        : 'border-transparent hover:bg-warm-100',
                      isDeleting && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 min-w-0">
                      <span
                        className={cn(
                          'text-xs font-medium truncate leading-tight',
                          isActive ? 'text-warm-900' : 'text-warm-700'
                        )}
                      >
                        {session.title ?? 'New Chat'}
                      </span>

                      {(isHovered || isActive) && (
                        <button
                          onClick={(e) => handleDelete(e, session.session_id)}
                          disabled={isDeleting}
                          className={cn(
                            'shrink-0 p-0.5 rounded transition-colors',
                            'text-warm-400 hover:text-red-500 hover:bg-red-50'
                          )}
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-warm-500 mt-0.5">
                      {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
