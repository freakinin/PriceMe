import { BrainCircuit, ArrowRight, AlertTriangle } from 'lucide-react';
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

type DimensionKey = 'margin_health' | 'pricing_confidence' | 'product_mix' | 'sales_velocity';

interface Dimension {
  key: DimensionKey;
  label: string;
  messages: [string, string, string, string]; // needs-work, fair, good, excellent
}

const DIMENSIONS: Dimension[] = [
  {
    key: 'margin_health',
    label: 'Margins',
    messages: [
      'Average margin is below 20% — add costs to products',
      'Margins improving — aim for 50%+ for a healthy business',
      'Solid margins across your catalog',
      'Excellent margins',
    ],
  },
  {
    key: 'pricing_confidence',
    label: 'Pricing',
    messages: [
      'Most products are unpriced or missing pricing methods',
      'Add prices and competitor tracking to more products',
      'Good pricing coverage across your catalog',
      'Fully priced and researched catalog',
    ],
  },
  {
    key: 'product_mix',
    label: 'Mix',
    messages: [
      'Revenue depends heavily on 1–2 products',
      'Diversify your catalog to reduce concentration risk',
      'Healthy spread of products and revenue',
      'Well-balanced catalog',
    ],
  },
  {
    key: 'sales_velocity',
    label: 'Velocity',
    messages: [
      'No sales recorded yet — track your first sale',
      'Selling below your goal pace',
      'On track for your revenue goal',
      'Exceeding your revenue goal',
    ],
  },
];

interface StatusInfo {
  label: string;
  dotClass: string;
  textClass: string;
  msgIndex: 0 | 1 | 2 | 3;
}

function getStatus(score: number): StatusInfo {
  if (score >= 20) return { label: 'Excellent', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700', msgIndex: 3 };
  if (score >= 15) return { label: 'Good',      dotClass: 'bg-sky-500',     textClass: 'text-sky-700',     msgIndex: 2 };
  if (score >= 10) return { label: 'Fair',       dotClass: 'bg-amber-400',   textClass: 'text-amber-700',   msgIndex: 1 };
  return              { label: 'Needs work',  dotClass: 'bg-red-500',     textClass: 'text-red-700',     msgIndex: 0 };
}

function overallColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

export function CoachHealthWidget({ healthScore, isLoading, hasProfile, onNavigate }: CoachHealthWidgetProps) {
  const focusDimension = healthScore
    ? DIMENSIONS.slice().sort((a, b) => (healthScore[a.key] as number) - (healthScore[b.key] as number))[0]
    : null;

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
          <div className="space-y-3">
            <Skeleton className="h-8 w-16" />
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-5 w-full rounded" />)}
          </div>
        ) : (
          <>
            {/* Score + dimension status side by side */}
            <div className="flex gap-4 items-start">
              {/* Overall score */}
              <div className="flex-shrink-0 pt-0.5">
                <span className={cn('text-4xl font-bold tabular-nums leading-none', overallColor(healthScore.overall))}>
                  {healthScore.overall}
                </span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">/ 100</p>
              </div>

              {/* 4 dimension chips */}
              <div className="flex-1 space-y-1.5">
                {DIMENSIONS.map(dim => {
                  const val = healthScore[dim.key] as number;
                  const status = getStatus(val);
                  return (
                    <div key={dim.key} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{dim.label}</span>
                      <span className={cn('flex items-center gap-1 text-[11px] font-semibold', status.textClass)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', status.dotClass)} />
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Focus area callout */}
            {focusDimension && (() => {
              const val = healthScore[focusDimension.key] as number;
              const status = getStatus(val);
              const msg = focusDimension.messages[status.msgIndex];
              const isWeak = status.msgIndex <= 1;
              return (
                <div className={cn(
                  'rounded-lg px-3 py-2 text-xs leading-snug',
                  isWeak
                    ? 'bg-amber-50 border border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800',
                )}>
                  <span className="font-semibold">{focusDimension.label}: </span>
                  {msg}
                </div>
              );
            })()}

            {/* Footer */}
            <button
              type="button"
              onClick={onNavigate}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              Full breakdown in Coach
              <ArrowRight className="h-3 w-3" />
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
