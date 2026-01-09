# Profit Calculation Methods Specification

## Overview

This document specifies the different methods for calculating and viewing profit predictions in the PriceMe application. The system supports multiple calculation approaches to help users determine optimal pricing strategies based on different business goals.

## Current Implementation

### Forward Calculation (Price → Profit)
- **Status**: ✅ Currently Implemented
- **Input**: Target Price + Product Cost
- **Output**: Profit & Profit Margin
- **Formula**: 
  - `Profit = Target Price - Product Cost`
  - `Profit Margin = (Profit / Target Price) × 100%`
- **Use Case**: Testing different prices to see resulting profit
- **Question Answered**: "If I sell at $X, what's my profit?"

---

## Alternative Calculation Methods

### 1. Margin-Based Pricing (Reverse Calculation)

**Status**: 🚧 To Be Implemented

**Description**: Calculate the required selling price based on a desired profit margin percentage.

**Input**: 
- Desired Profit Margin % (0-100)
- Product Cost

**Output**: 
- Required Selling Price
- Calculated Profit Amount
- Calculated Markup %

**Formulas**: 
```
Selling Price = Product Cost / (1 - Desired Margin %)
Profit = Selling Price - Product Cost
Markup % = (Profit / Product Cost) × 100%
```

**Example**: 
- Product Cost = $10.00
- Desired Margin = 30%
- Calculation: `Price = $10 / (1 - 0.30) = $10 / 0.70 = $14.29`
- Result: Profit = $4.29, Margin = 30%, Markup = 42.9%

**Use Case**: When you have an industry-standard margin goal or want to maintain consistent margins across products.

**Question Answered**: "I want 30% margin, what price should I charge?"

**UI Behavior**:
- User inputs desired margin percentage
- System calculates and displays required price
- Shows all related metrics (profit, markup) for comparison
- Real-time updates as margin changes

---

### 2. Markup-Based Pricing

**Status**: 🚧 To Be Implemented

**Description**: Calculate the required selling price based on a markup percentage applied to cost.

**Input**: 
- Markup % (applied to cost)
- Product Cost

**Output**: 
- Required Selling Price
- Calculated Profit Amount
- Calculated Profit Margin %

**Formulas**: 
```
Selling Price = Product Cost × (1 + Markup %)
Profit = Selling Price - Product Cost
Profit Margin % = (Profit / Selling Price) × 100%
```

**Example**: 
- Product Cost = $10.00
- Markup = 50%
- Calculation: `Price = $10 × 1.50 = $15.00`
- Result: Profit = $5.00, Margin = 33.3%, Markup = 50%

**Important Note**: 
- Markup % ≠ Margin %
- Markup is calculated on cost: `Markup = (Price - Cost) / Cost × 100%`
- Margin is calculated on price: `Margin = (Price - Cost) / Price × 100%`
- Example: 50% markup = 33.3% margin

**Use Case**: Cost-plus pricing strategy where you apply a standard markup to all products.

**Question Answered**: "I want 50% markup, what price should I charge?"

**UI Behavior**:
- User inputs markup percentage
- System calculates and displays required price
- Shows all related metrics (profit, margin) for comparison
- Real-time updates as markup changes

---

### 3. Target Profit Amount

**Status**: 🚧 To Be Implemented

**Description**: Calculate the required selling price to achieve a specific profit amount.

**Input**: 
- Desired Profit Amount ($)
- Product Cost

**Output**: 
- Required Selling Price
- Calculated Profit Margin %
- Calculated Markup %

**Formulas**: 
```
Selling Price = Product Cost + Desired Profit
Profit Margin % = (Desired Profit / Selling Price) × 100%
Markup % = (Desired Profit / Product Cost) × 100%
```

**Example**: 
- Product Cost = $10.00
- Desired Profit = $5.00
- Calculation: `Price = $10 + $5 = $15.00`
- Result: Margin = 33.3%, Markup = 50%

**Use Case**: When you have a specific profit goal per unit, regardless of percentage.

**Question Answered**: "I want $5 profit per unit, what price should I charge?"

**UI Behavior**:
- User inputs desired profit amount
- System calculates and displays required price
- Shows all related metrics (margin, markup) for comparison
- Real-time updates as profit amount changes

---

### 4. Break-Even Analysis

**Status**: 🚧 To Be Implemented (Future Enhancement)

**Description**: Calculate the minimum price required to break even (profit = $0).

**Input**: 
- Product Cost

**Output**: 
- Break-Even Price (minimum price)
- Profit = $0
- Margin = 0%
- Markup = 0%

**Formulas**: 
```
Break-Even Price = Product Cost
Profit = $0
Margin = 0%
Markup = 0%
```

**Use Case**: Risk analysis - understanding the absolute minimum price before losing money.

**Question Answered**: "What's the lowest price I can charge without losing money?"

**UI Behavior**:
- Automatically calculated from product cost
- Displayed as reference information
- Shows warning if current price is below break-even

---

### 5. ROI-Based Pricing

**Status**: 🚧 To Be Implemented (Future Enhancement)

**Description**: Calculate selling price based on desired return on investment percentage.

**Input**: 
- Desired ROI % (return on cost)
- Product Cost

**Output**: 
- Required Selling Price
- Calculated Profit Amount
- Calculated Profit Margin %

**Formulas**: 
```
Selling Price = Product Cost × (1 + ROI %)
Profit = Product Cost × ROI %
Profit Margin % = (ROI % / (1 + ROI %)) × 100%
```

**Example**: 
- Product Cost = $10.00
- ROI = 100%
- Calculation: `Price = $10 × 2.00 = $20.00`
- Result: Profit = $10.00, Margin = 50%

**Note**: ROI % is mathematically equivalent to Markup %, but framed differently for investment-focused businesses.

**Use Case**: Investment-focused pricing where ROI is the primary metric.

**Question Answered**: "I want 100% ROI, what price should I charge?"

---

## Comparison Matrix

| Method | Input | Primary Output | Secondary Metrics | Best For |
|--------|-------|---------------|-------------------|----------|
| **Price View** (Current) | Price + Cost | Profit & Margin | Markup | Testing different prices |
| **Margin View** | Margin % + Cost | Price | Profit, Markup | Industry-standard margins |
| **Markup View** | Markup % + Cost | Price | Profit, Margin | Cost-plus pricing |
| **Profit Goal View** | Profit $ + Cost | Price | Margin, Markup | Specific profit targets |
| **Break-Even View** | Cost | Min Price | All metrics = 0 | Risk analysis |
| **ROI View** | ROI % + Cost | Price | Profit, Margin | Investment focus |

---

## Implementation Plan

### Phase 1: Core Views (Current Sprint)
1. ✅ **Price View** - Already implemented
2. 🚧 **Margin View** - Calculate price from margin %
3. 🚧 **Markup View** - Calculate price from markup %
4. 🚧 **Profit Goal View** - Calculate price from profit amount

### Phase 2: Enhanced Views (Future)
5. **Break-Even View** - Show minimum viable price
6. **ROI View** - Investment-focused pricing

### Phase 3: Advanced Features (Future)
- Multi-view comparison (side-by-side)
- Historical price tracking
- Price sensitivity analysis
- Bulk pricing calculations

---

## UI/UX Design

### View Selector
- Location: Top of Products table
- Type: Tabs or Segmented Control
- Options: 
  - "Price View" (current)
  - "Margin View"
  - "Markup View"
  - "Profit Goal View"

### Table Columns (Dynamic Based on View)

#### Price View (Current)
- Product Name
- SKU
- **Desired Price** (editable)
- Product Cost
- Profit
- Profit Margin
- Costs (%)
- Qty Sold
- Profit (Qty)

#### Margin View
- Product Name
- SKU
- **Desired Margin %** (editable)
- Product Cost
- **Calculated Price** (computed)
- Profit
- Markup %
- Qty Sold
- Profit (Qty)

#### Markup View
- Product Name
- SKU
- **Desired Markup %** (editable)
- Product Cost
- **Calculated Price** (computed)
- Profit
- Profit Margin %
- Qty Sold
- Profit (Qty)

#### Profit Goal View
- Product Name
- SKU
- **Desired Profit $** (editable)
- Product Cost
- **Calculated Price** (computed)
- Profit Margin %
- Markup %
- Qty Sold
- Profit (Qty)

### Real-Time Updates
- All calculations update immediately when input values change
- Related metrics recalculate automatically
- Visual indicators for profitable vs. unprofitable scenarios
- Color coding: Green for positive, Red for negative

### Data Persistence
- Each view's input values saved per product
- Switching views preserves user inputs
- API updates when user edits values
- Optimistic UI updates for better UX

---

## Technical Implementation

### Calculation Utilities

```typescript
// Price → Profit (Current)
function calculateProfitFromPrice(price: number, cost: number): {
  profit: number;
  margin: number;
  markup: number;
}

// Margin → Price
function calculatePriceFromMargin(marginPercent: number, cost: number): {
  price: number;
  profit: number;
  markup: number;
}

// Markup → Price
function calculatePriceFromMarkup(markupPercent: number, cost: number): {
  price: number;
  profit: number;
  margin: number;
}

// Profit → Price
function calculatePriceFromProfit(profitAmount: number, cost: number): {
  price: number;
  margin: number;
  markup: number;
}
```

### State Management
- View mode stored in component state
- Per-product input values stored locally
- API sync on blur/save
- Optimistic updates for immediate feedback

### Validation Rules
- Margin: 0-100% (cannot exceed 100%)
- Markup: 0+% (no upper limit)
- Profit: Must be >= 0 (can be 0 for break-even)
- Price: Must be > 0

### Error Handling
- Invalid inputs show validation errors
- Negative values prevented where applicable
- Division by zero protection
- Clear error messages for edge cases

---

## Examples

### Example 1: Margin-Based Pricing
**Scenario**: Etsy seller wants 40% margin on handmade candles

- Product Cost: $8.00
- Desired Margin: 40%
- **Calculated Price**: $13.33
- Profit: $5.33
- Markup: 66.6%

### Example 2: Markup-Based Pricing
**Scenario**: Retailer applies 100% markup to all products

- Product Cost: $15.00
- Markup: 100%
- **Calculated Price**: $30.00
- Profit: $15.00
- Margin: 50%

### Example 3: Profit Goal Pricing
**Scenario**: Business needs $20 profit per unit to cover overhead

- Product Cost: $25.00
- Desired Profit: $20.00
- **Calculated Price**: $45.00
- Margin: 44.4%
- Markup: 80%

---

## Future Enhancements

1. **Multi-Product Comparison**: Compare pricing strategies across multiple products
2. **Price Sensitivity Analysis**: Show profit at different price points
3. **Bulk Pricing**: Calculate prices for different quantity tiers
4. **Historical Tracking**: Track price changes over time
5. **Export Reports**: Export pricing analysis to PDF/CSV
6. **Pricing Templates**: Save and reuse pricing strategies
7. **Market Comparison**: Compare against competitor pricing (if data available)

---

## Notes

- All calculations should handle edge cases (zero costs, extreme percentages)
- Rounding should be consistent (2 decimal places for currency)
- Performance: Calculations should be instant (no noticeable delay)
- Accessibility: All inputs should be keyboard navigable
- Mobile: Views should work well on mobile devices

---

**Last Updated**: 2024-01-XX
**Status**: Specification Complete, Implementation In Progress

