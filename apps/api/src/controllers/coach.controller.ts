import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../utils/db.js';
import { AIService } from '../services/ai.service.js';
import { getShopSnapshot } from '../utils/shopSnapshot.js';
import { getUserSubscription, getEffectiveLimits } from '../utils/subscription.js';
import {
  coachProfileSchema,
  insightStatusSchema,
  reportRequestSchema,
  chatMessageSchema,
} from '@priceme/shared';

// ─── Profile ────────────────────────────────────────────────────────────────

export const getProfile = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const result = await db`SELECT * FROM coach_profiles WHERE user_id = ${req.userId!}`;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.json({ status: 'success', data: rows[0] ?? null });
  } catch (error) {
    console.error('Error fetching coach profile:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
  }
};

export const upsertProfile = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const data = coachProfileSchema.parse(req.body);
    // Serialize string[] to PostgreSQL array literal — @vercel/postgres sql tag only accepts Primitives
    const salesChannelsLiteral = `{${data.sales_channels.map((c) => `"${c.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
    await db`
      INSERT INTO coach_profiles
        (user_id, craft_type, sales_channels, experience_years, primary_challenge, monthly_revenue_goal, updated_at)
      VALUES
        (${req.userId!}, ${data.craft_type}, ${salesChannelsLiteral}::TEXT[], ${data.experience_years},
         ${data.primary_challenge}, ${data.monthly_revenue_goal ?? null}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        craft_type = EXCLUDED.craft_type,
        sales_channels = EXCLUDED.sales_channels,
        experience_years = EXCLUDED.experience_years,
        primary_challenge = EXCLUDED.primary_challenge,
        monthly_revenue_goal = EXCLUDED.monthly_revenue_goal,
        updated_at = NOW()
    `;
    // Clear stale analysis data so re-analysis uses the new profile
    await db`DELETE FROM coach_insights WHERE user_id = ${req.userId!} AND status IN ('unread', 'read')`;
    await db`DELETE FROM coach_reports WHERE user_id = ${req.userId!}`;
    return res.json({ status: 'success', message: 'Profile saved' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation failed', issues: error.issues });
    }
    console.error('Error saving coach profile:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to save profile' });
  }
};

// ─── Health Score ────────────────────────────────────────────────────────────

export const getHealthScore = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const snapshot = await getShopSnapshot(req.userId!);
    const active = snapshot.products.filter(p => p.status === 'on_sale');

    // Dimension 1: Margin Health (0-25)
    const avgMargin = snapshot.avg_margin ?? 0;
    const marginScore = Math.round(Math.min(25, Math.max(0, ((avgMargin - 20) / 30) * 25)));

    // Dimension 2: Pricing Confidence (0-25)
    const activeCount = Math.max(active.length, 1);
    const hasMethod = active.filter(p => p.pricing_method).length / activeCount;
    const hasPrices = active.filter(p => p.target_price != null).length / activeCount;
    const hasCompetitors = active.filter(p => p.competitor_count > 0).length / activeCount;
    const pricingScore = Math.round(hasMethod * 10 + hasPrices * 8 + hasCompetitors * 7);

    // Dimension 3: Product Mix (0-25)
    const activeCountPts = Math.min(15, active.length * 1.5);
    const topRevShare = snapshot.sales_summary.total_revenue_90d > 0
      ? Math.max(...snapshot.products.map(p => p.revenue_90d)) / snapshot.sales_summary.total_revenue_90d
      : 1;
    const concentrationPts = topRevShare <= 0.6 ? 10 : topRevShare <= 0.8 ? 5 : 0;
    const mixScore = Math.round(Math.min(25, activeCountPts + concentrationPts));

    // Dimension 4: Sales Velocity (0-25)
    let velocityScore = 0;
    if (snapshot.revenue_goal && snapshot.revenue_goal > 0) {
      const goalProgress = snapshot.sales_summary.total_revenue_90d / (snapshot.revenue_goal * 3);
      velocityScore = Math.round(Math.min(25, goalProgress * 25));
    } else {
      const avgUnitsPerProduct = active.length > 0
        ? snapshot.sales_summary.total_units_90d / active.length
        : 0;
      velocityScore = Math.round(Math.min(25, avgUnitsPerProduct * 2.5));
    }

    const overall = marginScore + pricingScore + mixScore + velocityScore;

    return res.json({
      status: 'success',
      data: {
        overall,
        margin_health: marginScore,
        pricing_confidence: pricingScore,
        product_mix: mixScore,
        sales_velocity: velocityScore,
        computed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error computing health score:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to compute health score' });
  }
};

// ─── Insights ────────────────────────────────────────────────────────────────

export const generateInsights = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const sub = await getUserSubscription(req.userId!);
    const limits = getEffectiveLimits(sub);
    const insightLimit = limits.coachInsights === -1 ? 15 : limits.coachInsights;

    if (insightLimit === 0) {
      return res.status(403).json({
        status: 'error',
        code: 'PLAN_LIMIT_REACHED',
        message: 'Coach insights are not available on your current plan. Upgrade to access this feature.',
        data: { resource: 'coachInsights', limit: 0 },
      });
    }

    const profileResult = await db`SELECT * FROM coach_profiles WHERE user_id = ${req.userId!}`;
    const profileRows = Array.isArray(profileResult) ? profileResult : profileResult.rows || [];
    if (profileRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Complete your Coach profile first.' });
    }

    const [snapshot] = await Promise.all([getShopSnapshot(req.userId!)]);
    const profile = profileRows[0];

    const generated = await AIService.generateInsightFeed({ snapshot, profile, limit: insightLimit });

    // Delete old unread/read insights (keep dismissed/done for history)
    await db`DELETE FROM coach_insights WHERE user_id = ${req.userId!} AND status IN ('unread', 'read')`;

    // Insert new insights, resolving related_product_id from product name
    for (const insight of generated) {
      let relatedProductId: number | null = null;
      if (insight.related_product_name) {
        const match = snapshot.products.find(
          p => p.name.toLowerCase() === insight.related_product_name!.toLowerCase()
        );
        relatedProductId = match?.id ?? null;
      }
      await db`
        INSERT INTO coach_insights
          (user_id, headline, body, action, impact_estimate, priority, category, related_product_id, status)
        VALUES
          (${req.userId!}, ${insight.headline}, ${insight.body}, ${insight.action},
           ${insight.impact_estimate ?? null}, ${insight.priority}, ${insight.category},
           ${relatedProductId}, 'unread')
      `;
    }

    const newInsights = await db`
      SELECT ci.*, p.name AS related_product_name
      FROM coach_insights ci
      LEFT JOIN products p ON p.id = ci.related_product_id
      WHERE ci.user_id = ${req.userId!} AND ci.status IN ('unread', 'read')
      ORDER BY ci.priority ASC, ci.generated_at DESC
    `;
    const rows = Array.isArray(newInsights) ? newInsights : newInsights.rows || [];
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error generating insights:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to generate insights' });
  }
};

export const getInsights = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const result = await db`
      SELECT ci.*, p.name AS related_product_name
      FROM coach_insights ci
      LEFT JOIN products p ON p.id = ci.related_product_id
      WHERE ci.user_id = ${req.userId!}
        AND ci.status != 'dismissed'
      ORDER BY ci.priority ASC, ci.generated_at DESC
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch insights' });
  }
};

export const updateInsightStatus = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { status } = insightStatusSchema.parse(req.body);
    if (status === 'dismissed') {
      await db`DELETE FROM coach_insights WHERE id = ${Number(id)} AND user_id = ${req.userId!}`;
    } else {
      await db`UPDATE coach_insights SET status = ${status} WHERE id = ${Number(id)} AND user_id = ${req.userId!}`;
    }
    return res.json({ status: 'success', message: 'Insight updated' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Invalid status value' });
    }
    console.error('Error updating insight status:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update insight' });
  }
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export const getChatHistory = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const result = await db`
      SELECT * FROM coach_chat_messages
      WHERE user_id = ${req.userId!}
      ORDER BY created_at ASC
      LIMIT 50
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch chat history' });
  }
};

export const sendChatMessage = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { message, session_id } = chatMessageSchema.parse(req.body);

    const sub = await getUserSubscription(req.userId!);
    const limits = getEffectiveLimits(sub);

    // Check daily limit (skip if unlimited)
    if (limits.coachChatPerDay !== -1) {
      if (limits.coachChatPerDay === 0) {
        return res.status(403).json({
          status: 'error',
          code: 'PLAN_LIMIT_REACHED',
          message: 'Chat with Coach requires Starter plan or higher.',
          data: { resource: 'coachChatPerDay', limit: 0 },
        });
      }

      const usageResult = await db`
        SELECT chat_messages_sent FROM coach_daily_usage
        WHERE user_id = ${req.userId!} AND usage_date = CURRENT_DATE
      `;
      const usageRows = Array.isArray(usageResult) ? usageResult : usageResult.rows || [];
      const sentToday = usageRows[0]?.chat_messages_sent ?? 0;

      if (sentToday >= limits.coachChatPerDay) {
        return res.status(403).json({
          status: 'error',
          code: 'PLAN_LIMIT_REACHED',
          message: `Daily chat limit reached (${limits.coachChatPerDay} messages/day). Upgrade for more.`,
          data: { resource: 'coachChatPerDay', limit: limits.coachChatPerDay, current: sentToday },
        });
      }
    }

    const profileResult = await db`SELECT * FROM coach_profiles WHERE user_id = ${req.userId!}`;
    const profileRows = Array.isArray(profileResult) ? profileResult : profileResult.rows || [];
    if (profileRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Complete your Coach profile first.' });
    }

    const historyResult = await db`
      SELECT role, content FROM coach_chat_messages
      WHERE user_id = ${req.userId!}
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const historyRows = (Array.isArray(historyResult) ? historyResult : historyResult.rows || []).reverse();

    const [snapshot] = await Promise.all([getShopSnapshot(req.userId!)]);
    const profile = profileRows[0];

    const reply = await AIService.sendChat({
      snapshot,
      profile,
      history: historyRows,
      userMessage: message,
    });

    // Persist both messages
    await db`
      INSERT INTO coach_chat_messages (user_id, role, content, session_id)
      VALUES (${req.userId!}, 'user', ${message}, ${session_id})
    `;
    const assistantResult = await db`
      INSERT INTO coach_chat_messages (user_id, role, content, session_id)
      VALUES (${req.userId!}, 'assistant', ${reply}, ${session_id})
      RETURNING *
    `;
    const assistantRows = Array.isArray(assistantResult) ? assistantResult : assistantResult.rows || [];

    // Increment daily usage counter
    if (limits.coachChatPerDay !== -1) {
      await db`
        INSERT INTO coach_daily_usage (user_id, usage_date, chat_messages_sent)
        VALUES (${req.userId!}, CURRENT_DATE, 1)
        ON CONFLICT (user_id, usage_date) DO UPDATE
          SET chat_messages_sent = coach_daily_usage.chat_messages_sent + 1
      `;
    }

    return res.json({ status: 'success', data: assistantRows[0] });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation failed', issues: error.issues });
    }
    console.error('Error sending chat message:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send message' });
  }
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const getReports = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const result = await db`
      SELECT * FROM coach_reports WHERE user_id = ${req.userId!}
      ORDER BY generated_at DESC
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
  }
};

export const generateReport = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { report_type, force_regenerate } = reportRequestSchema.parse(req.body);

    const sub = await getUserSubscription(req.userId!);
    const limits = getEffectiveLimits(sub);

    if (limits.coachReportsPerMonth === 0) {
      return res.status(403).json({
        status: 'error',
        code: 'PLAN_LIMIT_REACHED',
        message: 'Deep-dive reports require Starter plan or higher.',
        data: { resource: 'coachReportsPerMonth', limit: 0 },
      });
    }

    // Return cached report if exists and not force-regenerating
    if (!force_regenerate) {
      const cached = await db`
        SELECT * FROM coach_reports
        WHERE user_id = ${req.userId!} AND report_type = ${report_type}
      `;
      const cachedRows = Array.isArray(cached) ? cached : cached.rows || [];
      if (cachedRows.length > 0) {
        return res.json({ status: 'success', data: cachedRows[0] });
      }
    }

    const profileResult = await db`SELECT * FROM coach_profiles WHERE user_id = ${req.userId!}`;
    const profileRows = Array.isArray(profileResult) ? profileResult : profileResult.rows || [];
    if (profileRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Complete your Coach profile first.' });
    }

    const snapshot = await getShopSnapshot(req.userId!);
    const profile = profileRows[0];

    const content = await AIService.generateReport({ snapshot, profile, report_type });

    const upsertResult = await db`
      INSERT INTO coach_reports (user_id, report_type, content, generated_at)
      VALUES (${req.userId!}, ${report_type}, ${content}, NOW())
      ON CONFLICT (user_id, report_type) DO UPDATE
        SET content = EXCLUDED.content, generated_at = NOW()
      RETURNING *
    `;
    const upsertRows = Array.isArray(upsertResult) ? upsertResult : upsertResult.rows || [];

    return res.json({ status: 'success', data: upsertRows[0] });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation failed', issues: error.issues });
    }
    console.error('Error generating report:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to generate report' });
  }
};
