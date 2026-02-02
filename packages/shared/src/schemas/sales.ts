import { z } from 'zod';

// Helper to preprocess number values
const numericPreprocess = (val: unknown) => {
    if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
    }
    return val;
};

export const createSaleSchema = z.object({
    product_id: z.number().int().positive(),
    variant_id: z.number().int().positive().nullable().optional(),
    sale_date: z.string().datetime().optional(), // ISO string
    quantity: z.preprocess(numericPreprocess, z.number().positive()),
    unit_price: z.preprocess(numericPreprocess, z.number().nonnegative()),
    discount_amount: z.preprocess(numericPreprocess, z.number().nonnegative()).default(0),
    discount_percentage: z.preprocess(numericPreprocess, z.number().min(0).max(100)).default(0),
    coupon_code: z.string().optional(),
    platform: z.string().optional(),
    customer_name: z.string().optional(),
    notes: z.string().optional(),
});

export const updateSaleSchema = createSaleSchema.partial();
