import posthog from 'posthog-js';

// ---------------------------------------------------------------------------
// Typed event catalogue
// ---------------------------------------------------------------------------

// Auth
export type AuthEvent =
  | { event: 'user_signed_up'; plan_selected: string }
  | { event: 'user_logged_in' }
  | { event: 'user_logged_out' }
  | { event: 'password_reset_requested' };

// Products
export type ProductEvent =
  | { event: 'product_creation_started' }
  | { event: 'product_created'; has_materials: boolean; has_labor: boolean; has_other_costs: boolean; variant_count: number; has_category: boolean }
  | { event: 'product_updated' }
  | { event: 'product_deleted'; was_bulk: boolean }
  | { event: 'product_status_changed'; from_status: string; to_status: string }
  | { event: 'template_loaded'; template_id: string }
  | { event: 'fee_aware_mode_toggled'; enabled: boolean };

// Sales
export type SaleEvent =
  | { event: 'sale_recorded'; quantity: number; has_discount: boolean }
  | { event: 'sale_deleted' };

// Market analysis / competitors
export type MarketEvent =
  | { event: 'market_analysis_opened'; product_id: string | number }
  | { event: 'competitor_added' }
  | { event: 'competitor_removed' };

// AI Coach
export type CoachEvent =
  | { event: 'coach_opened' }
  | { event: 'coach_onboarding_completed'; craft_type: string; experience_years: string }
  | { event: 'insight_generated' }
  | { event: 'chat_message_sent'; daily_count: number }
  | { event: 'report_generated' }
  | { event: 'coach_limit_reached'; limit_type: 'chat' | 'report' };

// Subscription / upgrade
export type SubscriptionEvent =
  | { event: 'plan_limit_reached'; limit_type: 'products' | 'competitors'; plan: string }
  | { event: 'upgrade_cta_clicked'; source: string; current_plan?: string }
  | { event: 'plan_changed'; from_plan: string; to_plan: string };

// Onboarding tour
export type OnboardingEvent =
  | { event: 'onboarding_tour_started' }
  | { event: 'onboarding_tour_completed' }
  | { event: 'onboarding_tour_skipped'; step_reached: number };

type AnalyticsEvent =
  | AuthEvent
  | ProductEvent
  | SaleEvent
  | MarketEvent
  | CoachEvent
  | SubscriptionEvent
  | OnboardingEvent;

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/** Fire an analytics event. The `event` key is pulled out, rest are properties. */
export function track({ event, ...properties }: AnalyticsEvent) {
  posthog.capture(event, properties);
}

/** Identify the logged-in user so all subsequent events are linked to them. */
export function identify(userId: string | number, traits?: Record<string, unknown>) {
  posthog.identify(String(userId), traits);
}

/** Reset the identity — call on logout so next session starts anonymous. */
export function reset() {
  posthog.reset();
}
