import { BrainCircuit, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { HealthScore } from '@priceme/shared';

interface CoachHealthWidgetProps {
  healthScore: HealthScore | null;
  isLoading: boolean;
  hasProfile: boolean;
  onNavigate: () => void;
}

const DIMENSIONS: { key: keyof Pick<HealthScore, 'margin_health' | 'pricing_confidence' | 'product_mix' | 'sales_velocity'>; label: string }[] = [
  { key: 'margin_health',        label: 'Margin Health' },
  { key: 'pricing_confidence',   label: 'Pricing Confidence' },
  { key: 'product_mix',          label: 'Product Mix' },
  { key: 'sales_velocity',       label: 'Sales Velocity' },
];

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-500';
}

function barColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

export function CoachHealthWidget({ healthScore, isLoading, hasProfile, onNavigate }: CoachHealthWidgetProps) {
  return (
    <Card className="border-border border-t-[3px] border-t-violet-500 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">Business Health</CardTitle>
            <CardDescription className="text-xs">AI-powered score from your Coach</CardDescription>
          </div>
          <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <BrainCircuit className="h-4 w-4 text-violet-600" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!hasProfile ? (
          <div className="text-center py-2 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Set up your Coach profile to get a real-time business health score.
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={onNavigate}>
              Set up Coach
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : isLoading || !healthScore ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Overall score */}
            <div className="flex items-end gap-1.5">
              <span className={cn('text-4xl font-bold tabular-nums leading-none', scoreColor(healthScore.overall))}>
                {healthScore.overall}
              </span>
              <span className="text-sm text-muted-foreground mb-0.5">/ 100</span>
            </div>

            {/* Dimension bars */}
            <div className="space-y-2 pt-1">
              {DIMENSIONS.map(({ key, label }) => {
                const raw = healthScore[key];
                const pct = Math.round((raw / 25) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[11px] text-muted-foreground">{label}</span>
                      <span className="text-[11px] font-medium tabular-nums">{raw}/25</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', barColor(pct))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer link */}
            <button
              type="button"
              onClick={onNavigate}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors pt-1"
            >
              Open Coach
              <ArrowRight className="h-3 w-3" />
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
