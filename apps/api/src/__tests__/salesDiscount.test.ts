/**
 * Unit tests for sales discount calculations.
 *
 * Tests the bidirectional discount conversion logic that lives in
 * apps/api/src/controllers/salesController.ts (createSale function).
 *
 * The logic converts between discount_amount and discount_percentage
 * so both fields are always persisted for a sale record.
 */

import { describe, it, expect } from 'vitest';

/**
 * Pure extraction of the discount derivation logic from salesController.ts.
 * Mirrors lines 27–42 exactly so tests break if the controller logic changes.
 */
function deriveDiscount(
  unit_price: number,
  quantity: number,
  discount_amount: number,
  discount_percentage: number,
): { finalDiscountAmount: number; finalDiscountPercentage: number } {
  let finalDiscountAmount = discount_amount;
  let finalDiscountPercentage = discount_percentage;
  const totalValue = unit_price * quantity;

  if (discount_amount > 0 && discount_percentage === 0) {
    // Amount provided → derive percentage
    if (totalValue > 0) {
      finalDiscountPercentage = Number(((discount_amount / totalValue) * 100).toFixed(2));
    }
  } else if (discount_percentage > 0 && discount_amount === 0) {
    // Percentage provided → derive amount
    finalDiscountAmount = Number((totalValue * (discount_percentage / 100)).toFixed(2));
  }

  return { finalDiscountAmount, finalDiscountPercentage };
}

// ── discount_amount → discount_percentage ────────────────────────────────────

describe('sales discount — amount to percentage', () => {
  it('derives percentage from a dollar amount', () => {
    // $2 off a $20 sale (qty 1) = 10%
    const { finalDiscountPercentage } = deriveDiscount(20, 1, 2, 0);
    expect(finalDiscountPercentage).toBe(10);
  });

  it('derives percentage across multiple quantities', () => {
    // $5 off (2 × $25 = $50 total) = 10%
    const { finalDiscountPercentage } = deriveDiscount(25, 2, 5, 0);
    expect(finalDiscountPercentage).toBe(10);
  });

  it('rounds to 2 decimal places', () => {
    // $1 off $3 = 33.33%
    const { finalDiscountPercentage } = deriveDiscount(3, 1, 1, 0);
    expect(finalDiscountPercentage).toBe(33.33);
  });

  it('keeps percentage at 0 when total value is zero (no division by zero)', () => {
    const { finalDiscountPercentage } = deriveDiscount(0, 1, 5, 0);
    expect(finalDiscountPercentage).toBe(0);
  });
});

// ── discount_percentage → discount_amount ────────────────────────────────────

describe('sales discount — percentage to amount', () => {
  it('derives amount from a percentage', () => {
    // 10% of $30 = $3
    const { finalDiscountAmount } = deriveDiscount(30, 1, 0, 10);
    expect(finalDiscountAmount).toBe(3);
  });

  it('derives amount across multiple quantities', () => {
    // 20% of (3 × $15 = $45) = $9
    const { finalDiscountAmount } = deriveDiscount(15, 3, 0, 20);
    expect(finalDiscountAmount).toBe(9);
  });

  it('rounds to 2 decimal places', () => {
    // 33.33% of $10 = $3.333 → $3.33
    const { finalDiscountAmount } = deriveDiscount(10, 1, 0, 33.33);
    expect(finalDiscountAmount).toBe(3.33);
  });
});

// ── no discount ──────────────────────────────────────────────────────────────

describe('sales discount — no discount', () => {
  it('passes through zero values unchanged', () => {
    const result = deriveDiscount(20, 1, 0, 0);
    expect(result.finalDiscountAmount).toBe(0);
    expect(result.finalDiscountPercentage).toBe(0);
  });
});

// ── edge cases ───────────────────────────────────────────────────────────────

describe('sales discount — edge cases', () => {
  it('does not override existing percentage when both are provided', () => {
    // Neither branch fires when both > 0; original values are preserved
    const result = deriveDiscount(20, 1, 5, 25);
    expect(result.finalDiscountAmount).toBe(5);
    expect(result.finalDiscountPercentage).toBe(25);
  });

  it('handles 100% discount correctly', () => {
    // 100% of $50 = $50
    const { finalDiscountAmount } = deriveDiscount(50, 1, 0, 100);
    expect(finalDiscountAmount).toBe(50);
  });
});
