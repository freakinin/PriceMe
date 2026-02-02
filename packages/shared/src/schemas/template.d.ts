import { z } from 'zod';
export declare const createTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    default_batch_size: z.ZodOptional<z.ZodNumber>;
    default_pricing_method: z.ZodOptional<z.ZodEnum<["markup", "price", "profit", "margin"]>>;
    default_markup_percentage: z.ZodOptional<z.ZodNumber>;
    materials: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    labor_costs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    other_costs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    variants: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    category?: string | undefined;
    default_batch_size?: number | undefined;
    default_pricing_method?: "markup" | "price" | "profit" | "margin" | undefined;
    default_markup_percentage?: number | undefined;
    materials?: any[] | undefined;
    labor_costs?: any[] | undefined;
    other_costs?: any[] | undefined;
    variants?: any[] | undefined;
}, {
    name: string;
    description?: string | undefined;
    category?: string | undefined;
    default_batch_size?: number | undefined;
    default_pricing_method?: "markup" | "price" | "profit" | "margin" | undefined;
    default_markup_percentage?: number | undefined;
    materials?: any[] | undefined;
    labor_costs?: any[] | undefined;
    other_costs?: any[] | undefined;
    variants?: any[] | undefined;
}>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
//# sourceMappingURL=template.d.ts.map