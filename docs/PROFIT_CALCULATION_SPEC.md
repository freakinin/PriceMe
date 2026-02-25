# Profit Calculation Methods Specification

**Last Updated**: 2026-02-24
**Status**: Current — all Phase 1 & 2 calculations implemented.

---

## Overview

PriceMe supports two modes of profit calculation:

1. **Simple mode** — price, margin, markup, and profit calculated directly from product cost with no platform overhead.
2. **Fee-aware mode** — same calculations, but accounting for platform fees (Etsy, etc.), shipping, VAT on fees, and income tax.

All utility functions live in `apps/web/src/utils/profitCalculations.ts`.
Product cost aggregation lives in `apps/api/src/controllers/productController.ts` (`calculateProductMetrics`).
Frontend hooks wire these together in `apps/web/src/hooks/useProductsPageState.ts`.

---

## Part 1 — Simple Calculations (No Fees)

### 1.1 Forward: Price → Profit

**Status**: ✅ Implemented
**Function**: `calculateProfitFromPrice(price, cost)` → `ProfitMetrics`

```
profit = price - cost
margin = (profit / price) × 100     [if price > 0, else 0]
markup = (profit / cost) × 100      [if cost > 0, else 0]
```

Edge cases:
- Returns `{ profit: 0, margin: 0, markup: 0 }` when `price <= 0` or `cost < 0`.
- Handles negative profit correctly (selling below cost).
- All results rounded to 2 decimal places.

**Example**: Price $20, Cost $8 → Profit $12, Margin 60%, Markup 150%

---

### 1.2 Reverse: Margin % → Price

**Status**: ✅ Implemented
**Function**: `calculatePriceFromMargin(marginPercent, cost)` → `ProfitMetrics`

```
price = cost / (1 - margin% / 100)
profit = price - cost
markup = (profit / cost) × 100      [if cost > 0]
```

Edge cases:
- `marginPercent` clamped to `[0, 99.99]` to prevent division by zero.
- At 0% margin: returns `price = cost`, `profit = 0`.
- At `cost = 0`: returns `price = 0` (cannot derive a price from zero cost via margin alone).
- Returns zeros when `cost < 0`.

**Example**: Cost $10, Margin 30% → Price $14.29, Profit $4.29, Markup 42.9%

---

### 1.3 Reverse: Markup % → Price

**Status**: ✅ Implemented
**Function**: `calculatePriceFromMarkup(markupPercent, cost)` → `ProfitMetrics`

```
price = cost × (1 + markup% / 100)
profit = price - cost
margin = (profit / price) × 100     [if price > 0]
```

Important: Markup % ≠ Margin %. 50% markup = 33.3% margin.

Edge cases:
- Returns zeros when `cost < 0` or `markupPercent < 0`.
- At `cost = 0`: returns `price = 0`.

**Example**: Cost $15, Markup 100% → Price $30, Profit $15, Margin 50%

---

### 1.4 Reverse: Target Profit $ → Price

**Status**: ✅ Implemented
**Function**: `calculatePriceFromProfit(profitAmount, cost)` → `ProfitMetrics`

```
price = cost + desiredProfit
margin = (profit / price) × 100     [if price > 0]
markup = (profit / cost) × 100      [if cost > 0]
```

Edge cases:
- Returns zeros when `cost < 0` or `profitAmount < 0`.
- At `cost = 0`: `price = profit`, `margin = 100%`, markup = 0 (undefined → 0).

**Example**: Cost $25, Desired Profit $20 → Price $45, Margin 44.4%, Markup 80%

---

### 1.5 Break-Even Price

**Status**: ✅ Implemented
**Function**: `calculateBreakEvenPrice(cost)` → `number`

```
breakEvenPrice = max(0, cost)
```

Returns the minimum price to avoid a loss (profit = $0). Negative cost is clamped to $0.

---

## Part 2 — Fee-Aware Calculations

Fee-aware mode accounts for all platform overhead so users know their **actual take-home profit**.

### 2.1 Platform Fee Config

**Interface**: `PlatformFeeConfig` (in `profitCalculations.ts`)

| Field | Type | Description |
|-------|------|-------------|
| `listing_fee_usd` | number | Flat per-sale fee (e.g. Etsy $0.20) |
| `transaction_fee_pct` | number | % of fee base (e.g. Etsy 6.5%) |
| `payment_processing_pct` | number | % of fee base for payment processing |
| `payment_processing_flat` | number | Flat per-transaction payment fee |
| `offsite_ads_enabled` | boolean | Whether offsite ads fee applies |
| `offsite_ads_pct` | number | % fee for offsite ad sales |
| `currency_conversion_pct` | number | % fee for currency conversion |
| `vat_on_fees_pct` | number | VAT on all platform fees (UK=20, AU=10, others=0) |
| `fees_apply_to_shipping` | boolean | Whether fees apply to shipping amount too (Etsy=true) |

---

### 2.2 Shipping — Pass-Through Model

PriceMe treats shipping as a **pass-through**: the seller charges the buyer exactly what they pay to ship. The net effect on profit is zero, but the platform charges fees on the shipping amount (when `fees_apply_to_shipping = true`), which does reduce profit.

The fee calculation makes this explicit:

```
feeBase = price + (fees_apply_to_shipping ? shippingCost : 0)

netRevenue = price + shippingCost - totalPlatformFees
netProfitPreTax = netRevenue - productCost - shippingCost
               = price - totalPlatformFees - productCost   [shipping cancels out]
```

The breakdown is shown transparently in the UI tooltip:
- **+ Shipping Collected** (from buyer)
- **─ Shipping Paid** (to carrier) — cancels the above

---

### 2.3 Forward: Price → Net Profit (with fees)

**Status**: ✅ Implemented
**Function**: `calculateNetProfitWithFees(price, productCost, shippingCost, fees, incomeTaxPct)` → `FeeBreakdown`

Full computation:

```
feeBase = price + (fees_apply_to_shipping ? shippingCost : 0)

listingFee              = listing_fee_usd
transactionFee          = feeBase × (transaction_fee_pct / 100)
paymentProcessingFee    = feeBase × (payment_processing_pct / 100) + payment_processing_flat
offsiteAdsFee           = offsite_ads_enabled ? feeBase × (offsite_ads_pct / 100) : 0
currencyConversionFee   = feeBase × (currency_conversion_pct / 100)

subtotalPlatformFees = listingFee + transactionFee + paymentProcessingFee
                     + offsiteAdsFee + currencyConversionFee
vatOnFees            = subtotalPlatformFees × (vat_on_fees_pct / 100)
totalPlatformFees    = subtotalPlatformFees + vatOnFees

netRevenue        = price + shippingCost - totalPlatformFees
netProfitPreTax   = netRevenue - productCost - shippingCost
taxAmount         = max(0, netProfitPreTax) × (incomeTaxPct / 100)
takeHomeProfit    = netProfitPreTax - taxAmount

netMarginPreTax   = (netProfitPreTax / price) × 100   [if price > 0]
takeHomeMargin    = (takeHomeProfit / price) × 100     [if price > 0]
```

Notes:
- Income tax only applies to positive profit — losses generate no tax credit.
- All monetary values rounded to 2 decimal places.
- `transactionFeePct` is included in `FeeBreakdown` at the actual rate for display purposes.

**Example** (Etsy US, $20 item, $8 cost, no shipping, no tax):
- Transaction fee: $20 × 6.5% = $1.30
- Payment processing: $20 × 3.0% + $0.25 = $0.85
- Listing fee: $0.20
- Total fees: $2.35
- Net revenue: $17.65
- Net profit (pre-tax): $9.65

---

### 2.4 Reverse: Target Net Profit → Price

**Status**: ✅ Implemented
**Function**: `calculatePriceForTargetNetProfit(targetNetProfitPreTax, productCost, shippingCost, fees, incomeTaxPct)` → `FeeBreakdown`

Solves `targetNetProfit = price - totalFees(price) - productCost` in closed form.

Since fees are linear in price: `totalFees(price) = flatFees + price × variablePct`

```
vatMult          = 1 + vat_on_fees_pct / 100
shippingBase     = fees_apply_to_shipping ? shippingCost : 0

variablePctOfPrice =
  (transaction_fee_pct + payment_processing_pct
   + [offsite_ads_pct if enabled] + currency_conversion_pct) / 100 × vatMult

flatFees =
  (listing_fee_usd + payment_processing_flat
   + shippingBase × (transaction_fee_pct + payment_processing_pct
                     + [offsite_ads_pct if enabled] + currency_conversion_pct) / 100) × vatMult

price = (targetNetProfit + productCost + flatFees) / (1 - variablePctOfPrice)
```

If `denominator ≤ 0` (fees exceed 100% of price — impossible scenario), returns `price = 0`.

---

### 2.5 Reverse: Target Net Margin % → Price

**Status**: ✅ Implemented
**Function**: `calculatePriceForTargetNetMargin(targetMarginPct, productCost, shippingCost, fees, incomeTaxPct)` → `FeeBreakdown`

Solves `targetMargin = (price - totalFees(price) - productCost) / price` in closed form.

```
targetMarginFrac = clamp(targetMarginPct / 100, 0, 0.9999)
denominator = 1 - variablePctOfPrice - targetMarginFrac
price = (productCost + flatFees) / denominator
```

If `denominator ≤ 0` (margin + fees exceed 100%), returns `price = 0`.

---

## Part 3 — Product Cost Aggregation

**Status**: ✅ Implemented
**Function**: `calculateProductMetrics(product)` in `apps/api/src/controllers/productController.ts`

### Materials

Material `total_cost` is stored at creation time:
```
total_cost = (quantity × price_per_unit) / units_made
```

At metrics time, all material `total_cost` values are summed directly:
```
totalMaterialsCost = sum(material.total_cost)
```

### Labor

Each labor entry has `per_unit` flag:
```
total_cost (DB) = (time_spent_minutes / 60) × hourly_rate

laborPerUnit = sum(total_cost where per_unit = true)
laborPerBatch = sum(total_cost where per_unit = false)
totalLaborPerProduct = laborPerUnit + (batch_size > 0 ? laborPerBatch / batch_size : 0)
```

### Other Costs

Each other cost entry has `per_unit` flag:
```
total_cost (DB) = quantity × cost

otherCostsPerUnit = sum(total_cost where per_unit = true)
otherCostsPerBatch = sum(total_cost where per_unit = false)
totalOtherPerProduct = otherCostsPerUnit + (batch_size > 0 ? otherCostsPerBatch / batch_size : 0)
```

### Total and Profit

```
productCost = totalMaterialsCost + totalLaborPerProduct + totalOtherPerProduct

profit      = targetPrice - productCost              [null if no target_price]
profitMargin = ((targetPrice - productCost) / targetPrice) × 100  [null if no target_price or targetPrice = 0]
costsPercentage = (productCost / targetPrice) × 100  [null if no target_price or targetPrice = 0]
```

Note: `profit` is calculated even when `productCost = 0` (e.g. digital goods). The old guard `productCost > 0` was a bug — see fix in commit history.

---

## Part 4 — Sales Discount Calculations

**Status**: ✅ Implemented
**Location**: `apps/api/src/controllers/salesController.ts` (`createSale`)

When a sale is created, the caller provides either `discount_amount` OR `discount_percentage` (not both). The missing field is derived:

```
totalValue = unit_price × quantity

if discount_amount > 0 and discount_percentage == 0:
    discount_percentage = (discount_amount / totalValue) × 100   [rounded to 2dp]

if discount_percentage > 0 and discount_amount == 0:
    discount_amount = totalValue × (discount_percentage / 100)   [rounded to 2dp]
```

Edge case: when `totalValue = 0`, percentage stays at 0 (no division by zero).

---

## Etsy Fee Defaults by Country

Configured in `apps/api/src/controllers/platformFeesController.ts`:

| Country | Payment % | Payment Flat | VAT on Fees |
|---------|-----------|--------------|-------------|
| US, CA  | 3.0%      | $0.25        | 0%          |
| GB      | 4.0%      | £0.20        | 20%         |
| AU      | 3.0%      | $0.25        | 10%         |
| DE, FR, IT, ES, NL | 4.0% | €0.30 | 0%        |

All countries: Listing fee $0.20, Transaction fee 6.5%, `fees_apply_to_shipping = true`.
Optional: Offsite ads 15% (disabled by default).

---

## Running the Tests

Unit tests cover all functions in this spec. Run them with:

```bash
# All unit tests (web + api)
npm run test:unit

# Watch mode (web only)
npm run test:watch --workspace=apps/web
```

Test files:
- `apps/web/src/utils/__tests__/profitCalculations.test.ts` — all profit/fee calculations
- `apps/web/src/utils/__tests__/productCalculations.test.ts` — material/labor/other cost helpers + aggregation logic
- `apps/api/src/__tests__/salesDiscount.test.ts` — discount bidirectional conversion

---

## Future Enhancements (Not Yet Implemented)

- **Take-home profit reverse calculation** — given a target *after-tax* profit, solve for price (currently only pre-tax target is supported)
- **Break-Even Analysis UI** — show the break-even price as a reference line on the products table
- **ROI-Based Pricing** — mathematically equivalent to markup, but framed for investment-focused sellers
- **Price Sensitivity Analysis** — show profit at a range of price points
- **Multi-product comparison** — side-by-side pricing strategy view
- **Bulk pricing tiers** — quantity-based pricing breaks
