import { Response } from 'express';
import { db } from '../utils/db.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';

const platformFeeProfileSchema = z.object({
  name: z.string().min(1).max(100),
  is_default: z.boolean().optional(),
  listing_fee_usd: z.number().min(0),
  transaction_fee_pct: z.number().min(0).max(100),
  payment_processing_pct: z.number().min(0).max(100),
  payment_processing_flat: z.number().min(0),
  offsite_ads_enabled: z.boolean(),
  offsite_ads_pct: z.number().min(0).max(100),
  currency_conversion_pct: z.number().min(0).max(100),
  vat_on_fees_pct: z.number().min(0).max(100),
  fees_apply_to_shipping: z.boolean(),
});

// Payment processing defaults by seller country for Etsy
const ETSY_PAYMENT_PROCESSING: Record<string, { pct: number; flat: number; vatOnFees: number }> = {
  US: { pct: 3.0, flat: 0.25, vatOnFees: 0 },
  GB: { pct: 4.0, flat: 0.20, vatOnFees: 20 },
  CA: { pct: 3.0, flat: 0.25, vatOnFees: 0 },
  AU: { pct: 3.0, flat: 0.25, vatOnFees: 10 },
  DE: { pct: 4.0, flat: 0.30, vatOnFees: 0 },
  FR: { pct: 4.0, flat: 0.30, vatOnFees: 0 },
  IT: { pct: 4.0, flat: 0.30, vatOnFees: 0 },
  ES: { pct: 4.0, flat: 0.30, vatOnFees: 0 },
  NL: { pct: 4.0, flat: 0.30, vatOnFees: 0 },
};

function getEtsyDefaults(sellerCountry: string) {
  const pp = ETSY_PAYMENT_PROCESSING[sellerCountry] ?? ETSY_PAYMENT_PROCESSING['US'];
  return {
    name: 'Etsy',
    is_default: true,
    listing_fee_usd: 0.20,
    transaction_fee_pct: 6.5,
    payment_processing_pct: pp.pct,
    payment_processing_flat: pp.flat,
    offsite_ads_enabled: false,
    offsite_ads_pct: 15.0,
    currency_conversion_pct: 0,
    vat_on_fees_pct: pp.vatOnFees,
    fees_apply_to_shipping: true,
  };
}

function formatProfile(p: any) {
  return {
    id: p.id,
    user_id: p.user_id,
    name: p.name,
    is_default: p.is_default,
    listing_fee_usd: Number(p.listing_fee_usd),
    transaction_fee_pct: Number(p.transaction_fee_pct),
    payment_processing_pct: Number(p.payment_processing_pct),
    payment_processing_flat: Number(p.payment_processing_flat),
    offsite_ads_enabled: p.offsite_ads_enabled,
    offsite_ads_pct: Number(p.offsite_ads_pct),
    currency_conversion_pct: Number(p.currency_conversion_pct),
    vat_on_fees_pct: Number(p.vat_on_fees_pct),
    fees_apply_to_shipping: p.fees_apply_to_shipping,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export const getPlatformFeeProfiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    let profiles = await db`
      SELECT * FROM platform_fee_profiles
      WHERE user_id = ${req.userId}
      ORDER BY is_default DESC, created_at ASC
    `;
    let rows = Array.isArray(profiles) ? profiles : profiles.rows || [];

    // Auto-seed Etsy profile if user has none
    if (rows.length === 0) {
      const settingsResult = await db`
        SELECT seller_country FROM user_settings WHERE user_id = ${req.userId}
      `;
      const settingsRows = Array.isArray(settingsResult) ? settingsResult : settingsResult.rows || [];
      const sellerCountry = settingsRows[0]?.seller_country || 'US';
      const defaults = getEtsyDefaults(sellerCountry);

      await db`
        INSERT INTO platform_fee_profiles (
          user_id, name, is_default, listing_fee_usd, transaction_fee_pct,
          payment_processing_pct, payment_processing_flat, offsite_ads_enabled,
          offsite_ads_pct, currency_conversion_pct, vat_on_fees_pct, fees_apply_to_shipping
        ) VALUES (
          ${req.userId}, ${defaults.name}, ${defaults.is_default},
          ${defaults.listing_fee_usd}, ${defaults.transaction_fee_pct},
          ${defaults.payment_processing_pct}, ${defaults.payment_processing_flat},
          ${defaults.offsite_ads_enabled}, ${defaults.offsite_ads_pct},
          ${defaults.currency_conversion_pct}, ${defaults.vat_on_fees_pct},
          ${defaults.fees_apply_to_shipping}
        )
      `;

      profiles = await db`
        SELECT * FROM platform_fee_profiles
        WHERE user_id = ${req.userId}
        ORDER BY is_default DESC, created_at ASC
      `;
      rows = Array.isArray(profiles) ? profiles : profiles.rows || [];
    }

    return res.json({ status: 'success', data: rows.map(formatProfile) });
  } catch (error: any) {
    console.error('getPlatformFeeProfiles error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch platform fee profiles' });
  }
};

export const createPlatformFeeProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const data = platformFeeProfileSchema.parse(req.body);

    // If new profile is default, unset others
    if (data.is_default) {
      await db`UPDATE platform_fee_profiles SET is_default = FALSE WHERE user_id = ${req.userId}`;
    }

    const result = await db`
      INSERT INTO platform_fee_profiles (
        user_id, name, is_default, listing_fee_usd, transaction_fee_pct,
        payment_processing_pct, payment_processing_flat, offsite_ads_enabled,
        offsite_ads_pct, currency_conversion_pct, vat_on_fees_pct, fees_apply_to_shipping
      ) VALUES (
        ${req.userId}, ${data.name}, ${data.is_default ?? false},
        ${data.listing_fee_usd}, ${data.transaction_fee_pct},
        ${data.payment_processing_pct}, ${data.payment_processing_flat},
        ${data.offsite_ads_enabled}, ${data.offsite_ads_pct},
        ${data.currency_conversion_pct}, ${data.vat_on_fees_pct},
        ${data.fees_apply_to_shipping}
      )
      RETURNING *
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.status(201).json({ status: 'success', data: formatProfile(rows[0]) });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation error', errors: error.errors });
    }
    console.error('createPlatformFeeProfile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to create platform fee profile' });
  }
};

export const updatePlatformFeeProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const profileId = parseInt(req.params.id, 10);
    if (isNaN(profileId)) return res.status(400).json({ status: 'error', message: 'Invalid profile ID' });

    // Verify ownership
    const existing = await db`
      SELECT id FROM platform_fee_profiles WHERE id = ${profileId} AND user_id = ${req.userId}
    `;
    const existingRows = Array.isArray(existing) ? existing : existing.rows || [];
    if (existingRows.length === 0) return res.status(404).json({ status: 'error', message: 'Profile not found' });

    const data = platformFeeProfileSchema.parse(req.body);

    // If setting as default, unset others
    if (data.is_default) {
      await db`UPDATE platform_fee_profiles SET is_default = FALSE WHERE user_id = ${req.userId}`;
    }

    const result = await db`
      UPDATE platform_fee_profiles SET
        name = ${data.name},
        is_default = ${data.is_default ?? false},
        listing_fee_usd = ${data.listing_fee_usd},
        transaction_fee_pct = ${data.transaction_fee_pct},
        payment_processing_pct = ${data.payment_processing_pct},
        payment_processing_flat = ${data.payment_processing_flat},
        offsite_ads_enabled = ${data.offsite_ads_enabled},
        offsite_ads_pct = ${data.offsite_ads_pct},
        currency_conversion_pct = ${data.currency_conversion_pct},
        vat_on_fees_pct = ${data.vat_on_fees_pct},
        fees_apply_to_shipping = ${data.fees_apply_to_shipping},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${profileId} AND user_id = ${req.userId}
      RETURNING *
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    return res.json({ status: 'success', data: formatProfile(rows[0]) });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: 'Validation error', errors: error.errors });
    }
    console.error('updatePlatformFeeProfile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update platform fee profile' });
  }
};

export const deletePlatformFeeProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const profileId = parseInt(req.params.id, 10);
    if (isNaN(profileId)) return res.status(400).json({ status: 'error', message: 'Invalid profile ID' });

    const result = await db`
      DELETE FROM platform_fee_profiles
      WHERE id = ${profileId} AND user_id = ${req.userId}
      RETURNING id
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Profile not found' });

    return res.json({ status: 'success', message: 'Profile deleted' });
  } catch (error: any) {
    console.error('deletePlatformFeeProfile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete platform fee profile' });
  }
};

export const getEtsyDefaults_handler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    const country = (req.query.country as string || 'US').toUpperCase();
    return res.json({ status: 'success', data: getEtsyDefaults(country) });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: 'Failed to get Etsy defaults' });
  }
};
