import { cn } from '@/lib/utils';

interface UsageBarProps {
  label: string;
  current: number;
  limit: number; // -1 = unlimited
  className?: string;
}

export function UsageBar({ label, current, limit, className }: UsageBarProps) {
  const isUnlimited = limit === -1;
  const percent = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            'font-medium tabular-nums',
            isAtLimit && 'text-destructive',
            isNearLimit && !isAtLimit && 'text-secondary-foreground',
          )}
        >
          {isUnlimited ? `${current} / Unlimited` : `${current} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-secondary' : 'bg-primary',
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
