import { useState } from 'react';
import { Check, Zap, Loader2, Gift } from 'lucide-react';
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
        {plan !== 'free' && (
          <p className="text-xs text-muted-foreground mt-0.5">
            or {display.priceAnnual}/mo · {display.priceAnnualTotal} billed annually
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

  const currentPlan   = subscription?.plan ?? 'free';
  const trialEndsAt   = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const trialExpired  = trialEndsAt ? trialEndsAt < new Date() : false;
  const trialDaysLeft = trialEndsAt && !trialExpired
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

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

        {/* Trial countdown — active */}
        {trialEndsAt && !trialExpired && (
          <div className="rounded-xl border border-brand-500/30 bg-brand-100 p-4 flex items-start gap-3">
            <Gift className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-900 text-sm">
                Pro Trial · {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
              </p>
              <p className="text-xs text-brand-700 mt-0.5">
                Ends {trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                You're one of our early adopters — thank you for being here.
              </p>
            </div>
          </div>
        )}

        {/* Trial expired — upgrade prompt */}
        {trialEndsAt && trialExpired && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-start gap-3">
            <Gift className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">You were one of our first — thank you.</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your free 6-month Pro trial has ended. Your account is now on the Free plan.
                We'd love your feedback on what worked and what didn't — no obligation, but it means a lot.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => handleSwitch('pro')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  Upgrade to Pro →
                </button>
              </div>
            </div>
          </div>
        )}

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
