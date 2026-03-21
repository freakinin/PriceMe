
import { z } from 'zod';

// --- Schemas ---

export const materialItemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    price_per_unit: z.number().min(0),
    quantity_type: z.enum(['exact', 'percentage']).default('exact'),
    quantity_percentage: z.number().min(0).max(100).optional(),
    per_batch: z.boolean().default(false),
    units_made: z.number().min(1).default(1),
    user_material_id: z.number().optional(),
    stock_level: z.number().optional(), // Used for display/validation
});

export const laborItemSchema = z.object({
    activity: z.string().min(1, 'Activity is required'),
    time_minutes: z.number().min(0),
    hourly_rate: z.number().min(0),
    per_batch: z.boolean().default(false), // true if cost is per batch, false if per unit
});

export const otherCostItemSchema = z.object({
    item: z.string().min(1, 'Item is required'),
    quantity: z.number().min(0),
    cost: z.number().min(0),
    per_batch: z.boolean().default(false),
    is_shipping: z.boolean().default(false),
});

export const shippingScenarioSchema = z.object({
    name: z.string().min(1, 'Scenario name is required'),
    cost: z.number().nonnegative(),
});

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(), // For UI display of category name
    category_id: z.number().nullable().optional(),
    // Use coerce to handle HTML input strings
    batch_size: z.coerce.number().int().positive().min(1).default(1),
    target_price: z.coerce.number().nonnegative().optional(),
    pricing_method: z.enum(['markup', 'price', 'profit', 'margin']).optional(),
    pricing_value: z.coerce.number().optional(),
    materials: z.array(materialItemSchema),
    labor_costs: z.array(laborItemSchema),
    other_costs: z.array(otherCostItemSchema),
    shipping_scenarios: z.array(shippingScenarioSchema).max(4).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export type MaterialItem = z.infer<typeof materialItemSchema>;
export type LaborItem = z.infer<typeof laborItemSchema>;
export type OtherCostItem = z.infer<typeof otherCostItemSchema>;
export type ShippingScenario = z.infer<typeof shippingScenarioSchema>;
