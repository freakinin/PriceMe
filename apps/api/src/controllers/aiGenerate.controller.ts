import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { AIService } from '../services/ai.service.js';
import { getUserSubscription, getEffectiveLimits } from '../utils/subscription.js';

const chatRequestSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ).default([]),
  userMessage: z.string().min(1).max(4000),
  contextImage: z
    .object({
      base64: z.string(),
      mimeType: z.string(),
    })
    .optional(),
  // URLs to analyze fresh — used on first turn with competitor URLs
  competitorUrls: z.array(z.string().url()).max(5).optional(),
  // Pre-computed context string — used on turns after the first analysis
  competitorContext: z.string().max(8000).optional(),
  categories: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .optional(),
  laborHourlyCost: z.number().optional().nullable(),
  unitSystem: z.string().optional().nullable(),
});

export const generateProductChat = async (
  req: AuthRequest,
  res: Response
): Promise<Response | void> => {
  try {
    // Check plan — free users do not have AI Generator access
    const subscription = await getUserSubscription(req.userId!);
    const limits = getEffectiveLimits(subscription);
    if (!limits.aiGeneratorEnabled) {
      return res.status(403).json({
        status: 'error',
        code: 'PLAN_LIMIT_REACHED',
        message: 'AI Product Generator requires Starter plan or higher.',
        data: { resource: 'aiGenerator' },
      });
    }

    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        issues: parsed.error.issues,
      });
    }

    const { history, userMessage, contextImage, competitorUrls, competitorContext: preComputedContext, categories, laborHourlyCost, unitSystem } = parsed.data;

    // Build competitor context:
    // - If a pre-computed context string is provided (subsequent turns), use it directly
    // - If raw URLs are provided (first turn), analyze them now
    let competitorContext: string | undefined = preComputedContext;
    if (!competitorContext && competitorUrls && competitorUrls.length > 0) {
      const results = await Promise.allSettled(
        competitorUrls.map(url => AIService.analyzeProduct(url))
      );
      const summaries = results
        .map((r, i) => {
          if (r.status === 'fulfilled') {
            const a = r.value;
            return `URL: ${competitorUrls[i]}\nTitle: ${a.title}\nPrice: ${a.price} ${a.currency}\nMaterials: ${a.materials.join(', ')}\nSummary: ${a.ai_analysis_summary}`;
          }
          return `URL: ${competitorUrls[i]}\n(Analysis unavailable)`;
        })
        .join('\n\n');
      competitorContext = summaries;
    }

    const result = await AIService.generateProductChat({
      history,
      userMessage,
      contextImage,
      competitorContext,
      categories: categories ?? [],
      laborHourlyCost,
      unitSystem,
    });

    // Debug info — helps diagnose what the AI actually received
    const debugInfo = {
      hadImage: !!contextImage,
      hadCompetitorUrls: (competitorUrls?.length ?? 0) > 0,
      usedCachedContext: !!preComputedContext,
      competitorContextLength: competitorContext?.length ?? 0,
      competitorContext: competitorContext ?? null,
      historyLength: history.length,
    };

    // Return the competitorContext so the frontend can cache it and re-use on future turns
    // (avoids re-analyzing the same URLs on every message)
    return res.json({ status: 'success', data: { ...result, competitorContext, debugInfo } });
  } catch (error: any) {
    console.error('AI generate product chat error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'AI generation failed. Please try again.',
    });
  }
};
