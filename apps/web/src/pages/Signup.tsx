import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Check, ArrowRight, ArrowLeft,
  Sprout, TrendingUp, Zap, Star,
  ChevronDown, X, Gift, Ticket,
} from 'lucide-react';
import { CravioIcon } from '@/components/CravioIcon';
import api from '@/lib/api';
import { track, identify } from '@/lib/analytics';
import { PLAN_ORDER, PLAN_DISPLAY } from '@/config/plans';
import type { PlanName } from '@/config/plans';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────── */
/*  Form schema                                */
/* ─────────────────────────────────────────── */
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type SignupFormValues = z.infer<typeof signupSchema>;

/* ─────────────────────────────────────────── */
/*  Per-plan visual config                     */
/* ─────────────────────────────────────────── */
const PLAN_STYLE: Record<PlanName, {
  icon: typeof Sprout;
  topBorder: string;
  iconBg: string;
  iconColor: string;
  selectedRing: string;
  cta: string;
}> = {
  free: {
    icon: Sprout,
    topBorder:    'border-t-warm-200',
    iconBg:       'bg-warm-100',
    iconColor:    'text-warm-500',
    selectedRing: 'ring-warm-500 border-warm-500',
    cta:          'Get started free',
  },
  starter: {
    icon: TrendingUp,
    topBorder:    'border-t-primary',
    iconBg:       'bg-primary/10',
    iconColor:    'text-primary',
    selectedRing: 'ring-primary border-primary',
    cta:          'Start Starter',
  },
  growth: {
    icon: Zap,
    topBorder:    'border-t-brand-500',
    iconBg:       'bg-brand-100',
    iconColor:    'text-brand-500',
    selectedRing: 'ring-brand-500 border-brand-500',
    cta:          'Start Growth',
  },
  pro: {
    icon: Star,
    topBorder:    'border-t-brand-900',
    iconBg:       'bg-brand-100',
    iconColor:    'text-brand-900',
    selectedRing: 'ring-brand-900 border-brand-900',
    cta:          'Start Pro',
  },
};

/* ─────────────────────────────────────────── */
/*  6 highlight features per plan card         */
/* ─────────────────────────────────────────── */
const PLAN_CARD_FEATURES: Record<PlanName, { label: string; value: string }[]> = {
  free: [
    { label: 'Products',        value: '5 products' },
    { label: 'Variations',      value: 'None' },
    { label: 'Competitors',     value: '1 per product' },
    { label: 'AI Insights',     value: '3 insights' },
    { label: 'AI Reports',      value: 'None' },
    { label: 'Finance Metrics', value: 'Price + Margin' },
  ],
  starter: [
    { label: 'Products',        value: '10 products' },
    { label: 'Variations',      value: '1 per product' },
    { label: 'Competitors',     value: '3 per product' },
    { label: 'AI Insights',     value: '5 insights' },
    { label: 'AI Reports',      value: '2 reports/mo' },
    { label: 'Finance Metrics', value: 'Full access' },
  ],
  growth: [
    { label: 'Products',        value: '30 products' },
    { label: 'Variations',      value: '2 per product' },
    { label: 'Competitors',     value: '5 per product' },
    { label: 'AI Insights',     value: 'Full access' },
    { label: 'AI Reports',      value: 'Full access' },
    { label: 'Finance Metrics', value: 'Full access' },
  ],
  pro: [
    { label: 'Products',        value: 'Unlimited' },
    { label: 'Variations',      value: 'Unlimited' },
    { label: 'Competitors',     value: 'Unlimited' },
    { label: 'AI Insights',     value: 'Full access' },
    { label: 'AI Reports',      value: 'Full access' },
    { label: 'Finance Metrics', value: 'Full access' },
  ],
};

/* ─────────────────────────────────────────── */
/*  Full comparison table rows                 */
/* ─────────────────────────────────────────── */
const COMPARISON_ROWS: { label: string; values: [string, string, string, string] }[] = [
  { label: 'Products',           values: ['5',              '10',            '30',            'Unlimited']  },
  { label: 'Product Variations', values: ['None',           '1 per product', '2 per product', 'Unlimited']  },
  { label: 'Materials',          values: ['Unlimited',      'Unlimited',     'Unlimited',     'Unlimited']  },
  { label: 'Competitors',        values: ['1 per product',  '3 per product', '5 per product', 'Unlimited']  },
  { label: 'AI Coach Insights',  values: ['3 insights',     '5 insights',    'Full access',   'Full access'] },
  { label: 'AI Reports',         values: ['None',           '2 reports/mo',  'Full access',   'Full access'] },
  { label: 'AI Chat',            values: ['None',           'Included',      'Included',      'Included']   },
  { label: 'Finance Metrics',    values: ['Price + Margin', 'Full access',   'Full access',   'Full access'] },
  { label: 'Tax Metrics',        values: ['None',           'Included',      'Included',      'Included']   },
  { label: 'Platform Fees',      values: ['1 store',        'Unlimited',     'Unlimited',     'Unlimited']  },
  { label: 'Shipping Methods',   values: ['1 method',       'Unlimited',     'Unlimited',     'Unlimited']  },
];

const POSITIVE_KEYWORDS = ['unlimited', 'included', 'full access', 'free'];

function ComparisonCell({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const isNone = lower === 'none';
  const isPositive = POSITIVE_KEYWORDS.some((k) => lower.includes(k));

  if (isNone) {
    return (
      <span className="flex items-center justify-center">
        <X className="h-3.5 w-3.5 text-muted-foreground/30" />
      </span>
    );
  }
  if (isPositive) {
    return (
      <span className="flex flex-col items-center gap-0.5">
        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
        {lower !== 'unlimited' && lower !== 'included' && (
          <span className="text-[10px] text-muted-foreground leading-tight">{value}</span>
        )}
      </span>
    );
  }
  return <span className="text-xs text-foreground/80 text-center leading-tight">{value}</span>;
}

/* ─────────────────────────────────────────── */
/*  Promo info type                            */
/* ─────────────────────────────────────────── */
interface PromoInfo {
  valid: boolean;
  plan?: PlanName;
  spotsRemaining?: number;
  totalSpots?: number;
  durationMonths?: number;
  reason?: string;
}

/* ─────────────────────────────────────────── */
/*  Step 1 — Plan selection                    */
/* ─────────────────────────────────────────── */
function PlanStep({
  billingPeriod,
  onBillingPeriodChange,
  onSelect,
  promo,
}: {
  billingPeriod: 'monthly' | 'annual';
  onBillingPeriodChange: (p: 'monthly' | 'annual') => void;
  onSelect: (p: PlanName) => void;
  promo: PromoInfo | null;
}) {
  const [hovered, setHovered] = useState<PlanName | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CravioIcon size={20} />
            <span className="font-display text-lg font-semibold text-foreground tracking-tight">Cravio</span>
          </div>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Already have an account?{' '}
            <span className="text-primary font-medium">Sign in</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-16">
        {/* Hero */}
        <div className="text-center max-w-xl mb-14 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Free to start · No credit card required
          </p>
          <h1 className="font-display text-4xl font-semibold text-foreground leading-[1.15] tracking-tight">
            Price your craft<br />with confidence.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Know your real costs, set prices that grow your business, and never undersell your work again.
          </p>
        </div>

        {/* Promo banner */}
        {promo && (
          <div className="w-full max-w-5xl mb-8">
            {promo.valid && (promo.spotsRemaining ?? 0) > 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-brand-500/30 bg-brand-100 px-5 py-4">
                <Gift className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-900 text-sm">
                    Early Bird — {promo.spotsRemaining} of {promo.totalSpots} free spots left
                  </p>
                  <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">
                    Get {PLAN_DISPLAY[promo.plan!]?.name ?? 'Pro'} free for {promo.durationMonths} months.
                    Spots inactive for 14+ days are released back to the pool — stay active and you keep yours.
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-brand-700 bg-brand-500/10 rounded-full px-2.5 py-1">
                  {promo.spotsRemaining} left
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-5 py-4">
                <Ticket className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground text-sm">All free spots are gone — but you're early!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get <span className="font-semibold text-foreground">20% off</span> any annual plan.
                    Use code <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">EARLY20</span> at checkout.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plan grid */}
        <div className="w-full max-w-5xl">
          <p className="text-center text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-5">
            Choose your plan
          </p>

          {/* Billing period toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center rounded-xl border border-border bg-muted/30 p-1 gap-1">
              <button
                type="button"
                onClick={() => onBillingPeriodChange('monthly')}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  billingPeriod === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => onBillingPeriodChange('annual')}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2',
                  billingPeriod === 'annual'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Annual
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full leading-none">
                  Save up to 40%
                </span>
              </button>
            </div>
          </div>

          {billingPeriod === 'annual' && (
            <p className="text-center text-xs text-muted-foreground mb-6">
              All paid plans billed annually
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_ORDER.map((plan) => {
              const display = PLAN_DISPLAY[plan];
              const style   = PLAN_STYLE[plan];
              const Icon    = style.icon;
              const isHot   = plan === hovered;

              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => onSelect(plan)}
                  onMouseEnter={() => setHovered(plan)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    'relative rounded-xl border border-t-[3px] bg-card text-left flex flex-col gap-4 p-5',
                    'transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    'shadow-sm',
                    style.topBorder,
                    isHot ? 'shadow-md -translate-y-0.5' : '',
                  )}
                >
                  {/* Most popular badge */}
                  {display.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {display.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon + plan name */}
                  <div className="flex items-center gap-2.5">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', style.iconBg)}>
                      <Icon className={cn('h-4 w-4', style.iconColor)} />
                    </div>
                    <span className="font-semibold text-foreground">{display.name}</span>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {billingPeriod === 'annual' ? display.priceAnnual : display.priceMonthly}
                      </span>
                      {plan !== 'free' && (
                        <span className="text-sm text-muted-foreground">/mo</span>
                      )}
                    </div>
                    {plan !== 'free' ? (
                      billingPeriod === 'annual' ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Billed annually · {display.priceAnnualTotal}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Billed monthly
                        </p>
                      )
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">Forever free</p>
                    )}
                  </div>

                  {/* Savings badge (annual only) */}
                  {billingPeriod === 'annual' && display.savingsPct && (
                    <div className="inline-flex items-center gap-1 self-start bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Save {display.savingsPct} · ${(parseFloat(display.priceMonthly.replace('$', '')) - parseFloat(display.priceAnnual.replace('$', ''))).toFixed(2)}/mo
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                    {display.description}
                  </p>

                  {/* 6-item feature list */}
                  <ul className="space-y-1.5">
                    {PLAN_CARD_FEATURES[plan].map(({ label, value }) => (
                      <li key={label} className="flex items-start gap-2 text-sm">
                        <Check className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', style.iconColor)} />
                        <span>
                          <span className="text-muted-foreground text-xs">{label}: </span>
                          <span className="text-foreground/80">{value}</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA row */}
                  <div className={cn(
                    'flex items-center justify-between pt-1 text-sm font-semibold transition-colors',
                    style.iconColor,
                  )}>
                    <span>{style.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Compare all features toggle */}
          <div className="mt-10 flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={() => setShowComparison((v) => !v)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare all features
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', showComparison && 'rotate-180')} />
            </button>

            {/* Comparison table */}
            {showComparison && (
              <div className="w-full overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[200px]">
                        Feature
                      </th>
                      {PLAN_ORDER.map((plan) => {
                        const style = PLAN_STYLE[plan];
                        return (
                          <th
                            key={plan}
                            className={cn(
                              'px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide border-t-[3px]',
                              style.topBorder,
                              style.iconColor,
                            )}
                          >
                            {PLAN_DISPLAY[plan].name}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="px-4 py-2 text-xs text-muted-foreground">Monthly price</td>
                      {PLAN_ORDER.map((plan) => (
                        <td key={plan} className="px-4 py-2 text-center font-semibold text-foreground text-sm">
                          {PLAN_DISPLAY[plan].priceMonthly}
                          {plan !== 'free' && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr
                        key={row.label}
                        className={cn('border-b border-border last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/10')}
                      >
                        <td className="px-4 py-3 text-xs font-medium text-foreground/70">{row.label}</td>
                        {row.values.map((val, j) => (
                          <td key={j} className="px-4 py-3 text-center">
                            <ComparisonCell value={val} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Craft SVG — reused on form left panel      */
/* ─────────────────────────────────────────── */
function CraftSvg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 560 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="sl" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="8" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.04" />
          <line x1="8" y1="0" x2="0" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.04" />
        </pattern>
        <pattern id="dg" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1.2" fill="white" fillOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="560" height="900" fill="url(#sl)" />
      <rect width="560" height="900" fill="url(#dg)" />

      {/* Yarn ball — top right */}
      <g opacity="0.08">
        <circle cx="500" cy="100" r="150" fill="white" />
        <circle cx="500" cy="100" r="100" fill="none" stroke="white" strokeWidth="1" />
        <path d="M370 90 C410 45 490 65 540 40"  fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.5" />
        <path d="M365 110 C405 65 490 85 545 60"  fill="none" stroke="white" strokeWidth="1"   strokeOpacity="0.4" />
        <path d="M380 130 C420 85 505 105 545 85"  fill="none" stroke="white" strokeWidth="1"   strokeOpacity="0.35" />
      </g>

      {/* Price tag — upper left */}
      <g transform="translate(50, 220) rotate(-10)">
        <rect x="0" y="14" width="90" height="62" rx="6" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.2" />
        <rect x="0" y="0"  width="90" height="16" rx="6" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.2" />
        <circle cx="14" cy="8" r="4" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.2" />
        <path d="M14 4 C14 -7 6 -14 0 -20" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.15" strokeDasharray="4 3" />
        <line x1="18" y1="32" x2="72" y2="32" stroke="white" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" />
        <line x1="18" y1="44" x2="60" y2="44" stroke="white" strokeWidth="1.2" strokeOpacity="0.14" strokeLinecap="round" />
        <line x1="18" y1="56" x2="68" y2="56" stroke="white" strokeWidth="1.2" strokeOpacity="0.14" strokeLinecap="round" />
      </g>

      {/* Scissors */}
      <g transform="translate(280, 340) rotate(28)" opacity="0.16">
        <ellipse cx="0"  cy="0" rx="15" ry="19" fill="none" stroke="white" strokeWidth="1.6" />
        <ellipse cx="32" cy="0" rx="15" ry="19" fill="none" stroke="white" strokeWidth="1.6" />
        <path d="M13 -9 L100 -38" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13  9 L100  38" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="50" cy="-13" r="3.5" fill="none" stroke="white" strokeWidth="1.4" />
        <circle cx="50" cy="-13" r="1.4" fill="white" />
      </g>

      {/* Spool */}
      <g transform="translate(45, 540) rotate(-5)" opacity="0.16">
        <ellipse cx="38" cy="11"  rx="38" ry="11" fill="none" stroke="white" strokeWidth="1.6" />
        <rect x="8" y="11" width="60" height="46" fill="none" stroke="white" strokeWidth="1.4" />
        <ellipse cx="38" cy="57"  rx="38" ry="11" fill="none" stroke="white" strokeWidth="1.6" />
        <line x1="8" y1="23" x2="68" y2="23" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1="8" y1="33" x2="68" y2="33" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1="8" y1="43" x2="68" y2="43" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
      </g>

      {/* Needle */}
      <g transform="translate(360, 490) rotate(-58)" opacity="0.14">
        <rect x="-2" y="0" width="4" height="120" rx="2" fill="white" />
        <ellipse cx="0" cy="17" rx="6" ry="3.5" fill="none" stroke="white" strokeWidth="1.8" />
        <path d="M6 17 C24 24 10 48 28 58 C46 68 32 90 52 96"
          fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="5 3" />
      </g>

      {/* Leaf sprig */}
      <g transform="translate(420, 730) rotate(-8)" opacity="0.13">
        <path d="M0 0 C10 -36 46 -44 50 -16" fill="white" />
        <path d="M0 0 C-10 -32 -44 -27 -40 -4" fill="white" />
        <line x1="0" y1="0" x2="0" y2="28" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" />
      </g>

      {/* Wave threads */}
      <path d="M0 450 C90 432 155 468 250 450 C345 432 410 466 510 450 C540 445 555 450 560 448"
        fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.07" />

      {/* Cross-stitch marks */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <g key={i} transform={`translate(${50 + i * 68}, 848)`} opacity="0.09">
          <line x1="-5" y1="-5" x2="5" y2="5"  stroke="white" strokeWidth="1" />
          <line x1="5"  y1="-5" x2="-5" y2="5" stroke="white" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────── */
/*  Step 2 — Account details                   */
/* ─────────────────────────────────────────── */
function FormStep({
  plan,
  billingPeriod,
  onBack,
  promoCode,
  promo,
}: {
  plan: PlanName;
  billingPeriod: 'monthly' | 'annual';
  onBack: () => void;
  promoCode?: string;
  promo: PromoInfo | null;
}) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPromoActive = !!(promoCode && promo?.valid && (promo.spotsRemaining ?? 0) > 0);
  const display = PLAN_DISPLAY[plan];
  const style   = PLAN_STYLE[plan];
  const Icon    = style.icon;

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError('');
    setLoading(true);
    try {
      const { confirmPassword, ...signupData } = data;
      const payload = isPromoActive
        ? { ...signupData, plan, promo_code: promoCode }
        : { ...signupData, plan };
      const response = await api.post('/auth/register', payload);
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      if (response.data.user) {
        identify(response.data.user.id, { email: response.data.user.email, name: response.data.user.name, plan });
      }
      track({ event: 'user_signed_up', plan_selected: plan });
      window.location.href = '/onboarding';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left: plan summary + craft illustration ── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col"
        style={{ background: 'linear-gradient(148deg, #ea580c 0%, #c2410c 40%, #7c2d12 100%)' }}
      >
        <CraftSvg />

        <div className="relative z-10 flex flex-col h-full p-14 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <CravioIcon size={28} color="white" />
            <span className="font-display text-2xl font-semibold text-white tracking-tight">
              Cravio
            </span>
          </div>

          {/* Selected plan card */}
          <div className="space-y-6">
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.14em] mb-3">
                {isPromoActive ? 'Your early bird plan' : 'Your selected plan'}
              </p>
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
              >
                {/* Plan header */}
                <div className="flex items-center gap-3">
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', style.iconBg)}>
                    <Icon className={cn('h-4 w-4', style.iconColor)} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{display.name}</p>
                    <p className="text-white/60 text-xs">
                      {isPromoActive
                        ? `Free for ${promo!.durationMonths} months · then ${display.priceMonthly}/mo`
                        : plan === 'free'
                          ? 'Free forever'
                          : billingPeriod === 'annual'
                            ? `${display.priceAnnual}/mo · ${display.priceAnnualTotal} billed annually`
                            : `${display.priceMonthly}/mo · billed monthly`}
                    </p>
                  </div>
                </div>
                {isPromoActive && (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <Gift className="h-3.5 w-3.5 text-white/80 shrink-0" />
                    <span className="text-white/90">
                      Early bird spot · {promo!.spotsRemaining} of {promo!.totalSpots} remaining
                    </span>
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-2">
                  {PLAN_CARD_FEATURES[plan].slice(0, 4).map(({ label, value }) => (
                    <li key={label} className="flex items-center gap-2.5 text-sm text-white/80">
                      <Check className="h-3.5 w-3.5 text-white/60 shrink-0" />
                      <span className="text-white/50 text-xs">{label}:</span> {value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-white/40 text-xs leading-relaxed">
              {plan === 'free'
                ? 'No credit card needed. You can upgrade to a paid plan anytime from settings.'
                : 'Payment is set up after account creation. You can change plans anytime.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 bg-background">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <CravioIcon size={24} />
          <span className="font-display text-xl font-semibold text-foreground">Cravio</span>
        </div>

        <div className="w-full max-w-[360px] space-y-6">

          {/* Back + heading */}
          <div className="space-y-4">
            {!isPromoActive && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change plan
              </button>
            )}
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
                Create your account
              </h2>
              <p className="text-sm text-muted-foreground">
                Starting with the{' '}
                <span className={cn('font-semibold', style.iconColor)}>{display.name}</span>{' '}
                plan
              </p>
            </div>
          </div>

          {/* Promo badge — visible on all screen sizes */}
          {isPromoActive && (
            <div className="flex items-center gap-2.5 rounded-lg border border-brand-500/30 bg-brand-100 px-4 py-3">
              <Gift className="h-4 w-4 text-brand-700 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-900">
                  Early Bird — Pro free for {promo!.durationMonths} months
                </p>
                <p className="text-xs text-brand-700 mt-0.5">
                  {promo!.spotsRemaining} of {promo!.totalSpots} spots left. Inactive accounts (14+ days) lose their spot.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Full name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Jane Smith" className="h-10 bg-card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" className="h-10 bg-card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min. 8 characters" className="h-10 bg-card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-10 bg-card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-destructive bg-destructive/8 border border-destructive/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/70">
            By creating an account you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Root: orchestrates the two steps           */
/* ─────────────────────────────────────────── */
export default function Signup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramPlan  = searchParams.get('plan') as PlanName | null;
  const paramPromo = searchParams.get('promo')?.toUpperCase() ?? null;
  const validPlans: PlanName[] = ['free', 'starter', 'growth', 'pro'];
  const initialPlan: PlanName  = validPlans.includes(paramPlan as PlanName) ? (paramPlan as PlanName) : 'free';
  const initialStep: 'plan' | 'form' = validPlans.includes(paramPlan as PlanName) ? 'form' : 'plan';

  const [step, setStep]               = useState<'plan' | 'form'>(initialStep);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>(initialPlan);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [promo, setPromo]             = useState<PromoInfo | null>(null);

  // Fetch promo info if ?promo= is in the URL
  useEffect(() => {
    if (!paramPromo) return;
    api.get(`/subscription/promos/${paramPromo}`)
      .then((res) => {
        const data: PromoInfo = res.data.data;
        setPromo(data);
        // If promo is valid and has spots, auto-select the promo plan
        if (data.valid && (data.spotsRemaining ?? 0) > 0 && data.plan) {
          setSelectedPlan(data.plan);
          setStep('form');
          setSearchParams({ promo: paramPromo, plan: data.plan });
        }
      })
      .catch(() => setPromo({ valid: false, reason: 'error' }));
  }, [paramPromo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (step === 'plan') {
    return (
      <PlanStep
        billingPeriod={billingPeriod}
        onBillingPeriodChange={setBillingPeriod}
        promo={promo}
        onSelect={(plan) => {
          setSelectedPlan(plan);
          const params: Record<string, string> = { plan };
          if (paramPromo) params.promo = paramPromo;
          setSearchParams(params);
          setStep('form');
        }}
      />
    );
  }

  return (
    <FormStep
      plan={selectedPlan}
      billingPeriod={billingPeriod}
      promoCode={paramPromo ?? undefined}
      promo={promo}
      onBack={() => {
        const params: Record<string, string> = {};
        if (paramPromo) params.promo = paramPromo;
        setSearchParams(params);
        setStep('plan');
      }}
    />
  );
}
