import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// User Settings schemas
export const updateUserSettingsSchema = z.object({
  currency: z.string().length(3),
  units: z.array(z.string()).min(1),
});

// Material schemas
export const createMaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  price_per_unit: z.number().nonnegative(),
  user_material_id: z.number().int().positive().optional(),
  units_made: z.number().positive().default(1),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// User Material schemas (for centralized materials library)
export const createUserMaterialSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  price_per_unit: z.number().nonnegative(),
  width: z.number().nonnegative().optional(),
  length: z.number().nonnegative().optional(),
  details: z.string().optional(),
  supplier: z.string().optional(),
  supplier_link: z.string().url().optional().or(z.literal('')),
  stock_level: z.number().nonnegative().optional(),
  reorder_point: z.number().nonnegative().optional(),
  last_purchased_date: z.string().optional(),
  last_purchased_price: z.number().nonnegative().optional(),
  category: z.string().optional(),
});

export const updateUserMaterialSchema = createUserMaterialSchema.partial();

// Labor schemas
export const createLaborSchema = z.object({
  activity: z.string().min(1),
  time_spent_minutes: z.number().int().positive(),
  hourly_rate: z.number().nonnegative(),
  per_unit: z.boolean().default(true),
});

export const updateLaborSchema = createLaborSchema.partial();

// Other Cost schemas
export const createOtherCostSchema = z.object({
  item: z.string().min(1),
  quantity: z.number().positive(),
  cost: z.number().nonnegative(),
  per_unit: z.boolean().default(true),
});

export const updateOtherCostSchema = createOtherCostSchema.partial();

// Product schemas (must be defined after material, labor, and other cost schemas)
export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'on_sale', 'inactive']).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  batch_size: z.number().int().positive().default(1),
  target_price: z.number().positive().optional(), // Calculated/resulting price
  pricing_method: z.enum(['markup', 'price', 'profit', 'margin']).optional(), // Which method user selected
  pricing_value: z.number().nonnegative().optional(), // The input value for the selected method
  materials: z.array(createMaterialSchema).optional(),
  labor_costs: z.array(createLaborSchema).optional(),
  other_costs: z.array(createOtherCostSchema).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Pricing data schemas
export const createPricingDataSchema = z.object({
  product_id: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  calculation_method: z.string().optional(),
  calculation_data: z.record(z.unknown()).optional(),
});

export const updatePricingDataSchema = createPricingDataSchema.partial();
