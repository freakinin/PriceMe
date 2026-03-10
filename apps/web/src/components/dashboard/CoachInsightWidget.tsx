import { Lightbulb, ArrowRight, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CoachInsight } from '@shared/types';

interface CoachInsightWidgetProps {
  insights: CoachInsight[];
  isLoading: boolean;
  hasProfile: boolean;
  onNavigate: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  pricing:      'Pricing',
  product_mix:  'Product Mix',
  cost:         'Cost',
  sales:        'Sales',
  margin:       'Margin',
};

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

export function CoachInsightWidget({ insights, isLoading, hasProfile, onNavigate }: CoachInsightWidgetProps) {
  const topInsight = insights
    .filter(i => i.status === 'unread')
    .sort((a, b) => a.priority - b.priority)[0] ?? null;

  return (
    <Card className="border-border border-t-[3px] border-t-brand-500 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">Top Insight</CardTitle>
            <CardDescription className="text-xs">Latest from your AI Coach</CardDescription>
          </div>
          <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-brand-700" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!hasProfile ? (
          <div className="text-center py-2 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Set up your Coach profile to receive AI-powered pricing insights.
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={onNavigate}>
              Set up Coach
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ) : !topInsight ? (
          <div className="text-center py-2 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              No new insights yet. Generate them from your Coach page.
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={onNavigate}>
              Open Coach
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            {/* Category chip + impact */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-brand-100 text-brand-700">
                {categoryLabel(topInsight.category)}
              </span>
              {topInsight.impact_estimate && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <Zap className="h-3 w-3" />
                  {topInsight.impact_estimate}
                </span>
              )}
            </div>

            {/* Headline */}
            <p className="text-sm font-semibold text-foreground leading-snug">
              {topInsight.headline}
            </p>

            {/* Action */}
            <p className={cn(
              'text-xs text-muted-foreground leading-relaxed',
              'line-clamp-2',
            )}>
              {topInsight.action}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                {insights.filter(i => i.status === 'unread').length} unread insight{insights.filter(i => i.status === 'unread').length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={onNavigate}
                className="flex items-center gap-1 text-xs text-brand-700 hover:text-brand-900 font-medium transition-colors"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
