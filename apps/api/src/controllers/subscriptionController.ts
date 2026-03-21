import { Request, Response } from 'express';
import { db } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { getUserSubscription, getUserUsage, getEffectiveLimits } from '../utils/subscription.js';
import { PLAN_LIMITS, PLAN_DISPLAY, type PlanName } from '../config/plans.js';
import { NotionSyncJob } from '../jobs/notionSync.js';

/**
 * GET /api/subscription
 * Returns current plan, status, usage, and limits for the authenticated user.
 */
export const getSubscription = async (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

  const [subscription, usage] = await Promise.all([
    getUserSubscription(req.userId),
    getUserUsage(req.userId),
  ]);

  const limits = getEffectiveLimits(subscription);

  return res.json({
    status: 'success',
    data: {
      plan: subscription.plan,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      trial_ends_at: subscription.trial_ends_at,
      usage,
      limits,
      display: PLAN_DISPLAY[subscription.plan as PlanName],
    },
  });
};

/**
 * GET /api/promos/:code  (public — no auth required)
 * Returns real-time promo info: spots remaining, plan, duration.
 */
export const getPromo = async (req: Request, res: Response) => {
  const { code } = req.params;
  const result = await db`
    SELECT plan, max_uses, used_count, duration_months, active
    FROM promo_codes
    WHERE code = ${code.toUpperCase()}
  `;
  const rows = Array.isArray(result) ? result : (result as any).rows ?? [];

  if (rows.length === 0 || !rows[0].active) {
    return res.json({ status: 'success', data: { valid: false, reason: 'invalid' } });
  }

  const promo = rows[0];
  const spotsRemaining = Math.max(0, promo.max_uses - promo.used_count);

  return res.json({
    status: 'success',
    data: {
      valid: true,
      plan: promo.plan as PlanName,
      spotsRemaining,
      totalSpots: promo.max_uses,
      durationMonths: promo.duration_months,
    },
  });
};

/**
 * GET /api/subscription/plans
 * Returns all available plans with limits and display info (used for plan comparison UI).
 */
export const getPlans = async (_req: AuthRequest, res: Response) => {
  const plans = (Object.keys(PLAN_LIMITS) as PlanName[]).map((plan) => ({
    id: plan,
    ...PLAN_DISPLAY[plan],
    limits: PLAN_LIMITS[plan],
  }));
  return res.json({ status: 'success', data: plans });
};

/**
 * POST /api/subscription/assign
 * Self-service plan switch (Phase 1 — no Stripe, no payment required).
 * Users can switch their own plan freely. When Stripe is added in Phase 2,
 * this endpoint will be replaced by Stripe Checkout + webhook handling.
 * Admin can also switch any user's plan by providing target_user_id + X-Admin-Secret header.
 */
export const assignPlan = async (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

  const { target_user_id, plan } = req.body;

  // If target_user_id differs from the requester, require admin secret
  const adminSecret = process.env.ADMIN_SECRET;
  const isAdminAction = target_user_id && Number(target_user_id) !== req.userId;
  if (isAdminAction) {
    if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }
  }

  const userId = isAdminAction ? Number(target_user_id) : req.userId;
  const validPlans: PlanName[] = ['free', 'starter', 'growth', 'pro'];

  if (!validPlans.includes(plan)) {
    return res.status(400).json({ status: 'error', message: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });
  }

  await db`
    INSERT INTO subscriptions (user_id, plan, status)
    VALUES (${userId}, ${plan}, 'active')
    ON CONFLICT (user_id) DO UPDATE
      SET plan = ${plan}, status = 'active', trial_ends_at = NULL, updated_at = CURRENT_TIMESTAMP
  `;

  // Sync updated plan to Notion (fire-and-forget)
  NotionSyncJob.syncUser(userId).catch(() => {});

  return res.json({ status: 'success', message: `Plan updated to ${plan}`, data: { plan } });
};
