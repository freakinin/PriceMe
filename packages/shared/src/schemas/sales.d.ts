import { z } from 'zod';
export declare const createSaleSchema: z.ZodObject<{
    product_id: z.ZodNumber;
    variant_id: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sale_date: z.ZodOptional<z.ZodString>;
    quantity: z.ZodEffects<z.ZodNumber, number, unknown>;
    unit_price: z.ZodEffects<z.ZodNumber, number, unknown>;
    discount_amount: z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>;
    discount_percentage: z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>;
    coupon_code: z.ZodOptional<z.ZodString>;
    platform: z.ZodOptional<z.ZodString>;
    customer_name: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    discount_percentage: number;
    variant_id?: number | null | undefined;
    sale_date?: string | undefined;
    coupon_code?: string | undefined;
    platform?: string | undefined;
    customer_name?: string | undefined;
    notes?: string | undefined;
}, {
    product_id: number;
    variant_id?: number | null | undefined;
    sale_date?: string | undefined;
    quantity?: unknown;
    unit_price?: unknown;
    discount_amount?: unknown;
    discount_percentage?: unknown;
    coupon_code?: string | undefined;
    platform?: string | undefined;
    customer_name?: string | undefined;
    notes?: string | undefined;
}>;
export declare const updateSaleSchema: z.ZodObject<{
    product_id: z.ZodOptional<z.ZodNumber>;
    variant_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    sale_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    unit_price: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    discount_amount: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    discount_percentage: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    coupon_code: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    platform: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    customer_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    product_id?: number | undefined;
    variant_id?: number | null | undefined;
    sale_date?: string | undefined;
    quantity?: number | undefined;
    unit_price?: number | undefined;
    discount_amount?: number | undefined;
    discount_percentage?: number | undefined;
    coupon_code?: string | undefined;
    platform?: string | undefined;
    customer_name?: string | undefined;
    notes?: string | undefined;
}, {
    product_id?: number | undefined;
    variant_id?: number | null | undefined;
    sale_date?: string | undefined;
    quantity?: unknown;
    unit_price?: unknown;
    discount_amount?: unknown;
    discount_percentage?: unknown;
    coupon_code?: string | undefined;
    platform?: string | undefined;
    customer_name?: string | undefined;
    notes?: string | undefined;
}>;
//# sourceMappingURL=sales.d.ts.map