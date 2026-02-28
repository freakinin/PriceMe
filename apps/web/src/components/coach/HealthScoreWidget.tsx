import { Skeleton } from '@/components/ui/skeleton';
import type { HealthScore } from '@/hooks/useCoach';

interface HealthScoreWidgetProps {
  score: HealthScore | null;
  isLoading?: boolean;
}

const DIMENSIONS: { key: keyof HealthScore; label: string }[] = [
  { key: 'margin_health', label: 'Margins' },
  { key: 'pricing_confidence', label: 'Pricing' },
  { key: 'product_mix', label: 'Mix' },
  { key: 'sales_velocity', label: 'Velocity' },
];

function scoreColor(score: number, max = 100) {
  const pct = (score / max) * 100;
  if (pct >= 70) return 'text-green-600';
  if (pct >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function barColor(score: number, max = 25) {
  const pct = (score / max) * 100;
  if (pct >= 70) return 'bg-green-500';
  if (pct >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

export function HealthScoreWidget({ score, isLoading }: HealthScoreWidgetProps) {
  if (isLoading || !score) {
    return (
      <div className="flex items-center gap-6 p-1">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 grid grid-cols-4 gap-3">
          {DIMENSIONS.map((d) => (
            <Skeleton key={d.key} className="h-8 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      {/* Overall score */}
      <div className="flex-shrink-0 text-center w-14">
        <span className={`text-3xl font-bold tabular-nums ${scoreColor(score.overall)}`}>
          {score.overall}
        </span>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mt-0.5">Score</p>
      </div>

      <div className="h-10 w-px bg-border" />

      {/* Sub-scores */}
      <div className="flex-1 grid grid-cols-4 gap-3">
        {DIMENSIONS.map((d) => {
          const val = score[d.key] as number;
          const pct = Math.round((val / 25) * 100);
          return (
            <div key={d.key} className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-muted-foreground">{d.label}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${scoreColor(val, 25)}`}>{val}/25</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor(val)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
