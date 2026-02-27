import { RefreshCw, Sparkles, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsightCard } from './InsightCard';
import { CoachGate } from './CoachGate';
import { Skeleton } from '@/components/ui/skeleton';
import type { CoachInsight } from '@/hooks/useCoach';

interface InsightFeedProps {
  insights: CoachInsight[];
  isLoading: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onStatusChange: (args: { id: number; status: 'read' | 'dismissed' | 'done' }) => void;
  planInsightLimit: number; // 0 = no access
}

export function InsightFeed({
  insights,
  isLoading,
  isGenerating,
  onGenerate,
  onStatusChange,
  planInsightLimit,
}: InsightFeedProps) {
  if (planInsightLimit === 0) {
    return (
      <CoachGate
        feature="insights"
        message="Insight Feed requires a paid plan."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Inbox className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">No insights yet</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            Run an analysis to get specific, data-backed recommendations for your shop.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          )}
          {isGenerating ? 'Analyzing your shop…' : 'Analyze My Shop'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
