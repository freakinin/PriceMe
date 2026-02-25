/**
 * Unit tests for profitCalculations.ts
 *
 * Covers all exported functions including fee-aware calculations.
 * See docs/PROFIT_CALCULATION_SPEC.md for the full specification.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProfitFromPrice,
  calculatePriceFromMargin,
  calculatePriceFromMarkup,
  calculatePriceFromProfit,
  calculateBreakEvenPrice,
  calculateNetProfitWithFees,
  calculatePriceForTargetNetProfit,
  calculatePriceForTargetNetMargin,
  type PlatformFeeConfig,
} from '../profitCalculations';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Etsy US fee profile (no VAT, standard payment processing). */
const ETSY_US: PlatformFeeConfig = {
  listing_fee_usd: 0.20,
  transaction_fee_pct: 6.5,
  payment_processing_pct: 3.0,
  payment_processing_flat: 0.25,
  offsite_ads_enabled: false,
  offsite_ads_pct: 15,
  currency_conversion_pct: 0,
  vat_on_fees_pct: 0,
  fees_apply_to_shipping: true,
};

/** Etsy UK fee profile (20% VAT on fees). */
const ETSY_UK: PlatformFeeConfig = {
  listing_fee_usd: 0.20,
  transaction_fee_pct: 6.5,
  payment_processing_pct: 4.0,
  payment_processing_flat: 0.20,
  offsite_ads_enabled: false,
  offsite_ads_pct: 15,
  currency_conversion_pct: 0,
  vat_on_fees_pct: 20,
  fees_apply_to_shipping: true,
};

/** Fee profile with offsite ads enabled. */
const ETSY_OFFSITE: PlatformFeeConfig = {
  ...ETSY_US,
  offsite_ads_enabled: true,
  offsite_ads_pct: 15,
};

/** Zero-fee profile for baseline testing. */
const NO_FEES: PlatformFeeConfig = {
  listing_fee_usd: 0,
  transaction_fee_pct: 0,
  payment_processing_pct: 0,
  payment_processing_flat: 0,
  offsite_ads_enabled: false,
  offsite_ads_pct: 0,
  currency_conversion_pct: 0,
  vat_on_fees_pct: 0,
  fees_apply_to_shipping: false,
};

// ── calculateProfitFromPrice ─────────────────────────────────────────────────

describe('calculateProfitFromPrice', () => {
  it('computes profit, margin, and markup for a normal sale', () => {
    const result = calculateProfitFromPrice(20, 10);
    expect(result.price).toBe(20);
    expect(result.profit).toBe(10);
    expect(result.margin).toBe(50); // (10/20)*100
    expect(result.markup).toBe(100); // (10/10)*100
  });

  it('handles zero cost (digital product)', () => {
    const result = calculateProfitFromPrice(15, 0);
    expect(result.profit).toBe(15);
    expect(result.margin).toBe(100);
    expect(result.markup).toBe(0); // cost = 0, markup undefined → 0
  });

  it('handles selling below cost (negative profit)', () => {
    // price > 0 so it is processed normally
    const result = calculateProfitFromPrice(5, 10);
    expect(result.profit).toBe(-5);
    expect(result.margin).toBeCloseTo(-100, 1); // -5/5 * 100
    expect(result.markup).toBe(-50); // -5/10 * 100
  });

  it('returns zeros when price is zero', () => {
    const result = calculateProfitFromPrice(0, 10);
    expect(result.profit).toBe(0);
    expect(result.margin).toBe(0);
    expect(result.markup).toBe(0);
  });

  it('returns zeros when price is negative', () => {
    const result = calculateProfitFromPrice(-5, 10);
    expect(result.profit).toBe(0);
    expect(result.margin).toBe(0);
    expect(result.markup).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateProfitFromPrice(15, 8);
    expect(result.margin).toBe(46.67); // (7/15)*100 = 46.666...
    expect(result.markup).toBe(87.5);  // (7/8)*100
  });
});

// ── calculatePriceFromMargin ──────────────────────────────────────────────────

describe('calculatePriceFromMargin', () => {
  it('computes price from 30% margin', () => {
    // Price = 10 / (1 - 0.30) = 14.29
    const result = calculatePriceFromMargin(30, 10);
    expect(result.price).toBe(14.29);
    expect(result.profit).toBe(4.29);
    expect(result.margin).toBe(30);
  });

  it('computes price from 50% margin', () => {
    const result = calculatePriceFromMargin(50, 10);
    expect(result.price).toBe(20);
    expect(result.profit).toBe(10);
    expect(result.markup).toBe(100);
  });

  it('returns cost at 0% margin (break-even)', () => {
    const result = calculatePriceFromMargin(0, 10);
    expect(result.price).toBe(10);
    expect(result.profit).toBe(0);
    expect(result.margin).toBe(0);
  });

  it('clamps margin to 99.99% to prevent division by zero', () => {
    const result = calculatePriceFromMargin(100, 10);
    expect(result.price).toBeGreaterThan(0);
    expect(result.price).toBeLessThan(Infinity);
  });

  it('returns zeros when cost is negative', () => {
    const result = calculatePriceFromMargin(30, -5);
    expect(result.price).toBe(0);
    expect(result.profit).toBe(0);
  });

  it('returns cost=0 → price=0 at any margin', () => {
    const result = calculatePriceFromMargin(50, 0);
    expect(result.price).toBe(0);
  });
});

// ── calculatePriceFromMarkup ──────────────────────────────────────────────────

describe('calculatePriceFromMarkup', () => {
  it('computes price from 100% markup', () => {
    const result = calculatePriceFromMarkup(100, 15);
    expect(result.price).toBe(30);
    expect(result.profit).toBe(15);
    expect(result.margin).toBe(50); // 50% margin at 100% markup
  });

  it('computes price from 50% markup', () => {
    const result = calculatePriceFromMarkup(50, 10);
    expect(result.price).toBe(15);
    expect(result.profit).toBe(5);
    expect(result.margin).toBeCloseTo(33.33, 1);
  });

  it('returns cost at 0% markup', () => {
    const result = calculatePriceFromMarkup(0, 10);
    expect(result.price).toBe(10);
    expect(result.profit).toBe(0);
  });

  it('returns zeros for negative cost', () => {
    const result = calculatePriceFromMarkup(50, -10);
    expect(result.price).toBe(0);
  });

  it('returns zeros for negative markup', () => {
    const result = calculatePriceFromMarkup(-10, 10);
    expect(result.price).toBe(0);
  });

  it('cost=0 always produces price=0', () => {
    const result = calculatePriceFromMarkup(200, 0);
    expect(result.price).toBe(0);
  });
});

// ── calculatePriceFromProfit ──────────────────────────────────────────────────

describe('calculatePriceFromProfit', () => {
  it('computes price from desired profit amount', () => {
    const result = calculatePriceFromProfit(5, 10);
    expect(result.price).toBe(15);
    expect(result.profit).toBe(5);
    expect(result.margin).toBeCloseTo(33.33, 1);
    expect(result.markup).toBe(50);
  });

  it('returns cost at $0 desired profit (break-even)', () => {
    const result = calculatePriceFromProfit(0, 10);
    expect(result.price).toBe(10);
    expect(result.profit).toBe(0);
  });

  it('returns zeros for negative profit input', () => {
    const result = calculatePriceFromProfit(-5, 10);
    expect(result.price).toBe(0);
  });

  it('returns zeros for negative cost', () => {
    const result = calculatePriceFromProfit(5, -10);
    expect(result.price).toBe(0);
  });

  it('handles zero cost with desired profit', () => {
    const result = calculatePriceFromProfit(20, 0);
    expect(result.price).toBe(20);
    expect(result.profit).toBe(20);
    expect(result.margin).toBe(100);
    expect(result.markup).toBe(0); // cost = 0 → markup undefined → 0
  });
});

// ── calculateBreakEvenPrice ───────────────────────────────────────────────────

describe('calculateBreakEvenPrice', () => {
  it('returns cost as the break-even price', () => {
    expect(calculateBreakEvenPrice(12.5)).toBe(12.5);
  });

  it('returns 0 for zero cost', () => {
    expect(calculateBreakEvenPrice(0)).toBe(0);
  });

  it('clamps negative cost to 0 (cannot have negative break-even price)', () => {
    expect(calculateBreakEvenPrice(-5)).toBe(0);
  });
});

// ── calculateNetProfitWithFees (forward, Etsy US) ────────────────────────────

describe('calculateNetProfitWithFees — Etsy US', () => {
  it('correctly deducts platform fees from profit', () => {
    // Price $20, no shipping, no tax
    // listingFee = 0.20
    // transactionFee = 20 * 0.065 = 1.30
    // paymentProcessingFee = 20 * 0.03 + 0.25 = 0.60 + 0.25 = 0.85
    // total = 0.20 + 1.30 + 0.85 = 2.35
    // netRevenue = 20 - 2.35 = 17.65
    // netProfitPreTax = 17.65 - 8 = 9.65
    const result = calculateNetProfitWithFees(20, 8, 0, ETSY_US, 0);
    expect(result.grossPrice).toBe(20);
    expect(result.listingFee).toBe(0.20);
    expect(result.transactionFee).toBe(1.30);
    expect(result.paymentProcessingFee).toBe(0.85);
    expect(result.totalPlatformFees).toBe(2.35);
    expect(result.netRevenue).toBe(17.65);
    expect(result.productCost).toBe(8);
    expect(result.netProfitPreTax).toBe(9.65);
    expect(result.taxAmount).toBe(0);
    expect(result.takeHomeProfit).toBe(9.65);
  });

  it('includes shipping in fee base when fees_apply_to_shipping is true', () => {
    // feeBase = price($20) + shipping($5) = $25
    // transactionFee = 25 * 0.065 = 1.625 → 1.63
    // paymentProcessingFee = 25 * 0.03 + 0.25 = 0.75 + 0.25 = 1.00
    // listingFee = 0.20
    // total = 0.20 + 1.63 + 1.00 = 2.83
    // netRevenue = 20 + 5 - 2.83 = 22.17
    // netProfitPreTax = 22.17 - 8 - 5 = 9.17
    const result = calculateNetProfitWithFees(20, 8, 5, ETSY_US, 0);
    expect(result.shippingCost).toBe(5);
    expect(result.netRevenue).toBeCloseTo(22.17, 1);
    expect(result.netProfitPreTax).toBeCloseTo(9.17, 1);
    // Shipping pass-through: netProfit is same as with no shipping when buyer pays exact cost
  });

  it('applies income tax only to positive profit', () => {
    const result = calculateNetProfitWithFees(20, 8, 0, ETSY_US, 25); // 25% tax
    expect(result.taxAmount).toBeGreaterThan(0);
    expect(result.takeHomeProfit).toBe(
      Math.round((result.netProfitPreTax - result.taxAmount) * 100) / 100
    );
  });

  it('does not apply income tax when profit is negative', () => {
    // Very high cost — net profit will be negative
    const result = calculateNetProfitWithFees(10, 20, 0, ETSY_US, 30);
    expect(result.netProfitPreTax).toBeLessThan(0);
    expect(result.taxAmount).toBe(0); // No tax on losses
  });

  it('includes transactionFeePct in the breakdown', () => {
    const result = calculateNetProfitWithFees(20, 8, 0, ETSY_US, 0);
    expect(result.transactionFeePct).toBe(6.5); // actual rate, not back-calculated
  });
});

// ── calculateNetProfitWithFees — Etsy UK (VAT on fees) ──────────────────────

describe('calculateNetProfitWithFees — Etsy UK (20% VAT on fees)', () => {
  it('applies VAT on top of platform fees', () => {
    const result = calculateNetProfitWithFees(20, 8, 0, ETSY_UK, 0);
    // subtotalFees = listing(0.20) + transaction(20*0.065=1.30) + payment(20*0.04+0.20=1.00)
    // subtotal = 0.20 + 1.30 + 1.00 = 2.50
    // vatOnFees = 2.50 * 0.20 = 0.50
    // total = 3.00
    expect(result.subtotalPlatformFees).toBe(2.50);
    expect(result.vatOnFees).toBe(0.50);
    expect(result.totalPlatformFees).toBe(3.00);
    expect(result.netRevenue).toBe(17.00);
    expect(result.netProfitPreTax).toBe(9.00);
  });
});

// ── calculateNetProfitWithFees — Offsite Ads ─────────────────────────────────

describe('calculateNetProfitWithFees — offsite ads', () => {
  it('adds offsite ads fee when enabled', () => {
    const noAds = calculateNetProfitWithFees(20, 8, 0, ETSY_US, 0);
    const withAds = calculateNetProfitWithFees(20, 8, 0, ETSY_OFFSITE, 0);
    // offsiteAdsFee = 20 * 0.15 = 3.00
    expect(withAds.offsiteAdsFee).toBe(3.00);
    expect(withAds.netProfitPreTax).toBeLessThan(noAds.netProfitPreTax);
  });

  it('does not add offsite ads fee when disabled', () => {
    const result = calculateNetProfitWithFees(20, 8, 0, ETSY_US, 0);
    expect(result.offsiteAdsFee).toBe(0);
  });
});

// ── calculateNetProfitWithFees — no fees ─────────────────────────────────────

describe('calculateNetProfitWithFees — zero fees', () => {
  it('profit equals price minus cost when fees are zero', () => {
    const result = calculateNetProfitWithFees(20, 8, 0, NO_FEES, 0);
    expect(result.totalPlatformFees).toBe(0);
    expect(result.netRevenue).toBe(20);
    expect(result.netProfitPreTax).toBe(12);
    expect(result.takeHomeProfit).toBe(12);
  });
});

// ── calculatePriceForTargetNetProfit (reverse) ───────────────────────────────

describe('calculatePriceForTargetNetProfit', () => {
  it('round-trip: solving for price produces the target profit', () => {
    const targetProfit = 5;
    const cost = 8;
    const result = calculatePriceForTargetNetProfit(targetProfit, cost, 0, ETSY_US, 0);
    // Verify by forward-calculating the returned price
    const verify = calculateNetProfitWithFees(result.grossPrice, cost, 0, ETSY_US, 0);
    expect(verify.netProfitPreTax).toBeCloseTo(targetProfit, 1);
  });

  it('round-trip: works with shipping included in fees', () => {
    const targetProfit = 5;
    const cost = 8;
    const shipping = 4;
    const result = calculatePriceForTargetNetProfit(targetProfit, cost, shipping, ETSY_US, 0);
    const verify = calculateNetProfitWithFees(result.grossPrice, cost, shipping, ETSY_US, 0);
    expect(verify.netProfitPreTax).toBeCloseTo(targetProfit, 1);
  });

  it('round-trip: works with UK VAT on fees', () => {
    const targetProfit = 8;
    const cost = 10;
    const result = calculatePriceForTargetNetProfit(targetProfit, cost, 0, ETSY_UK, 0);
    const verify = calculateNetProfitWithFees(result.grossPrice, cost, 0, ETSY_UK, 0);
    expect(verify.netProfitPreTax).toBeCloseTo(targetProfit, 1);
  });

  it('returns price=0 when fees are impossibly high (> 100% of price)', () => {
    const impossibleFees: PlatformFeeConfig = {
      ...NO_FEES,
      transaction_fee_pct: 101,
    };
    const result = calculatePriceForTargetNetProfit(5, 10, 0, impossibleFees, 0);
    expect(result.grossPrice).toBe(0);
  });
});

// ── calculatePriceForTargetNetMargin (reverse) ───────────────────────────────

describe('calculatePriceForTargetNetMargin', () => {
  it('round-trip: solving for price produces the target margin', () => {
    const targetMarginPct = 30;
    const cost = 8;
    const result = calculatePriceForTargetNetMargin(targetMarginPct, cost, 0, ETSY_US, 0);
    const verify = calculateNetProfitWithFees(result.grossPrice, cost, 0, ETSY_US, 0);
    expect(verify.netMarginPreTax).toBeCloseTo(targetMarginPct, 1);
  });

  it('round-trip: works with shipping and VAT', () => {
    const targetMarginPct = 20;
    const cost = 10;
    const shipping = 3;
    const result = calculatePriceForTargetNetMargin(targetMarginPct, cost, shipping, ETSY_UK, 0);
    const verify = calculateNetProfitWithFees(result.grossPrice, cost, shipping, ETSY_UK, 0);
    expect(verify.netMarginPreTax).toBeCloseTo(targetMarginPct, 1);
  });

  it('clamps margin at 99.99% to prevent division by zero', () => {
    const result = calculatePriceForTargetNetMargin(100, 10, 0, ETSY_US, 0);
    // Should not throw; price may be 0 or a very large number
    expect(result).toBeDefined();
  });

  it('returns price=0 for impossible margin (fees + margin > 100%)', () => {
    const impossibleFees: PlatformFeeConfig = {
      ...NO_FEES,
      transaction_fee_pct: 70,
    };
    const result = calculatePriceForTargetNetMargin(40, 10, 0, impossibleFees, 0);
    expect(result.grossPrice).toBe(0);
  });
});
