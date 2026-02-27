import { z } from 'zod';

const numericPreprocess = (val: unknown) => {
  if (typeof val === 'string') {
    if (val.trim() === '') return undefined;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
};

export const coachProfileSchema = z.object({
  craft_type: z.string().min(1, 'Craft type is required'),
  sales_channels: z.array(z.string()).min(1, 'Select at least one channel'),
  experience_years: z.enum(['<1year', '1-3years', '3+years']),
  primary_challenge: z.string().min(1, 'Primary challenge is required'),
  monthly_revenue_goal: z.preprocess(numericPreprocess, z.number().nonnegative()).optional(),
});

export type CoachProfileInput = z.infer<typeof coachProfileSchema>;

export const insightStatusSchema = z.object({
  status: z.enum(['read', 'dismissed', 'done']),
});

export type InsightStatusInput = z.infer<typeof insightStatusSchema>;

export const reportRequestSchema = z.object({
  report_type: z.enum(['portfolio_analysis', 'pricing_audit', 'cost_reduction', 'revenue_goal_path']),
  force_regenerate: z.boolean().optional(),
});

export type ReportRequestInput = z.infer<typeof reportRequestSchema>;

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  session_id: z.string().uuid(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
