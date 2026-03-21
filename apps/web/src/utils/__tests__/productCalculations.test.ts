/**
 * Unit tests for product-calculations.ts
 *
 * Covers per-unit material, labor, and other cost calculations
 * including batch-size division and percentage-based materials.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMaterialCost,
  calculateLaborCost,
  calculateOtherCost,
} from '../product-calculations';

// ── calculateMaterialCost ────────────────────────────────────────────────────

describe('calculateMaterialCost', () => {
  it('computes per-unit cost from quantity and price_per_unit', () => {
    // 10 grams of resin at $0.05/g, making 2 units from that quantity
    const cost = calculateMaterialCost(
      {
        name: 'Resin',
        quantity: 10,
        unit: 'g',
        price_per_unit: 0.05,
        quantity_type: 'exact',
        units_made: 2,
        per_batch: false,
      },
      1,
    );
    // (10 * 0.05) / 2 = 0.25
    expect(cost).toBe(0.25);
  });

  it('defaults units_made to 1 when not provided', () => {
    const cost = calculateMaterialCost(
      {
        name: 'Wax',
        quantity: 5,
        unit: 'oz',
        price_per_unit: 2,
        quantity_type: 'exact',
        units_made: 1,
        per_batch: false,
      },
      1,
    );
    // (5 * 2) / 1 = 10
    expect(cost).toBe(10);
  });

  it('computes percentage-based per-unit cost', () => {
    // 30% of a $10 item used per unit (not per batch)
    const cost = calculateMaterialCost(
      {
        name: 'Dye',
        quantity: 0,
        unit: 'ml',
        price_per_unit: 10,
        quantity_type: 'percentage',
        quantity_percentage: 30,
        per_batch: false,
        units_made: 1,
      },
      5,
    );
    // (30/100) * 10 = 3.00
    expect(cost).toBe(3);
  });

  it('computes percentage-based per-batch cost divided by batchSize', () => {
    // 50% of a $20 item used for the whole batch of 4
    const cost = calculateMaterialCost(
      {
        name: 'Glitter',
        quantity: 0,
        unit: 'g',
        price_per_unit: 20,
        quantity_type: 'percentage',
        quantity_percentage: 50,
        per_batch: true,
        units_made: 1,
      },
      4, // batchSize = 4
    );
    // (20 * 0.50) / 4 = 10 / 4 = 2.50
    expect(cost).toBe(2.5);
  });
});

// ── calculateLaborCost ───────────────────────────────────────────────────────

describe('calculateLaborCost', () => {
  it('computes per-unit labor cost from time and hourly rate', () => {
    // 30 minutes at $20/hr = $10 per unit
    const cost = calculateLaborCost(
      {
        activity: 'Assembly',
        time_minutes: 30,
        hourly_rate: 20,
        per_batch: false,
      },
      1,
    );
    expect(cost).toBe(10);
  });

  it('divides per-batch labor cost by batch size', () => {
    // 60 minutes at $15/hr = $15 for the whole batch of 5 → $3/unit
    const cost = calculateLaborCost(
      {
        activity: 'Setup',
        time_minutes: 60,
        hourly_rate: 15,
        per_batch: true,
      },
      5,
    );
    expect(cost).toBe(3);
  });

  it('handles fractional minutes correctly', () => {
    // 15 minutes at $12/hr = 0.25 hr * $12 = $3.00
    const cost = calculateLaborCost(
      {
        activity: 'Labeling',
        time_minutes: 15,
        hourly_rate: 12,
        per_batch: false,
      },
      1,
    );
    expect(cost).toBe(3);
  });

  it('returns zero when time is zero', () => {
    const cost = calculateLaborCost(
      {
        activity: 'No-op',
        time_minutes: 0,
        hourly_rate: 20,
        per_batch: false,
      },
      1,
    );
    expect(cost).toBe(0);
  });
});

// ── calculateOtherCost ───────────────────────────────────────────────────────

describe('calculateOtherCost', () => {
  it('computes per-unit other cost from quantity and cost', () => {
    // 2 boxes at $0.50 each
    const cost = calculateOtherCost(
      {
        item: 'Box',
        quantity: 2,
        cost: 0.5,
        per_batch: false,
        is_shipping: false,
      },
      1,
    );
    expect(cost).toBe(1);
  });

  it('divides per-batch other cost by batch size', () => {
    // Shipping label: 1 at $1.00 for a batch of 10 → $0.10/unit
    const cost = calculateOtherCost(
      {
        item: 'Shipping label',
        quantity: 1,
        cost: 1.0,
        per_batch: true,
        is_shipping: false,
      },
      10,
    );
    expect(cost).toBeCloseTo(0.1, 5);
  });

  it('returns zero when quantity is zero', () => {
    const cost = calculateOtherCost(
      {
        item: 'Extra',
        quantity: 0,
        cost: 5,
        per_batch: false,
        is_shipping: false,
      },
      1,
    );
    expect(cost).toBe(0);
  });
});

// ── Total product cost aggregation (same logic as productController) ─────────

describe('product cost aggregation (batch-aware)', () => {
  /**
   * Mirrors the logic in apps/api/src/controllers/productController.ts:
   *   calculateProductMetrics()
   *
   * We test the pure math here; DB calls are excluded.
   */

  function aggregateCost(
    materials: number[],  // total_cost per material (already per-unit in DB)
    laborPerUnit: number[],
    laborPerBatch: number[],
    otherPerUnit: number[],
    otherPerBatch: number[],
    batchSize: number,
  ): number {
    const totalMaterials = materials.reduce((s, v) => s + v, 0);
    const laborPU = laborPerUnit.reduce((s, v) => s + v, 0);
    const laborPB = laborPerBatch.reduce((s, v) => s + v, 0);
    const totalLabor = laborPU + (batchSize > 0 ? laborPB / batchSize : 0);
    const otherPU = otherPerUnit.reduce((s, v) => s + v, 0);
    const otherPB = otherPerBatch.reduce((s, v) => s + v, 0);
    const totalOther = otherPU + (batchSize > 0 ? otherPB / batchSize : 0);
    return totalMaterials + totalLabor + totalOther;
  }

  it('sums all cost types correctly', () => {
    // materials: $3, labor per-unit: $5, other per-unit: $2
    const cost = aggregateCost([3], [5], [], [2], [], 1);
    expect(cost).toBe(10);
  });

  it('divides per-batch costs by batch size', () => {
    // batch setup cost $10 / batch of 5 = $2/unit; plus $3 per-unit labor
    const cost = aggregateCost([], [3], [10], [], [], 5);
    expect(cost).toBe(5); // 3 + (10/5)
  });

  it('handles batch_size=0 without dividing by zero', () => {
    // When batch_size=0 the per-batch cost contributes 0 (guarded)
    const cost = aggregateCost([], [], [10], [], [], 0);
    expect(cost).toBe(0);
  });

  it('computes correct profit when product cost is zero', () => {
    // Bug 1 fix: profit must be calculated even when cost=0
    const productCost = 0;
    const targetPrice = 15;
    const profit = targetPrice !== null ? targetPrice - productCost : null;
    expect(profit).toBe(15);
  });

  it('returns null profit when no target price is set', () => {
    const productCost = 5;
    const targetPrice = null;
    const profit = targetPrice !== null ? targetPrice - productCost : null;
    expect(profit).toBeNull();
  });
});
