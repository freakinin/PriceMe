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

