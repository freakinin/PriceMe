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

// Profile schemas
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>;

// User Settings schemas
export const updateUserSettingsSchema = z.object({
  currency: z.string().length(3),
  units: z.array(z.string()).min(1),
});

// Material schemas
export const createMaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  price_per_unit: z.number().nonnegative(),
  user_material_id: z.number().int().positive().nullable().optional(),
  units_made: z.number().positive().default(1),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// Supplier schemas
export const createSupplierSchema = z.object({
  name: z.string().min(1),
  link: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export interface Supplier {
  id: number;
  user_id: number;
  name: string;
  link?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  material_count?: number;
  created_at: string;
  updated_at: string;
}

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
  supplier_id: z.number().int().positive().optional().nullable(),
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
  time_spent_minutes: z.number().nonnegative(),
  hourly_rate: z.number().nonnegative(),
  per_unit: z.boolean().default(true),
});

export const updateLaborSchema = createLaborSchema.partial();

// Other Cost schemas
export const createOtherCostSchema = z.object({
  item: z.string().min(1),
  quantity: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  per_unit: z.boolean().default(true),
});

export const updateOtherCostSchema = createOtherCostSchema.partial();

// Helper to preprocess number values (handles strings from form inputs)
const numericPreprocess = (val: unknown) => {
  if (typeof val === 'string') {
    if (val.trim() === '') return undefined;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
};

// Variant schemas
export const createVariantAttributeSchema = z.object({
  attribute_name: z.string().min(1),
  attribute_value: z.string().min(1),
  display_order: z.number().int().optional(),
});

export const createVariantSchema = z.object({
  id: z.number().int().optional(), // For updates/identification
  name: z.string().min(1),
  sku: z.string().optional(),
  price_override: z.preprocess(numericPreprocess, z.number().nonnegative()).optional(),
  cost_override: z.preprocess(numericPreprocess, z.number().nonnegative()).optional(),
  stock_level: z.preprocess(numericPreprocess, z.number().int().min(0)).default(0),
  is_active: z.boolean().default(true),
  attributes: z.array(createVariantAttributeSchema).optional(),
});

export const updateVariantSchema = createVariantSchema.partial();

// Product schemas (must be defined after material, labor, and other cost schemas)
export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'on_sale', 'inactive']).optional(),
  description: z.string().optional(),

  category: z.string().optional(), // Legacy string category
  category_id: z.number().int().positive().nullable().optional(),
  batch_size: z.preprocess(
    (val) => val === undefined ? 1 : numericPreprocess(val),
    z.number().int().positive()
  ),
  target_price: z.preprocess(numericPreprocess, z.number().nonnegative()).optional(), // Calculated/resulting price
  pricing_method: z.enum(['markup', 'price', 'profit', 'margin']).optional(), // Which method user selected
  pricing_value: z.preprocess(numericPreprocess, z.number().nonnegative()).optional(), // The input value for the selected method
  materials: z.array(createMaterialSchema).optional(),
  labor_costs: z.array(createLaborSchema).optional(),
  other_costs: z.array(createOtherCostSchema).optional(),
  variants: z.array(createVariantSchema).optional(),
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
// Bulk Operations schemas
export const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  status: z.enum(['draft', 'in_progress', 'on_sale', 'inactive']),
});

export const bulkUpdateCategorySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  category_id: z.number().int().positive().nullable(),
});

// Platform Fee Profile schemas
export const platformFeeProfileSchema = z.object({
  name: z.string().min(1).max(100),
  is_default: z.boolean().optional(),
  listing_fee_usd: z.preprocess(numericPreprocess, z.number().min(0)),
  transaction_fee_pct: z.preprocess(numericPreprocess, z.number().min(0).max(100)),
  payment_processing_pct: z.preprocess(numericPreprocess, z.number().min(0).max(100)),
  payment_processing_flat: z.preprocess(numericPreprocess, z.number().min(0)),
  offsite_ads_enabled: z.boolean(),
  offsite_ads_pct: z.preprocess(numericPreprocess, z.number().min(0).max(100)),
  currency_conversion_pct: z.preprocess(numericPreprocess, z.number().min(0).max(100)),
  vat_on_fees_pct: z.preprocess(numericPreprocess, z.number().min(0).max(100)),
  fees_apply_to_shipping: z.boolean(),
});

export type PlatformFeeProfileInput = z.infer<typeof platformFeeProfileSchema>;

export interface PlatformFeeProfile extends PlatformFeeProfileInput {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// Shipping Method schemas
export const shippingMethodSchema = z.object({
  name: z.string().min(1).max(100),
  cost: z.preprocess(numericPreprocess, z.number().min(0)),
  is_free_shipping: z.boolean(),
  is_default: z.boolean().optional(),
});

export type ShippingMethodInput = z.infer<typeof shippingMethodSchema>;

export interface ShippingMethod extends ShippingMethodInput {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export * from './template.js';
export * from './sales.js';
export * from './category.js';
export * from './coach.js';
