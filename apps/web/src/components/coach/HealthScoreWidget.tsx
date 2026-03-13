import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { HealthScore } from '@/hooks/useCoach';

interface HealthScoreWidgetProps {
  score: HealthScore | null;
  isLoading?: boolean;
}

const DIMENSIONS: {
  key: keyof Pick<HealthScore, 'margin_health' | 'pricing_confidence' | 'product_mix' | 'sales_velocity'>;
  label: string;
  description: string;
}[] = [
  { key: 'margin_health',      label: 'Margins',  description: 'Avg profit margin across all products' },
  { key: 'pricing_confidence', label: 'Pricing',  description: 'Products with prices, methods & competitor data' },
  { key: 'product_mix',        label: 'Mix',      description: 'Catalog diversity & revenue distribution' },
  { key: 'sales_velocity',     label: 'Velocity', description: 'Sales pace vs. your goal or units per product' },
];

interface StatusInfo {
  label: string;
  chipClass: string;
  barClass: string;
  textClass: string;
}

function getStatus(score: number): StatusInfo {
  if (score >= 20) return { label: 'Excellent',   chipClass: 'bg-emerald-100 text-emerald-700', barClass: 'bg-emerald-500', textClass: 'text-emerald-600' };
  if (score >= 15) return { label: 'Good',         chipClass: 'bg-sky-100 text-sky-700',         barClass: 'bg-sky-500',     textClass: 'text-sky-600'     };
  if (score >= 10) return { label: 'Fair',          chipClass: 'bg-amber-100 text-amber-700',     barClass: 'bg-amber-400',   textClass: 'text-amber-600'   };
  return              { label: 'Needs work',    chipClass: 'bg-red-100 text-red-700',         barClass: 'bg-red-400',     textClass: 'text-red-600'     };
}

function overallColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

export function HealthScoreWidget({ score, isLoading }: HealthScoreWidgetProps) {
  if (isLoading || !score) {
    return (
      <div className="space-y-3 p-1">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="flex items-baseline gap-2">
        <span className={cn('text-4xl font-bold tabular-nums leading-none', overallColor(score.overall))}>
          {score.overall}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        {DIMENSIONS.map(dim => {
          const val = score[dim.key] as number;
          const pct = Math.round((val / 25) * 100);
          const status = getStatus(val);
          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-foreground">{dim.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{dim.description}</span>
                </div>
                <span className={cn(
                  'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  status.chipClass,
                )}>
                  {status.label}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', status.barClass)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed border-t border-border pt-3">
        Score reflects your actual business data — margins, prices, and sales. It updates as your catalog improves, not when insights are marked done.
      </p>
    </div>
  );
}
