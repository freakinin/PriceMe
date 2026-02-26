import { db } from './db.js';
import { PLAN_LIMITS, type PlanName } from '../config/plans.js';

export interface UserSubscription {
  plan: PlanName;
  status: string;
  stripe_subscription_id: string | null;
  current_period_end: Date | null;
  trial_ends_at: Date | null;
}

/**
 * Get the subscription for a user. Returns free/active as a safe default if none found.
 */
export async function getUserSubscription(userId: number): Promise<UserSubscription> {
  const result = await db`
    SELECT plan, status, stripe_subscription_id, current_period_end, trial_ends_at
    FROM subscriptions
    WHERE user_id = ${userId}
  `;
  const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
  if (rows.length === 0) {
    return { plan: 'free', status: 'active', stripe_subscription_id: null, current_period_end: null, trial_ends_at: null };
  }
  return rows[0] as UserSubscription;
}

/**
 * Returns effective plan limits — treats canceled/past_due as free.
 */
export function getEffectiveLimits(subscription: UserSubscription) {
  const effectivePlan: PlanName =
    subscription.status === 'canceled' || subscription.status === 'past_due'
      ? 'free'
      : (subscription.plan as PlanName);
  return PLAN_LIMITS[effectivePlan] ?? PLAN_LIMITS.free;
}

type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; limit: number; current: number };

/**
 * Check whether a user can create another product.
 */
export async function checkProductLimit(userId: number): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId);
  const limits = getEffectiveLimits(subscription);
  if (limits.products === -1) return { allowed: true };

  const result = await db`SELECT COUNT(*)::int AS count FROM products WHERE user_id = ${userId}`;
  const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
  const current: number = rows[0]?.count ?? 0;

  if (current >= limits.products) {
    return { allowed: false, limit: limits.products, current };
  }
  return { allowed: true };
}

/**
 * Check whether a user can track another competitor product.
 */
export async function checkCompetitorLimit(userId: number): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId);
  const limits = getEffectiveLimits(subscription);
  if (limits.competitors === -1) return { allowed: true };

  const result = await db`
    SELECT COUNT(*)::int AS count
    FROM tracked_products tp
    JOIN competitors c ON tp.competitor_id = c.id
    WHERE c.user_id = ${userId}
      AND tp.linked_product_id IS NOT NULL
  `;
  const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
  const current: number = rows[0]?.count ?? 0;

  if (current >= limits.competitors) {
    return { allowed: false, limit: limits.competitors, current };
  }
  return { allowed: true };
}

/**
 * Get current usage counts for a user.
 */
export async function getUserUsage(userId: number): Promise<{ products: number; competitors: number }> {
  const [productResult, competitorResult] = await Promise.all([
    db`SELECT COUNT(*)::int AS count FROM products WHERE user_id = ${userId}`,
    db`
      SELECT COUNT(*)::int AS count
      FROM tracked_products tp
      JOIN competitors c ON tp.competitor_id = c.id
      WHERE c.user_id = ${userId}
        AND tp.linked_product_id IS NOT NULL
    `,
  ]);

  const productRows = Array.isArray(productResult) ? productResult : (productResult as any).rows ?? [];
  const competitorRows = Array.isArray(competitorResult) ? competitorResult : (competitorResult as any).rows ?? [];

  return {
    products: productRows[0]?.count ?? 0,
    competitors: competitorRows[0]?.count ?? 0,
  };
}
