import { ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import { UsageBar } from '@/components/subscription/UsageBar';

interface UsageSettingsProps {
  onViewSubscription?: () => void;
}

export function UsageSettings({ onViewSubscription }: UsageSettingsProps) {
  const { subscription, isLoading, isAtLimit } = useSubscription();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const hasAnyLimit = isAtLimit('products') || isAtLimit('competitors');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Usage</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Your current usage on the{' '}
            <span className="font-medium capitalize text-foreground">
              {subscription?.plan ?? 'Free'}
            </span>{' '}
            plan.
          </p>

          <div className="space-y-5 max-w-md">
            <UsageBar
              label="Products"
              current={subscription?.usage.products ?? 0}
              limit={subscription?.limits.products ?? 10}
            />
            <UsageBar
              label="Competitor Tracking"
              current={subscription?.usage.competitors ?? 0}
              limit={subscription?.limits.competitors ?? 2}
            />
          </div>
        </div>

        {hasAnyLimit && onViewSubscription && (
          <div className="rounded-lg border border-secondary/40 bg-secondary/10 p-4 max-w-md">
            <p className="text-sm font-medium mb-1">You're running low on resources</p>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade your plan to increase your limits and keep growing.
            </p>
            <Button size="sm" variant="secondary" onClick={onViewSubscription}>
              View Subscription Plans
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
