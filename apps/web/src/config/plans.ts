import type { PlanName, PlanLimits } from '@priceme/shared';

export type { PlanName, PlanLimits };

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free:     { products: 5,  competitors: 1,  coachInsights: 3,  coachChatPerDay: 0,  coachReportsPerMonth: 0  },
  starter:  { products: 10, competitors: 3,  coachInsights: 5,  coachChatPerDay: -1, coachReportsPerMonth: 2  },
  growth:   { products: 30, competitors: 50, coachInsights: -1, coachChatPerDay: -1, coachReportsPerMonth: -1 },
  pro:      { products: -1, competitors: -1, coachInsights: -1, coachChatPerDay: -1, coachReportsPerMonth: -1 },
};

export interface PlanDisplay {
  name: string;
  /** Price per month when billed monthly */
  priceMonthly: string;
  /** Price per month when billed annually */
  priceAnnual: string;
  /** Annual total, e.g. "$96/yr" */
  priceAnnualTotal: string;
  /** Dollar amount saved per year vs monthly, e.g. "$35.88" */
  savingsPerYear?: string;
  /** Rounded % saved vs monthly, e.g. "27%" */
  savingsPct?: string;
  description: string;
  badge?: string;
}

export const PLAN_DISPLAY: Record<PlanName, PlanDisplay> = {
  free: {
    name: 'Free',
    priceMonthly:    '$0',
    priceAnnual:     '$0',
    priceAnnualTotal: '$0/yr',
    description: 'Start for free and see exactly what your products really cost.',
  },
  starter: {
    name: 'Starter',
    priceMonthly:    '$10.99',
    priceAnnual:     '$8',
    priceAnnualTotal: '$96/yr',
    savingsPerYear:  '$35.88',
    savingsPct:      '27%',
    description: 'Know your real costs and stop leaving money on the table.',
  },
  growth: {
    name: 'Growth',
    priceMonthly:    '$24.99',
    priceAnnual:     '$15',
    priceAnnualTotal: '$180/yr',
    savingsPerYear:  '$119.88',
    savingsPct:      '40%',
    description: 'AI that spots underpriced products and tells you exactly what to fix.',
    badge: 'Most Popular',
  },
  pro: {
    name: 'Pro',
    priceMonthly:    '$35.99',
    priceAnnual:     '$25',
    priceAnnualTotal: '$300/yr',
    savingsPerYear:  '$131.88',
    savingsPct:      '31%',
    description: 'Full access, no limits — built for sellers who run it like a business.',
  },
};

export const PLAN_ORDER: PlanName[] = ['free', 'starter', 'growth', 'pro'];
