# Product Variants

## What It Does

Variants let a single product have multiple versions — different sizes, colours, materials, or any other attributes — without creating separate products for each one. They share the same cost structure but can have their own price, SKU, and stock level.

---

## When to Use Variants

Use variants when you make the same thing in more than one option that a customer would choose between. For example:

- A candle in Small / Medium / Large
- A tote bag in Natural / Black / Navy
- A print in A4 / A3 / A2

Rather than duplicating the product three times, you create one product and define the variants on it.

---

## Setting Up Variants

On the Create or Edit Product screen, toggle on **"This product has variants"**.

### Step 1 — Define Attributes
Tell PriceMe what the options are called and what values are available:

| Attribute | Values |
|-----------|--------|
| Size | Small, Medium, Large |
| Colour | Red, Blue, Green |

### Step 2 — Generate the Matrix
PriceMe automatically creates every combination. Three sizes × three colours = nine variants. You can remove any combinations you don't actually offer.

### Step 3 — Set Per-Variant Overrides
For each variant you can optionally set:
- **Price override** — if this size/colour costs more or less than the base price
- **SKU** — a unique product code for this variant
- **Initial stock** — how many you currently have

If you don't set a price override, the variant inherits the base product's price.

---

## How Variants Appear in the Products List

Products with variants show a **variant count badge** (e.g. "6 variants"). You can expand the row to see all variants as sub-rows, each with their own stock, price, and margin figures.

---

## Sales & Stock Per Variant

When you record a sale on the On Sale page, you can select which variant was sold. Stock is tracked separately per variant, so you always know exactly how many of each version you have left.

---

## Pricing Logic

1. If a variant has a **price override** set → that price is used
2. Otherwise → the base product's price is used

The cost structure (materials, labour, other costs) is shared across all variants unless a cost override is explicitly set.

---

## Backward Compatibility

Products without variants work exactly as before. Variants are completely opt-in — adding or removing the feature on a product doesn't affect anything else.

---

## What's Next

- Variant-level material differences (e.g. a Large uses more fabric than a Small)
- Bulk update price or stock across all variants at once
- Variant image support
