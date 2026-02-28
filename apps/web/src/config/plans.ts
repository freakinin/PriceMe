import type { PlanName, PlanLimits } from '@priceme/shared';

export type { PlanName, PlanLimits };

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free:     { products: 10,  competitors: 2,  coachInsights: 3,   coachChatPerDay: 0,  coachReportsPerMonth: 0  },
  starter:  { products: 50,  competitors: 10, coachInsights: 10,  coachChatPerDay: 10, coachReportsPerMonth: 2  },
  pro:      { products: 200, competitors: 30, coachInsights: -1,  coachChatPerDay: 50, coachReportsPerMonth: 5  },
  business: { products: -1,  competitors: -1, coachInsights: -1,  coachChatPerDay: -1, coachReportsPerMonth: -1 },
};

export interface PlanDisplay {
  name: string;
  priceMonthly: string;
  priceAnnual?: string;
  priceAnnualNote?: string;
  description: string;
  badge?: string;
}

export const PLAN_DISPLAY: Record<PlanName, PlanDisplay> = {
  free: {
    name: 'Free',
    priceMonthly: '$0',
    description: 'Get started for free — no credit card required.',
  },
  starter: {
    name: 'Starter',
    priceMonthly: '$12',
    priceAnnual: '$10',
    priceAnnualNote: '$120/yr',
    description: 'For growing Etsy shops ready to take pricing seriously.',
    badge: 'Most Popular',
  },
  pro: {
    name: 'Pro',
    priceMonthly: '$19',
    description: 'For serious sellers managing large product catalogs.',
  },
  business: {
    name: 'Business',
    priceMonthly: '$49',
    description: 'Unlimited everything for full-time makers.',
  },
};

export const PLAN_ORDER: PlanName[] = ['free', 'starter', 'pro', 'business'];
