import { useState } from 'react';
import { Check, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { UsageBar } from '@/components/subscription/UsageBar';
import { PLAN_ORDER, PLAN_DISPLAY, PLAN_LIMITS, type PlanName } from '@/config/plans';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const QA_MODE = import.meta.env.VITE_QA_MODE === 'true';

function limitLabel(val: number): string {
  return val === -1 ? 'Unlimited' : String(val);
}

function PlanCard({
  plan,
  isCurrentPlan,
  currentPlan,
  onUpgrade,
  isLoading,
}: {
  plan: PlanName;
  isCurrentPlan: boolean;
  currentPlan: PlanName;
  onUpgrade: (plan: PlanName) => void;
  isLoading: boolean;
}) {
  const display = PLAN_DISPLAY[plan];
  const limits = PLAN_LIMITS[plan];
  const isUpgrade = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(currentPlan);
  const isDowngrade = PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(currentPlan);

  return (
    <div
      className={`relative rounded-xl border p-4 flex flex-col gap-3 transition-all ${
        isCurrentPlan
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/50'
      }`}
    >
      {display.badge && !isCurrentPlan && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground">{display.badge}</Badge>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary text-primary bg-background">
            Current Plan
          </Badge>
        </div>
      )}

      <div>
        <p className="font-semibold text-base">{display.name}</p>
        <p className="text-2xl font-bold mt-1">
          {display.priceMonthly}
          {plan !== 'free' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
        </p>
        {display.priceAnnual && (
          <p className="text-xs text-muted-foreground mt-0.5">
            or {display.priceAnnual}/mo · {display.priceAnnualNote}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{display.description}</p>

      <ul className="space-y-1.5 text-sm flex-1">
        <li className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>{limitLabel(limits.products)} products</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>{limitLabel(limits.competitors)} competitor slots</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>Unlimited materials &amp; costs</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>Unlimited sales tracking</span>
        </li>
      </ul>

      <div className="mt-auto">
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isUpgrade ? 'default' : 'outline'}
            onClick={() => onUpgrade(plan)}
            disabled={isLoading}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : isUpgrade
                ? `Upgrade to ${display.name}`
                : isDowngrade
                  ? `Downgrade to ${display.name}`
                  : 'Switch to Free'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SubscriptionSettings() {
  const { subscription, isLoading } = useSubscription();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [switchingPlan, setSwitchingPlan] = useState<PlanName | null>(null);

  const handleSwitch = async (plan: PlanName) => {
    setSwitchingPlan(plan);
    try {
      await api.post('/subscription/assign', { plan });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ variant: 'success', title: 'Plan updated', description: `You are now on the ${PLAN_DISPLAY[plan].name} plan.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to switch plan', description: err.message });
    } finally {
      setSwitchingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? 'free';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Current plan header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Subscription</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              You are on the{' '}
              <span className="font-medium text-foreground capitalize">{currentPlan}</span> plan
              {subscription?.status && subscription.status !== 'active' && (
                <Badge variant="secondary" className="ml-2 text-xs capitalize">
                  {subscription.status}
                </Badge>
              )}
            </p>
          </div>
          {QA_MODE && (
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              QA Mode — limits reduced
            </Badge>
          )}
        </div>

        {/* Usage snapshot */}
        <div className="space-y-4 max-w-md">
          <p className="text-sm font-medium">Current Usage</p>
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

        <Separator />

        {/* Plan comparison grid */}
        <div>
          <p className="text-sm font-medium mb-4">All Plans</p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {PLAN_ORDER.map((plan) => (
              <PlanCard
                key={plan}
                plan={plan}
                isCurrentPlan={plan === currentPlan}
                currentPlan={currentPlan}
                onUpgrade={handleSwitch}
                isLoading={switchingPlan === plan}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Payment processing coming soon. Plan switches are free during this period.
        </p>
      </div>
    </div>
  );
}
