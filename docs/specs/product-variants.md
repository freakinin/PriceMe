# Product Variants Specification

## Overview

Support for product variants/listings to allow a single product to have multiple variations (e.g., size, color, material). Variants share the base product's cost structure but can have different prices, SKUs, and stock levels.

## Goals

- Allow products to have multiple variants without duplicating cost calculations
- Track stock and sales per variant
- Support variant-specific pricing
- Maintain backward compatibility with existing products (no variants)

## Database Schema

### New Tables

#### `product_variants`

```sql
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL, -- e.g., "Small - Red", "Medium - Blue"
  sku VARCHAR(100), -- Optional variant-specific SKU
  price_override DECIMAL(10, 2), -- Optional: different price from base product
  cost_override DECIMAL(10, 2), -- Optional: different cost (rare, but possible)
  stock INTEGER DEFAULT 0, -- Stock level for this variant
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, name)
);
```

#### `variant_attributes`

```sql
CREATE TABLE variant_attributes (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  attribute_name VARCHAR(50) NOT NULL, -- e.g., "size", "color", "material"
  attribute_value VARCHAR(100) NOT NULL, -- e.g., "Small", "Red", "Cotton"
  display_order INTEGER DEFAULT 0, -- For ordering attributes in UI
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(variant_id, attribute_name)
);
```

### Schema Changes to Existing Tables

#### `products`

- No changes required (variants are optional)
- Existing products work as "base products" with no variants

#### `sales` (when implemented)

- Add `variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL`
- NULL variant_id means sale of base product

## Data Model

### Variant Structure

```
Product: "T-Shirt"
├─ Variant 1: "Small - Red"
│  ├─ Attribute: size = "Small"
│  └─ Attribute: color = "Red"
├─ Variant 2: "Medium - Red"
│  ├─ Attribute: size = "Medium"
│  └─ Attribute: color = "Red"
└─ Variant 3: "Large - Blue"
   ├─ Attribute: size = "Large"
   └─ Attribute: color = "Blue"
```

### Pricing Logic

- If `variant.price_override` exists → use it
- Otherwise → use `product.target_price`
- Same logic for cost overrides

### Stock Logic

- Variant stock tracked separately in `product_variants.stock`
- Base product stock (if no variants) uses existing `batch_size - qty_sold` logic
- When variants exist, base product stock = sum of all variant stocks

## API Endpoints

### Variant Management

#### `POST /api/products/:productId/variants`

Create a new variant for a product.

**Request Body:**

```json
{
  "name": "Small - Red",
  "sku": "TSHIRT-SM-RED",
  "price_override": 25.99,
  "cost_override": null,
  "stock": 10,
  "attributes": [
    { "name": "size", "value": "Small" },
    { "name": "color", "value": "Red" }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "product_id": 5,
    "name": "Small - Red",
    "sku": "TSHIRT-SM-RED",
    "price_override": 25.99,
    "cost_override": null,
    "stock": 10,
    "is_active": true,
    "attributes": [
      { "name": "size", "value": "Small" },
      { "name": "color", "value": "Red" }
    ]
  }
}
```

#### `GET /api/products/:productId/variants`

Get all variants for a product.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Small - Red",
      "sku": "TSHIRT-SM-RED",
      "price_override": 25.99,
      "stock": 10,
      "attributes": [...]
    }
  ]
}
```

#### `PUT /api/products/:productId/variants/:variantId`

Update a variant.

**Request Body:**

```json
{
  "name": "Small - Red",
  "sku": "TSHIRT-SM-RED-NEW",
  "price_override": 24.99,
  "stock": 15,
  "is_active": true
}
```

#### `DELETE /api/products/:productId/variants/:variantId`

Delete a variant (soft delete by setting `is_active = false` or hard delete).

### Product Endpoints Updates

#### `GET /api/products`

Include variants in response (optional query param `?include_variants=true`).

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": 5,
      "name": "T-Shirt",
      "target_price": 25.0,
      "variants": [
        {
          "id": 1,
          "name": "Small - Red",
          "price_override": 25.99,
          "stock": 10
        }
      ]
    }
  ]
}
```

## UI Components

### Add/Edit Product Page

#### Variants Section

- New section: "Product Variants" (optional)
- Toggle: "This product has variants"
- When enabled:
  - **Variant Builder**:
    - Attribute types selector (e.g., Size, Color, Material)
    - Generate variants from attribute combinations
    - Or manually add variants one by one
  - **Variant List**:
    - Table/cards showing all variants
    - Edit variant name, SKU, price override, stock
    - Delete variant
  - **Variant Details**:
    - Name (auto-generated from attributes or manual)
    - SKU (optional)
    - Price Override (optional)
    - Cost Override (optional, rare)
    - Initial Stock

#### Variant Generation

- **Option 1: Attribute-based**
  - Select attribute types: Size, Color
  - Define values: Size = [Small, Medium, Large], Color = [Red, Blue]
  - Auto-generate: 3 × 2 = 6 variants
- **Option 2: Manual**
  - Add variants one by one
  - Custom name for each

### Products Page

#### Variant Display

- **Option A: Expandable Rows**
  - Base product row shows summary
  - Click to expand and show variants
  - Each variant as sub-row
- **Option B: Separate Rows**
  - Each variant appears as separate row
  - Parent product name shown with variant name
  - Example: "T-Shirt - Small - Red"

#### Variant Indicators

- Badge showing variant count: "3 variants"
- Icon indicating product has variants
- Stock shown per variant

### On Sale Page

#### Variant Support

- Show variants as separate rows or expandable
- Track sales per variant
- Stock calculation per variant
- Revenue/profit calculated per variant

### Sales Recording (when implemented)

- Select variant when recording sale
- If no variants, record sale on base product
- Variant-specific pricing in sales records

## Migration Strategy

### Phase 1: Database Setup

1. Create `product_variants` table
2. Create `variant_attributes` table
3. No data migration needed (backward compatible)

### Phase 2: API Implementation

1. Add variant CRUD endpoints
2. Update product endpoints to optionally include variants
3. Maintain backward compatibility

### Phase 3: UI Implementation

1. Add variants section to Add/Edit Product
2. Update Products page to show variants
3. Update On Sale page for variant support
4. Update Sales recording (when implemented)

### Backward Compatibility

- Products without variants work exactly as before
- Existing API calls continue to work
- Variants are opt-in feature

## Business Rules

1. **Variant Naming**
   - Must be unique per product
   - Auto-generated from attributes or manual entry
   - Display format: "Attribute1 - Attribute2" or custom

2. **Pricing**
   - Variant price override takes precedence over base price
   - If no override, use base product price
   - Cost override only if variant has different cost structure (rare)

3. **Stock Management**
   - Stock tracked per variant
   - Base product stock = sum of variant stocks (if variants exist)
   - Stock reduction happens at variant level

4. **Sales Tracking**
   - Sales linked to specific variant
   - If variant deleted, sales records keep variant_id (historical data)

5. **Product Deletion**
   - Deleting product cascades to variants
   - Variant attributes cascade delete

## Edge Cases

1. **Product with variants → Remove all variants**
   - Product becomes base product again
   - Stock handling needs decision (sum or reset?)

2. **Variant with sales → Delete variant**
   - Soft delete (is_active = false) recommended
   - Or hard delete with sales records keeping variant_id

3. **Price changes**
   - Changing base product price affects variants without price_override
   - Variants with price_override unaffected

4. **Stock updates**
   - Updating variant stock doesn't affect base product
   - Base product stock is calculated, not stored

## Future Enhancements

1. **Variant Images**
   - Each variant can have its own image
   - Display in product listings

2. **Variant-Specific Materials**
   - Some variants might use different materials
   - Track cost differences per variant

3. **Bulk Variant Operations**
   - Update price for all variants
   - Update stock for all variants
   - Generate variants from CSV

4. **Variant Templates**
   - Save common variant combinations
   - Quick variant generation

## Open Questions

1. **Stock Calculation**: When variants exist, should base product stock be:
   - Sum of all variant stocks?
   - Separate base product stock?
   - Hidden/not applicable?

2. **Cost Override**: When would a variant have different cost?
   - Different materials?
   - Different labor?
   - Should we support this or keep costs at product level?

3. **Variant Limit**: Maximum variants per product?
   - No limit?
   - Performance considerations?

4. **Attribute Management**: Should attribute types be:
   - Free-form (user types "size", "color", etc.)?
   - Predefined list?
   - Both?
