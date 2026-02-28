import { useState } from 'react';
import { MinusCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const isDone = insight.status === 'done';
  const priority = PRIORITY_LABEL[insight.priority] ?? PRIORITY_LABEL[7];
  const categoryClass = CATEGORY_COLORS[insight.category] ?? 'bg-muted text-muted-foreground';

  const handleToggle = () => {
    setOpen((v) => !v);
    if (insight.status === 'unread') onStatusChange({ id: insight.id, status: 'read' });
  };

  const handleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDone) onStatusChange({ id: insight.id, status: 'done' });
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange({ id: insight.id, status: 'dismissed' });
  };

  return (
    <div className={cn(
      'rounded-lg border bg-card transition-all',
      isDone && 'opacity-50 border-dashed',
    )}>
      {/* Always-visible header row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={handleToggle}
      >
        {/* Checkbox */}
        <button
          onClick={handleDone}
          className={cn(
            'flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
            isDone
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/40 hover:border-primary',
          )}
          title={isDone ? 'Done' : 'Mark as done'}
        >
          {isDone && (
            <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge className={cn('text-[10px] px-1.5 py-0', priority.className)}>{priority.label}</Badge>
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 capitalize', categoryClass)}>
            {insight.category}
          </Badge>
        </div>

        {/* Headline */}
        <p className={cn(
          'flex-1 text-sm font-medium leading-snug truncate',
          isDone && 'line-through text-muted-foreground',
        )}>
          {insight.headline}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            title="Dismiss"
            onClick={handleDismiss}
          >
            <MinusCircle className="h-3.5 w-3.5" />
          </Button>
          <span className="text-muted-foreground/40">
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        </div>
      </div>

      {/* Expandable detail */}
      {open && !isDone && (
        <div className="px-3 pb-3 space-y-2.5 border-t pt-2.5">
          {/* Product tag if present */}
          {insight.related_product_name && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 truncate max-w-[200px]">
              {insight.related_product_name}
            </Badge>
          )}

          {/* Body */}
          <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>

          {/* Action */}
          <div className="flex items-start gap-2 rounded-md bg-primary/8 px-3 py-2">
            <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
            <p className="text-xs font-medium text-primary">{insight.action}</p>
          </div>

          {/* Impact */}
          {insight.impact_estimate && (
            <div className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 rounded px-2 py-0.5">
              {insight.impact_estimate}
            </div>
          )}
        </div>
      )}

      {/* Done state expanded detail */}
      {open && isDone && (
        <div className="px-3 pb-2.5 border-t pt-2 text-xs text-muted-foreground italic">
          Marked as done
        </div>
      )}
    </div>
  );
}
