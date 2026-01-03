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

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  batch_size: z.number().int().positive().default(1),
});

export const updateProductSchema = createProductSchema.partial();

// Material schemas
export const createMaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  price_per_unit: z.number().nonnegative(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// Pricing data schemas
export const createPricingDataSchema = z.object({
  product_id: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  calculation_method: z.string().optional(),
  calculation_data: z.record(z.unknown()).optional(),
});

export const updatePricingDataSchema = createPricingDataSchema.partial();
