import { Check, X, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CoachInsight } from '@/hooks/useCoach';

interface InsightCardProps {
  insight: CoachInsight;
  onStatusChange: (args: { id: number; status: 'read' | 'dismissed' | 'done' }) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  margin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pricing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  mix: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  velocity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cost: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const PRIORITY_LABEL: Record<number, { label: string; className: string }> = {
  1: { label: 'Critical', className: 'bg-red-500 text-white' },
  2: { label: 'Critical', className: 'bg-red-500 text-white' },
  3: { label: 'High', className: 'bg-orange-500 text-white' },
  4: { label: 'High', className: 'bg-orange-500 text-white' },
  5: { label: 'Medium', className: 'bg-amber-400 text-amber-900' },
  6: { label: 'Medium', className: 'bg-amber-400 text-amber-900' },
  7: { label: 'Low', className: 'bg-muted text-muted-foreground' },
};

export function InsightCard({ insight, onStatusChange }: InsightCardProps) {
  const priority = PRIORITY_LABEL[insight.priority] ?? PRIORITY_LABEL[7];
  const categoryClass = CATEGORY_COLORS[insight.category] ?? 'bg-muted text-muted-foreground';

  return (
    <div className={cn(
      'rounded-lg border bg-card p-4 space-y-3 transition-opacity',
      insight.status === 'read' && 'opacity-70',
    )}
      onClick={() => {
        if (insight.status === 'unread') onStatusChange({ id: insight.id, status: 'read' });
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={cn('text-[10px] px-1.5 py-0', priority.className)}>{priority.label}</Badge>
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 capitalize', categoryClass)}>
            {insight.category}
          </Badge>
          {insight.related_product_name && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 truncate max-w-[140px]">
              {insight.related_product_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-green-600"
            title="Mark done"
            onClick={(e) => { e.stopPropagation(); onStatusChange({ id: insight.id, status: 'done' }); }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-red-500"
            title="Dismiss"
            onClick={(e) => { e.stopPropagation(); onStatusChange({ id: insight.id, status: 'dismissed' }); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Headline */}
      <p className="font-semibold text-sm leading-snug">{insight.headline}</p>

      {/* Body */}
      <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>

      {/* Action */}
      <div className="flex items-start gap-2 rounded-md bg-primary/8 px-3 py-2">
        <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
        <p className="text-xs font-medium text-primary">{insight.action}</p>
      </div>

      {/* Impact estimate */}
      {insight.impact_estimate && (
        <div className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 rounded px-2 py-0.5">
          {insight.impact_estimate}
        </div>
      )}
    </div>
  );
}
