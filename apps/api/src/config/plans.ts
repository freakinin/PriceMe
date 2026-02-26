export type PlanName = 'free' | 'starter' | 'pro' | 'business';

export interface PlanLimits {
  products: number;    // -1 = unlimited
  competitors: number; // -1 = unlimited
}

// QA_MODE=true lowers free-tier limits so they're trivial to hit during testing.
const QA_MODE = process.env.QA_MODE === 'true';

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free:     { products: QA_MODE ? 4  : 10,  competitors: QA_MODE ? 1 : 2  },
  starter:  { products: 50,  competitors: 10 },
  pro:      { products: 200, competitors: 30 },
  business: { products: -1,  competitors: -1 },
};

export interface PlanDisplay {
  name: string;
  priceMonthly: string;
  priceAnnual?: string;
  priceAnnualNote?: string;
  description: string;
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
