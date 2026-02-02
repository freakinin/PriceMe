import { z } from 'zod';

// Reuse parts of product schema but make them appropriate for templates
export const createTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    category: z.string().optional(),

    default_batch_size: z.number().int().positive().optional(),
    default_pricing_method: z.enum(['markup', 'price', 'profit', 'margin']).optional(),
    default_markup_percentage: z.number().optional(),

    // JSON fields for template data
    materials: z.array(z.any()).optional(),
    labor_costs: z.array(z.any()).optional(),
    other_costs: z.array(z.any()).optional(),
    variants: z.array(z.any()).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
