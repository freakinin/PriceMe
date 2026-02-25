/**
 * Profit Calculation Utilities
 * 
 * Provides functions to calculate pricing and profit metrics using different methods:
 * - Price-based (forward): Price → Profit
 * - Margin-based (reverse): Margin % → Price
 * - Markup-based (reverse): Markup % → Price
 * - Profit-based (reverse): Profit $ → Price
 */

export interface ProfitMetrics {
  price: number;
  profit: number;
  margin: number; // Profit margin percentage
  markup: number; // Markup percentage
}

/**
 * Calculate profit metrics from a given price and cost
 * Forward calculation: Price → Profit
 */
export function calculateProfitFromPrice(price: number, cost: number): ProfitMetrics {
  if (price <= 0 || cost < 0) {
    return {
      price,
      profit: 0,
      margin: 0,
      markup: 0,
    };
  }

  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    price,
    profit,
    margin: Math.round(margin * 100) / 100, // Round to 2 decimal places
    markup: Math.round(markup * 100) / 100,
  };
}

/**
 * Calculate price and profit metrics from a desired margin percentage
 * Reverse calculation: Margin % → Price
 */
export function calculatePriceFromMargin(marginPercent: number, cost: number): ProfitMetrics {
  if (cost < 0) {
    return {
      price: 0,
      profit: 0,
      margin: 0,
      markup: 0,
    };
  }

  // Margin must be between 0 and 100 (exclusive of 100)
  const clampedMargin = Math.max(0, Math.min(99.99, marginPercent));
  
  if (clampedMargin === 0) {
    return {
      price: cost,
      profit: 0,
      margin: 0,
      markup: 0,
    };
  }

  const price = cost / (1 - clampedMargin / 100);
  const profit = price - cost;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    price: Math.round(price * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    margin: Math.round(clampedMargin * 100) / 100,
    markup: Math.round(markup * 100) / 100,
  };
}

/**
 * Calculate price and profit metrics from a markup percentage
 * Reverse calculation: Markup % → Price
 */
export function calculatePriceFromMarkup(markupPercent: number, cost: number): ProfitMetrics {
  if (cost < 0 || markupPercent < 0) {
    return {
      price: 0,
      profit: 0,
      margin: 0,
      markup: 0,
    };
  }

  const markup = Math.max(0, markupPercent);
  const price = cost * (1 + markup / 100);
  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return {
    price: Math.round(price * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    markup: Math.round(markup * 100) / 100,
  };
}

/**
 * Calculate price and profit metrics from a desired profit amount
 * Reverse calculation: Profit $ → Price
 */
export function calculatePriceFromProfit(profitAmount: number, cost: number): ProfitMetrics {
  if (cost < 0 || profitAmount < 0) {
    return {
      price: 0,
      profit: 0,
      margin: 0,
      markup: 0,
    };
  }

  const profit = Math.max(0, profitAmount);
  const price = cost + profit;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    price: Math.round(price * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    markup: Math.round(markup * 100) / 100,
  };
}

/**
 * Calculate break-even price (minimum price to break even)
 */
export function calculateBreakEvenPrice(cost: number): number {
  return Math.max(0, cost);
}

// ─── Fee-Aware Calculations ────────────────────────────────────────────────

export interface PlatformFeeConfig {
  listing_fee_usd: number;          // flat per sale
  transaction_fee_pct: number;      // % of (price + shipping when fees_apply_to_shipping)
  payment_processing_pct: number;
  payment_processing_flat: number;
  offsite_ads_enabled: boolean;
  offsite_ads_pct: number;
  currency_conversion_pct: number;
  vat_on_fees_pct: number;          // VAT on Etsy fees (UK=20, AU=10, others=0)
  fees_apply_to_shipping: boolean;  // Etsy = true
}

export interface FeeBreakdown {
  grossPrice: number;
  shippingCost: number;
  listingFee: number;
  transactionFee: number;
  transactionFeePct: number;  // actual rate from fee profile (for display)
  paymentProcessingFee: number;
  offsiteAdsFee: number;
  currencyConversionFee: number;
  subtotalPlatformFees: number;
  vatOnFees: number;
  totalPlatformFees: number;
  netRevenue: number;         // grossPrice + shippingCost - totalPlatformFees
  productCost: number;
  netProfitPreTax: number;    // netRevenue - productCost - shippingCost
  incomeTaxPct: number;
  taxAmount: number;
  takeHomeProfit: number;
  netMarginPreTax: number;    // netProfitPreTax / grossPrice × 100
  takeHomeMargin: number;     // takeHomeProfit / grossPrice × 100
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeFees(
  price: number,
  shippingCost: number,
  productCost: number,
  fees: PlatformFeeConfig,
  incomeTaxPct: number,
): FeeBreakdown {
  const feeBase = price + (fees.fees_apply_to_shipping ? shippingCost : 0);

  const listingFee = fees.listing_fee_usd;
  const transactionFee = feeBase * (fees.transaction_fee_pct / 100);
  const paymentProcessingFee = feeBase * (fees.payment_processing_pct / 100) + fees.payment_processing_flat;
  const offsiteAdsFee = fees.offsite_ads_enabled ? feeBase * (fees.offsite_ads_pct / 100) : 0;
  const currencyConversionFee = feeBase * (fees.currency_conversion_pct / 100);

  const subtotalPlatformFees = listingFee + transactionFee + paymentProcessingFee + offsiteAdsFee + currencyConversionFee;
  const vatOnFees = subtotalPlatformFees * (fees.vat_on_fees_pct / 100);
  const totalPlatformFees = subtotalPlatformFees + vatOnFees;

  // Shipping is treated as a pass-through: the seller collects shippingCost from the buyer
  // and pays the same amount to ship. The platform may charge fees on the shipping amount
  // (already included in feeBase above). Net revenue and net profit both reflect this:
  //   netRevenue = price + shippingCost - totalPlatformFees
  //   netProfitPreTax = netRevenue - productCost - shippingCost
  //                   = price - totalPlatformFees - productCost  (shipping cancels out)
  // Showing both sides makes the breakdown honest and the math visible in the UI.
  const netRevenue = price + shippingCost - totalPlatformFees;
  const netProfitPreTax = netRevenue - productCost - shippingCost;
  const taxAmount = Math.max(0, netProfitPreTax) * (incomeTaxPct / 100);
  const takeHomeProfit = netProfitPreTax - taxAmount;

  return {
    grossPrice: r2(price),
    shippingCost: r2(shippingCost),
    listingFee: r2(listingFee),
    transactionFee: r2(transactionFee),
    transactionFeePct: fees.transaction_fee_pct,
    paymentProcessingFee: r2(paymentProcessingFee),
    offsiteAdsFee: r2(offsiteAdsFee),
    currencyConversionFee: r2(currencyConversionFee),
    subtotalPlatformFees: r2(subtotalPlatformFees),
    vatOnFees: r2(vatOnFees),
    totalPlatformFees: r2(totalPlatformFees),
    netRevenue: r2(netRevenue),
    productCost: r2(productCost),
    netProfitPreTax: r2(netProfitPreTax),
    incomeTaxPct,
    taxAmount: r2(taxAmount),
    takeHomeProfit: r2(takeHomeProfit),
    netMarginPreTax: price > 0 ? r2((netProfitPreTax / price) * 100) : 0,
    takeHomeMargin: price > 0 ? r2((takeHomeProfit / price) * 100) : 0,
  };
}

/**
 * Forward: given a price, what is the net profit after platform fees and income tax?
 */
export function calculateNetProfitWithFees(
  price: number,
  productCost: number,
  shippingCost: number,
  fees: PlatformFeeConfig,
  incomeTaxPct: number,
): FeeBreakdown {
  return computeFees(price, shippingCost, productCost, fees, incomeTaxPct);
}

/**
 * Reverse: what price must I charge to net a target profit (pre-tax) after platform fees?
 *
 * Solves: targetNetProfit = price - totalFees(price) - productCost
 * where totalFees(price) = flatFee + price * variablePct (linear in price)
 *
 * Closed-form solution:
 *   price = (targetNetProfit + productCost + flatFee) / (1 - variablePct)
 */
export function calculatePriceForTargetNetProfit(
  targetNetProfitPreTax: number,
  productCost: number,
  shippingCost: number,
  fees: PlatformFeeConfig,
  incomeTaxPct: number,
): FeeBreakdown {
  // Variable fee rate (as fraction of price)
  const vatMult = 1 + fees.vat_on_fees_pct / 100;
  const shippingBase = fees.fees_apply_to_shipping ? shippingCost : 0;

  // Fees as % of price (transaction + payment_processing + offsite + currency)
  const variablePctOfPrice =
    (fees.transaction_fee_pct / 100 +
      fees.payment_processing_pct / 100 +
      (fees.offsite_ads_enabled ? fees.offsite_ads_pct / 100 : 0) +
      fees.currency_conversion_pct / 100) *
    vatMult;

  // Flat fees (per sale + per $1 of shipping)
  const flatFees =
    (fees.listing_fee_usd +
      fees.payment_processing_flat +
      shippingBase *
        (fees.transaction_fee_pct / 100 +
          fees.payment_processing_pct / 100 +
          (fees.offsite_ads_enabled ? fees.offsite_ads_pct / 100 : 0) +
          fees.currency_conversion_pct / 100)) *
    vatMult;

  const denominator = 1 - variablePctOfPrice;
  if (denominator <= 0) {
    // Fees exceed 100% — impossible to reach target, return 0 price
    return computeFees(0, shippingCost, productCost, fees, incomeTaxPct);
  }

  const price = (targetNetProfitPreTax + productCost + flatFees) / denominator;
  return computeFees(Math.max(0, r2(price)), shippingCost, productCost, fees, incomeTaxPct);
}

/**
 * Reverse: what price must I charge to achieve a target net margin (pre-tax) after platform fees?
 *
 * Solves: targetMargin = (price - totalFees(price) - productCost) / price
 *   → price * targetMargin = price - totalFees(price) - productCost
 *   → price * (1 - variablePct - targetMargin) = productCost + flatFee
 *   → price = (productCost + flatFee) / (1 - variablePct - targetMargin)
 */
export function calculatePriceForTargetNetMargin(
  targetMarginPct: number,
  productCost: number,
  shippingCost: number,
  fees: PlatformFeeConfig,
  incomeTaxPct: number,
): FeeBreakdown {
  const vatMult = 1 + fees.vat_on_fees_pct / 100;
  const shippingBase = fees.fees_apply_to_shipping ? shippingCost : 0;
  const targetMarginFrac = Math.min(0.9999, Math.max(0, targetMarginPct / 100));

  const variablePctOfPrice =
    (fees.transaction_fee_pct / 100 +
      fees.payment_processing_pct / 100 +
      (fees.offsite_ads_enabled ? fees.offsite_ads_pct / 100 : 0) +
      fees.currency_conversion_pct / 100) *
    vatMult;

  const flatFees =
    (fees.listing_fee_usd +
      fees.payment_processing_flat +
      shippingBase *
        (fees.transaction_fee_pct / 100 +
          fees.payment_processing_pct / 100 +
          (fees.offsite_ads_enabled ? fees.offsite_ads_pct / 100 : 0) +
          fees.currency_conversion_pct / 100)) *
    vatMult;

  const denominator = 1 - variablePctOfPrice - targetMarginFrac;
  if (denominator <= 0) {
    return computeFees(0, shippingCost, productCost, fees, incomeTaxPct);
  }

  const price = (productCost + flatFees) / denominator;
  return computeFees(Math.max(0, r2(price)), shippingCost, productCost, fees, incomeTaxPct);
}

