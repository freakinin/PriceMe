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

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
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

