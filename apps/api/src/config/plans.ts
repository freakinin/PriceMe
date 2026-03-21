export type PlanName = 'free' | 'starter' | 'growth' | 'pro';

export interface PlanLimits {
  products: number;             // -1 = unlimited
  competitors: number;          // -1 = unlimited
  coachInsights: number;        // -1 = unlimited; 0 = no access
  coachChatPerDay: number;      // -1 = unlimited; 0 = no access
  coachReportsPerMonth: number; // -1 = unlimited; 0 = no access
  aiGeneratorEnabled: boolean;  // whether AI Product Generator is accessible
}

// QA_MODE=true lowers free-tier limits so they're trivial to hit during testing.
const QA_MODE = process.env.QA_MODE === 'true';

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free:     { products: QA_MODE ? 3  : 5,  competitors: QA_MODE ? 1 : 1,  coachInsights: 3,  coachChatPerDay: 0,  coachReportsPerMonth: 0,  aiGeneratorEnabled: false },
  starter:  { products: 10, competitors: 3,  coachInsights: 5,  coachChatPerDay: -1, coachReportsPerMonth: 2,  aiGeneratorEnabled: true  },
  growth:   { products: 30, competitors: 50, coachInsights: -1, coachChatPerDay: -1, coachReportsPerMonth: -1, aiGeneratorEnabled: true  },
  pro:      { products: -1, competitors: -1, coachInsights: -1, coachChatPerDay: -1, coachReportsPerMonth: -1, aiGeneratorEnabled: true  },
};

export interface PlanDisplay {
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  priceAnnualTotal: string;
  savingsPerYear?: string;
  savingsPct?: string;
  description: string;
}

export const PLAN_DISPLAY: Record<PlanName, PlanDisplay> = {
  free: {
    name: 'Free',
    priceMonthly:     '$0',
    priceAnnual:      '$0',
    priceAnnualTotal: '$0/yr',
    description: 'Start for free and see exactly what your products really cost.',
  },
  starter: {
    name: 'Starter',
    priceMonthly:     '$10.99',
    priceAnnual:      '$8',
    priceAnnualTotal: '$96/yr',
    savingsPerYear:   '$35.88',
    savingsPct:       '27%',
    description: 'Know your real costs and stop leaving money on the table.',
  },
  growth: {
    name: 'Growth',
    priceMonthly:     '$24.99',
    priceAnnual:      '$15',
    priceAnnualTotal: '$180/yr',
    savingsPerYear:   '$119.88',
    savingsPct:       '40%',
    description: 'AI that spots underpriced products and tells you exactly what to fix.',
  },
  pro: {
    name: 'Pro',
    priceMonthly:     '$35.99',
    priceAnnual:      '$25',
    priceAnnualTotal: '$300/yr',
    savingsPerYear:   '$131.88',
    savingsPct:       '31%',
    description: 'Full access, no limits — built for sellers who run it like a business.',
  },
};
